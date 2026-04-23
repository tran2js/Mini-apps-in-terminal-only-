// ── Boot ─────────────────────────────────────────────────────
(function init() {
  const badge = document.getElementById("statusBadge");

  if (!isFirebaseReady) {
    document.getElementById("configWarning").style.display = "block";
    badge.textContent       = "Demo Mode";
    badge.style.background  = "#ffd166";
    badge.style.color       = "#1a1a2e";
  } else {
    badge.textContent = "Connected";
    badge.className   = "badge green";
  }
})();

// ── Keyboard events ──────────────────────────────────────────
document.getElementById("wordInput").addEventListener("keydown", e => {
  if (e.key === "Enter") submitWord();
});

document.getElementById("codeInput").addEventListener("input", e => {
  e.target.value = e.target.value.toUpperCase();
});
