import { Firestore, Timestamp } from "@google-cloud/firestore";
import { authenticate } from "~/shopify.server";

const firestoreDatabase = new Firestore();

const defaultOnboardingData = {
  hideOnboarding: false,
  step1: {
    connectWhatsapp: false,
    editMessage: false,
    sendTestMessage: false
  },
  step2: {
    startSync: false,
    chooseTone: false,
    installPreview: false
  },
  updatedAt: Timestamp.now()
};

export const action = async ({ request }: any) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const incomingData = await request.json();
    console.log("incoming data:", incomingData);

    const docRef = firestoreDatabase.collection("onboardingProgress").doc(shop);
    const docSnap = await docRef.get();

    let existingData = {};

    if (docSnap.exists) {
      existingData = docSnap.data() ?? {};
    }

    const finalData = deepMerge(defaultOnboardingData, existingData, incomingData);

    finalData.updatedAt = Timestamp.now();

    await docRef.set(finalData, { merge: true });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.log("error occured on create onboarding", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
};

function deepMerge(...objects: any[]) {
  const result: any = {};

  for (const obj of objects) {
    for (const key in obj) {
      if (
        typeof obj[key] === "object" &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        result[key] = deepMerge(result[key] || {}, obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }

  return result;
}
