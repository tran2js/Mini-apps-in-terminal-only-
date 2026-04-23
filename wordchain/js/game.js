// ── Constants ───────────────────────────────────────────────
const TOTAL_ROUNDS  = 5;
const TURN_SECONDS  = 15;
const PLAYER_COLORS = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5'];
const START_WORDS   = [
  "OCEAN","FIRE","CLOUD","MUSIC","DREAM","SPACE","STORM",
  "RIVER","LIGHT","TIGER","PIZZA","DANCE","MAGIC","STONE",
  "APPLE","BRAVE","CHAOS","DELTA","EAGLE","FROST"
];

// ── Session state ───────────────────────────────────────────
let roomId        = null;
let myId          = null;
let myName        = null;
let isHost        = false;
let demoState     = null;
let timerInterval = null;
let unsubscribes  = [];

// ── Utilities ───────────────────────────────────────────────
function randId(len = 6) {
  return Math.random().toString(36).toUpperCase().slice(2, 2 + len);
}

function pickStartWord() {
  return START_WORDS[Math.floor(Math.random() * START_WORDS.length)];
}

function buildDemoRoom(code, hostId, hostName) {
  return {
    code, status: "lobby", hostId,
    players: { [hostId]: { name: hostName, score: 0, color: PLAYER_COLORS[0] } },
    chain: [], currentTurnId: hostId, round: 1
  };
}

// ── Room: create ────────────────────────────────────────────
async function createRoom() {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) { showToast("Enter your name first!"); return; }

  myId = randId(8); myName = name; isHost = true; roomId = randId(4);

  if (!isFirebaseReady) {
    demoState = buildDemoRoom(roomId, myId, myName);
    renderLobby(demoState);
    showScreen("lobbyScreen");
    return;
  }

  await db.collection("rooms").doc(roomId).set({
    code: roomId, status: "lobby", hostId: myId,
    players: { [myId]: { name: myName, score: 0, color: PLAYER_COLORS[0] } },
    chain: [], currentTurnId: null, round: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  subscribeRoom();
  showScreen("lobbyScreen");
  document.getElementById("lobbyCode").textContent = roomId;
}

// ── Room: join ──────────────────────────────────────────────
async function joinRoom() {
  const name = document.getElementById("nameInput").value.trim();
  const code = document.getElementById("codeInput").value.trim().toUpperCase();
  if (!name) { showToast("Enter your name first!"); return; }
  if (!code) { showToast("Enter a room code!");    return; }

  myId = randId(8); myName = name; isHost = false; roomId = code;

  if (!isFirebaseReady) {
    showToast("Firebase not configured — can't join real rooms in demo mode.");
    return;
  }

  const snap = await db.collection("rooms").doc(code).get();
  if (!snap.exists)                                    { showToast("Room not found!");       return; }
  if (snap.data().status !== "lobby")                  { showToast("Game already started!"); return; }
  if (Object.keys(snap.data().players).length >= 6)   { showToast("Room is full!");         return; }

  const colorIdx = Object.keys(snap.data().players).length % PLAYER_COLORS.length;
  await db.collection("rooms").doc(code).update({
    [`players.${myId}`]: { name: myName, score: 0, color: PLAYER_COLORS[colorIdx] }
  });
  subscribeRoom();
  showScreen("lobbyScreen");
  document.getElementById("lobbyCode").textContent = roomId;
}

// ── Room: subscribe (real-time) ─────────────────────────────
function subscribeRoom() {
  const unsub = db.collection("rooms").doc(roomId).onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    if      (data.status === "lobby")   renderLobby(data);
    else if (data.status === "playing") renderGame(data);
    else if (data.status === "ended")   renderEnd(data);
  });
  unsubscribes.push(unsub);
}

// ── Game: start ─────────────────────────────────────────────
async function startGame() {
  const data = isFirebaseReady
    ? (await db.collection("rooms").doc(roomId).get()).data()
    : demoState;

  const players   = Object.keys(data.players);
  const startWord = pickStartWord();
  const update = {
    status: "playing",
    chain:  [{ word: startWord, playerId: "system", playerName: "SYSTEM" }],
    currentTurnId: players[0],
    round: 1,
    turnStart: Date.now()
  };

  if (!isFirebaseReady) {
    demoState = { ...demoState, ...update };
    renderGame(demoState);
    showScreen("gameScreen");
    startLocalTimer();
    return;
  }
  await db.collection("rooms").doc(roomId).update(update);
}

// ── Game: submit word ───────────────────────────────────────
async function submitWord() {
  const input = document.getElementById("wordInput");
  const word  = input.value.trim().toUpperCase();
  if (!word) return;

  const data = isFirebaseReady
    ? (await db.collection("rooms").doc(roomId).get()).data()
    : demoState;

  if (data.currentTurnId !== myId) return;

  const chain    = data.chain || [];
  const lastWord = chain.length ? chain[chain.length - 1].word : "";

  // Must start with last letter of previous word
  if (lastWord && word[0] !== lastWord[lastWord.length - 1]) {
    showToast(`Must start with "${lastWord[lastWord.length - 1]}"!`);
    input.value = "";
    return;
  }
  // No duplicates
  if (chain.some(w => w.word === word)) {
    showToast("Already used that word!");
    input.value = "";
    return;
  }

  await advanceTurn(data, word, myId, myName, true);
  input.value = "";
}

// ── Game: timeout ───────────────────────────────────────────
async function handleTimeout(data) {
  showToast("Time's up! No point this turn.");
  await advanceTurn(data, null, data.currentTurnId, null, false);
}

// ── Game: advance turn ──────────────────────────────────────
async function advanceTurn(data, word, playerId, playerName, scored) {
  if (timerInterval) clearInterval(timerInterval);

  const players    = Object.keys(data.players);
  const currentIdx = players.indexOf(data.currentTurnId);
  const nextIdx    = (currentIdx + 1) % players.length;
  const nextTurn   = players[nextIdx];
  const newChain   = word
    ? [...(data.chain || []), { word, playerId, playerName }]
    : data.chain;
  const newRound   = nextIdx === 0 ? (data.round || 1) + 1 : (data.round || 1);
  const status     = newRound > TOTAL_ROUNDS ? "ended" : "playing";
  const scoreUpdate = scored && word
    ? { [`players.${playerId}.score`]: firebase.firestore.FieldValue.increment(1) }
    : {};

  if (!isFirebaseReady) {
    if (scored && word && demoState.players[playerId]) demoState.players[playerId].score += 1;
    demoState = { ...demoState, chain: newChain, currentTurnId: nextTurn, round: newRound, status, turnStart: Date.now() };
    if (status === "ended") { renderEnd(demoState); return; }
    renderGame(demoState);
    startLocalTimer();
    return;
  }

  await db.collection("rooms").doc(roomId).update({
    chain: newChain, currentTurnId: nextTurn,
    round: newRound, status,
    turnStart: Date.now(),
    ...scoreUpdate
  });
}

// ── Post-game ───────────────────────────────────────────────
async function playAgain() {
  if (!isFirebaseReady) {
    demoState = buildDemoRoom(roomId, myId, myName);
    renderLobby(demoState);
    showScreen("lobbyScreen");
    return;
  }
  const snap = await db.collection("rooms").doc(roomId).get();
  const players = {};
  Object.entries(snap.data().players).forEach(([id, p]) => { players[id] = { ...p, score: 0 }; });
  await db.collection("rooms").doc(roomId).update({ players, status: "lobby", chain: [], round: 0 });
}

async function leaveRoom() {
  unsubscribes.forEach(u => u());
  unsubscribes = [];
  if (isFirebaseReady && roomId) {
    await db.collection("rooms").doc(roomId).update({
      [`players.${myId}`]: firebase.firestore.FieldValue.delete()
    }).catch(() => {});
  }
  goHome();
}

function goHome() {
  if (timerInterval) clearInterval(timerInterval);
  unsubscribes.forEach(u => u());
  unsubscribes = [];
  roomId = null; myId = null; isHost = false; demoState = null;
  document.getElementById("nameInput").value = "";
  document.getElementById("codeInput").value = "";
  showScreen("setupScreen");
}

// ── Timer helpers ───────────────────────────────────────────
function startLocalTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const start = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed >= TURN_SECONDS) {
      clearInterval(timerInterval);
      handleTimeout(demoState);
    } else {
      updateTimer(start);
    }
  }, 500);
  updateTimer(start);
}

function updateTimer(turnStart) {
  const remaining = Math.max(0, TURN_SECONDS - (Date.now() - turnStart) / 1000);
  const pct = (remaining / TURN_SECONDS) * 100;
  const bar = document.getElementById("timerBar");
  bar.style.width = pct + "%";
  bar.className = "timer-bar-fill" + (pct < 30 ? " danger" : pct < 60 ? " warning" : "");
  document.getElementById("timerText").textContent = Math.ceil(remaining) + "s";
}
