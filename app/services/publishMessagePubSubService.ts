import { PubSub } from "@google-cloud/pubsub";

export default async function publishMessagePubSubService(topicName: string, messageString: string) {
    const pubsub = new PubSub();

    try {
        const topic = pubsub.topic(topicName);

        const messageId = await topic.publishMessage({
            data: Buffer.from(messageString),
        });

        console.log(`Message ${messageId} published to Pub/Sub topic ${topicName}`);
        return { success: true };

    } catch (error) {
        console.log("publishMessagePubSubService Error", error);
        return { success: false };
    }
}