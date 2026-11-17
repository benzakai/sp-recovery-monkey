import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PubSub } from "@google-cloud/pubsub";
import { normalizeSettingsMessageTemplates } from "~/utils/messageTemplates";

const pubsub = new PubSub();

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const { message, topicNames } = await request.json();

  try {

    const storeId = session.shop;
    const combinedObject = {
      ...message,
      ...(topicNames.includes("settings") && message.settings ? {
        settings: normalizeSettingsMessageTemplates(message.settings),
      } : {}),
      STORE_ID: storeId,
    };
    const messageJson = JSON.stringify(combinedObject);

    const publishPromises = topicNames.map(async (topicName) => {

      const topic = pubsub.topic(topicName);

      // if (topicName === "settings") {
      //   console.log("[SETTINGS PUBSUB] Sending", JSON.stringify({
      //     shop: storeId,
      //     topic: topicName,
      //     payload: {
      //       settings: combinedObject.settings,
      //       greenAPIId: combinedObject.greenAPIId,
      //       storeId: combinedObject.storeId,
      //       greenAPIKey: "[REDACTED]",
      //       greenAPIUrl: combinedObject.greenAPIUrl,
      //       provider: combinedObject.provider,
      //       STORE_ID: combinedObject.STORE_ID,
      //     },
      //   }));
      // }

      const messageId = await topic.publishMessage({
        data: Buffer.from(messageJson),
      });

      // if (topicName === "settings") {
      //   console.log("[SETTINGS PUBSUB] Published", JSON.stringify({ shop: storeId, topic: topicName, messageId }));
      // }

      return messageId;
    });

    const messageIds = await Promise.all(publishPromises);
    console.log("messageIds from pubsubdata",messageIds);
    console.log("topicNames from pubsubdata",topicNames);

    // function listenForMessages(subscriptionNameOrId, timeout) {
    //   // References an existing subscription; if you are unsure if the
    //   // subscription will exist, try the optimisticSubscribe sample.
    //   const subscription = pubsub.subscription(subscriptionNameOrId);

    //   // Create an event handler to handle messages
    //   let messageCount = 0;
    //   const messageHandler = message => {
    //     console.log(`Received message ${message.id}:`);
    //     console.log(`\tData: ${message.data}`);
    //     console.log(`\tAttributes: ${message.attributes}`);
    //     messageCount += 1;

    //     // "Ack" (acknowledge receipt of) the message
    //     message.ack();
    //   };

    //   // Listen for new messages until timeout is hit
    //   subscription.on('message', messageHandler);

    //   // Wait a while for the subscription to run. (Part of the sample only.)
    //   setTimeout(() => {
    //     subscription.removeListener('message', messageHandler);
    //     console.log(`${messageCount} message(s) received.`);
    //   }, timeout * 1000);
    // }

    // await listenForMessages("messagesub", 1)
    
    
    return { success: 'Message published to pubSub', data: messageIds };

  } catch (error) {
    // if (topicNames.includes("settings")) {
    //   console.error("[SETTINGS PUBSUB] Failed", JSON.stringify({
    //     shop: session.shop,
    //     topics: topicNames,
    //     error: error instanceof Error ? error.message : String(error),
    //   }));
    // }
    return { error: error.message };
  }
}
