// ============================================================
//  FIREBASE CONFIG — edit this file to enable multiplayer
//
//  Steps:
//  1. Go to https://console.firebase.google.com
//  2. Create a project → Add a Web App → copy the config
//  3. Paste your values below (replace each "YOUR_..." string)
//  4. In Firestore Database → Rules, use:
//
//     rules_version = '2';
//     service cloud.firestore {
//       match /databases/{database}/documents {
//         match /rooms/{roomId} {
//           allow read, write: if true;
//         }
//       }
//     }
// ============================================================

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ── Init ────────────────────────────────────────────────────
let db = null;
let isFirebaseReady = false;

try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.firestore();
  isFirebaseReady = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
} catch (e) {
  console.warn("Firebase init failed:", e);
}
