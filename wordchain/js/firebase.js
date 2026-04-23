const firebaseConfig = {
  apiKey: "AIzaSyBBSxDBsj8rR7J7a7htjkptz8obBTbnkQg",
  authDomain: "wordchain-aed75.firebaseapp.com",
  projectId: "wordchain-aed75",
  storageBucket: "wordchain-aed75.firebasestorage.app",
  messagingSenderId: "1058532743246",
  appId: "1:1058532743246:web:7c2504cbb1ac4c466a0b1f"
};

let db = null;
let isFirebaseReady = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  isFirebaseReady = firebaseConfig.apiKey !== "YOUR_API_KEY";
} catch (e) {
  console.warn("Firebase init failed:", e);
}
