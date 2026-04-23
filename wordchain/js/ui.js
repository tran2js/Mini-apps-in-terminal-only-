// ── Screens ─────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showToast(msg, duration = 2500) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}

// ── Lobby ────────────────────────────────────────────────────
function renderLobby(data) {
  document.getElementById("lobbyCode").textContent = data.code;
  const players = Object.entries(data.players);
  document.getElementById("playerCount").textContent = players.length;
  document.getElementById("playerList").innerHTML = players.map(([id, p]) => `
    <div class="player-item">
      <div class="player-dot ${p.color}"></div>
      <span>${p.name}</span>
      ${id === data.hostId ? '<span class="player-host-tag">Host</span>' : ''}
    </div>`).join("");

  const iAmHost = myId === data.hostId;
  document.getElementById("hostControls").style.display  = iAmHost ? "flex"  : "none";
  document.getElementById("guestControls").style.display = iAmHost ? "none"  : "block";
}

// ── Game ─────────────────────────────────────────────────────
function renderGame(data) {
  showScreen("gameScreen");

  document.getElementById("roundNum").textContent    = data.round;
  document.getElementById("totalRounds").textContent = TOTAL_ROUNDS;

  // Prompt word
  const chain    = data.chain || [];
  const lastWord = chain.length ? chain[chain.length - 1].word : "—";
  document.getElementById("promptWord").textContent = lastWord;

  // Chain display (last 7 entries)
  const display = chain.slice(-7);
  document.getElementById("chainWords").innerHTML = display.length === 0
    ? '<div class="empty-chain">Chain starts with the first word…</div>'
    : display.map((w, i) =>
        `${i > 0 ? '<span class="chain-arrow">→</span>' : ''}
         <div class="chain-word ${i === display.length - 1 ? 'latest' : ''}">${w.word}</div>`
      ).join("");

  // Scores
  document.getElementById("scorePills").innerHTML = Object.entries(data.players)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id, p]) =>
      `<div class="score-pill ${id === myId ? 'mine' : ''}">${p.name}: ${p.score}</div>`
    ).join("");

  // Turn indicator
  const isMyTurn   = data.currentTurnId === myId;
  const turnPlayer = data.players[data.currentTurnId];
  document.getElementById("turnName").textContent  = isMyTurn ? "Your turn!" : (turnPlayer?.name ?? "—");
  document.getElementById("turnSub").textContent   = isMyTurn ? "type quickly!" : "their turn";
  document.getElementById("wordInput").disabled    = !isMyTurn;
  document.getElementById("wordInput").value       = "";
  if (isMyTurn) document.getElementById("wordInput").focus();

  // Live timer (only used in Firebase mode; local mode has startLocalTimer)
  if (isFirebaseReady) {
    if (timerInterval) clearInterval(timerInterval);
    const turnStart = data.turnStart || Date.now();
    updateTimer(turnStart);
    timerInterval = setInterval(() => {
      const elapsed = (Date.now() - turnStart) / 1000;
      if (elapsed >= TURN_SECONDS) {
        clearInterval(timerInterval);
        if (data.currentTurnId === myId) handleTimeout(data);
      } else {
        updateTimer(turnStart);
      }
    }, 500);
  }
}

// ── End screen ───────────────────────────────────────────────
function renderEnd(data) {
  if (timerInterval) clearInterval(timerInterval);
  showScreen("endScreen");
  const medals = ["🥇", "🥈", "🥉"];
  document.getElementById("leaderboard").innerHTML = Object.entries(data.players)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([id, p], i) => `
      <li class="lb-item ${i === 0 ? 'first' : ''}">
        <span class="lb-rank">${medals[i] ?? (i + 1)}</span>
        <span class="lb-name">${p.name}${id === myId ? ' (you)' : ''}</span>
        <span class="lb-score">${p.score} pts</span>
      </li>`).join("");
}
