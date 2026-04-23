let game;
const boardElement = document.getElementById('sudoku-board');
const messageElement = document.getElementById('message');

function initGame() {
    const difficulty = document.getElementById('difficulty').value;
    game = new SudokuGame(difficulty);
    renderBoard();
    messageElement.innerText = "";
}

function renderBoard() {
    boardElement.innerHTML = '';
    
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const val = game.currentGrid[r][c];
            const isOriginal = game.originalPuzzle[r][c] !== 0;
            
            const input = document.createElement('div');
            input.classList.add('cell');
            if (isOriginal) {
                input.innerText = val;
                input.classList.add('original');
            } else {
                input.contentEditable = "true";
                input.innerText = val === 0 ? "" : val;
                
                // Add input validation
                input.addEventListener('input', (e) => handleInput(e, r, c));
            }
            boardElement.appendChild(input);
        }
    }
}

function handleInput(e, r, c) {
    const val = parseInt(e.target.innerText);
    
    if (isNaN(val) || val < 1 || val > 9) {
        e.target.innerText = "";
        game.currentGrid[r][c] = 0;
        return;
    }

    // Update the game state
    game.currentGrid[r][c] = val;
    
    // Visual feedback for invalid moves
    if (!game.isValidMove(r, c, val)) {
        e.target.classList.add('error');
    } else {
        e.target.classList.remove('error');
    }
}

document.getElementById('new-game').addEventListener('click', initGame);
document.getElementById('check-game').addEventListener('click', () => {
    if (game.isComplete()) {
        messageElement.innerText = "🎉 Congratulations! You solved it!";
        messageElement.style.color = "green";
    } else {
        messageElement.innerText = "Keep going! Some cells are incorrect or empty.";
        messageElement.style.color = "orange";
    }
});

// Start the first game on load
initGame();