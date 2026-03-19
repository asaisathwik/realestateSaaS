import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function createFirebaseApp(): FirebaseApp {
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!clientConfig.apiKey || !clientConfig.projectId || !clientConfig.appId) {
    throw new Error(
      "Missing Firebase environment variables. Please set NEXT_PUBLIC_FIREBASE_* values."
    );
  }

  if (!getApps().length) {
    return initializeApp(clientConfig);
  }

  return getApp();
}

export function getFirebase() {
  if (!app) {
    app = createFirebaseApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }

  return { app, auth, db };
}

/** Temporary auth on a second app - use to create employee users without signing out the owner. */
export function getTempAuth(): Auth {
  const clientConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  try {
    return getAuth(getApp("TempAuthEmployee"));
  } catch {
    return getAuth(initializeApp(clientConfig, "TempAuthEmployee"));
  }
}

