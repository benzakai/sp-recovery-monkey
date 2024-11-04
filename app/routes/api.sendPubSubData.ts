import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

import { PubSub } from "@google-cloud/pubsub";



 
const pubsub = new PubSub();


export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);
  const {message,topicNames} = await request.json();
  
  try {

      const storeId = session.shop;
      const combinedObject = { ...message, STORE_ID: storeId};
      console.log('combinedObject', combinedObject);
      
      // Convert the object to a JSON string
      const messageJson = JSON.stringify(combinedObject);

      // Loop through each topic and publish the message
      const publishPromises = topicNames.map(async (topicName) => {
        // Reference the topic
        const topic = pubsub.topic(topicName);

        // Publish the message to the current topic
        const messageId = await topic.publishMessage({
          data: Buffer.from(messageJson),
        });

        console.log(`Message ${messageId} published to topic: ${topicName}`);
        return messageId;
      });

      // Wait for all messages to be published
      const messageIds = await Promise.all(publishPromises);
      console.log(`Messages published to topics with IDs: ${messageIds.join(', ')}`);
      return {success:'Message published to pubSub',data:messageIds};
  } catch (error) {
      console.error('Error fetching qr ', error);
      return { error: error.message };
  }
}