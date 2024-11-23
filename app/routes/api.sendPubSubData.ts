import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { PubSub } from "@google-cloud/pubsub";

const pubsub = new PubSub();

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const { message, topicNames } = await request.json();

  try {

    const storeId = session.shop;
    const combinedObject = { ...message, STORE_ID: storeId };

    const messageJson = JSON.stringify(combinedObject);

    const publishPromises = topicNames.map(async (topicName) => {

      const topic = pubsub.topic(topicName);

      const messageId = await topic.publishMessage({
        data: Buffer.from(messageJson),
      });

      return messageId;
    });

    const messageIds = await Promise.all(publishPromises);
    return { success: 'Message published to pubSub', data: messageIds };

  } catch (error) {
    return { error: error.message };
  }
}