import fireStoreFetchService from "~/services/fireStoreFetchService";
import { getOrCreateInstance } from "~/services/instance/instanceService";
import publishMessagePubSubService from "~/services/publishMessagePubSubService";
import readline from "node:readline";
import { Readable } from "node:stream";

const CHUNK_SIZE = 1000;

async function* streamJsonLines(response: Response) {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let partialLine = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = (partialLine + chunk).split(/\r?\n/);
      
      partialLine = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          yield JSON.parse(line);
        }
      }
    }
    
    if (partialLine.trim()) {
      yield JSON.parse(partialLine);
    }
  } finally {
    reader.releaseLock();
  }
}


function extractCustomer(json: any) {
  const phone = json?.defaultPhoneNumber?.phoneNumber;

  if (!phone) return null;

  return {
    name: json.displayName || "",
    phoneNumber: phone,
  };
}

async function publishInChunks({
  customers,
  instance,
  smartBulkMessage,
}: {
  customers: any[];
  instance: any;
  smartBulkMessage: any;
}) {
  const message = {
    customers,
    messageContent: smartBulkMessage,
    greenAPIId: instance.idInstance,
    storeId: instance.shop,
    greenAPIKey: instance.apiTokenInstance,
    greenAPIUrl: instance.apiUrl,
  };
  console.log("PUBLISHING MESSAGE TO PUBSUB >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", message)
    await publishMessagePubSubService(
      "bulk_sending",
      JSON.stringify(message)
    );
}

async function processBulkJsonl({
  url,
  instance,
  smartBulkMessage,
}: {
  url: string;
  instance: any;
  smartBulkMessage: any;
}) {
  const response = await fetch(url);

  if (!response.ok || !response.body) {
    throw new Error("Failed to download bulk JSONL file");
  }

  let batch: any[] = [];

  for await (const json of streamJsonLines(response)) {
    const customer = extractCustomer(json);

    if (!customer) continue; // ignoring customers without phone

    batch.push(customer);

    if (batch.length >= CHUNK_SIZE) {
      await publishInChunks({
        customers: batch,
        instance,
        smartBulkMessage,
      });

      batch = []; // resetting batch
    }
  }

  // sending remaining customers
  if (batch.length > 0) {
    await publishInChunks({
      customers: batch,
      instance,
      smartBulkMessage,
    });
  }
}


async function fetchBulkOperation(session: any, bulkOperationId: string) {
  const response = await fetch(
    `https://${session.shop}/admin/api/2026-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({
        query: `
          {
            bulkOperation(id: "${bulkOperationId}") {
              id
              status
              errorCode
              createdAt
              completedAt
              objectCount
              fileSize
              url
              partialDataUrl
            }
          }
        `,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch bulk operation details");
  }

  const json = await response.json();
  return json.data?.bulkOperation;
}

export async function handleBulkOperationFinish({
  payload,
  session,
  shop,
}: {
  payload: any;
  session: any;
  shop: string;
}) {

  const bulkOperation = await fetchBulkOperation(
    session,
    payload.admin_graphql_api_id
  );

  if (!bulkOperation?.url) {
    console.warn("Bulk operation has no URL");
    return;
  }

  const instance = await getOrCreateInstance(shop);

  let smartBulkMessage = await fireStoreFetchService(
    "SmartBulkMessage",
    shop
  );
  if (!smartBulkMessage?.content) {
    smartBulkMessage = {
      shop,
      header: "👋 Hi [Customer's Name],",
      content:
        "✨ Exciting news from our store ✨\n🎉 Limited-time sale!",
    };
  }

  await processBulkJsonl({
    url: bulkOperation.url,
    instance,
    smartBulkMessage,
  });

  // console.log("Bulk processing completed successfully");
}

