# WordChain — Word Association Game

A real-time multiplayer word association game built with vanilla JS + Firebase Firestore.

## How to play
Each player must type a word that starts with the **last letter** of the previous word.
Example: OCEAN → NIGHT → TIGER → ROAD → DREAM ...
You have **15 seconds** per turn. 5 rounds total. Most points wins!

---

## Quick start (no Firebase needed)
1. Open the `wordchain/` folder in VS Code
2. Install the **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**
4. Game runs in demo/solo mode — no setup required

---

## Enable real multiplayer

### 1. Create a Firebase project
- Go to console.firebase.google.com → Add project
- Add Firestore Database (start in test mode)

### 2. Get your config
- Project settings → General → Your apps → Add Web app
- Copy the firebaseConfig object

### 3. Paste into js/firebase.js
Replace all the "YOUR_..." placeholder strings with your real values.

### 4. Set Firestore rules
In Firebase Console → Firestore → Rules:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /rooms/{roomId} {
          allow read, write: if true;
        }
      }
    }

---

## Project structure

    wordchain/
    ├── index.html        ← App shell & HTML screens
    ├── css/
    │   └── style.css     ← All styles & animations
    ├── js/
    │   ├── firebase.js   ← 🔧 EDIT THIS with your Firebase config
    │   ├── game.js       ← Room, turn, and scoring logic
    │   ├── ui.js         ← Render functions
    │   └── main.js       ← Boot & keyboard listeners
    └── README.md

---

## Customising

| Setting          | File         | Variable       |
|------------------|--------------|----------------|
| Turn time limit  | js/game.js   | TURN_SECONDS   |
| Number of rounds | js/game.js   | TOTAL_ROUNDS   |
| Starting words   | js/game.js   | START_WORDS    |
| Player colors    | css/style.css| .c0 through .c5|
