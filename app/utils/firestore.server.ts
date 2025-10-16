import { Firestore } from "@google-cloud/firestore";

let firestore: Firestore;

declare global {
  var __firestore: Firestore | undefined;
}

if (!global.__firestore) {
  global.__firestore = new Firestore();
}

firestore = global.__firestore;

export { firestore };