class SudokuGame {
    static DIFFICULTY_MAP = {
        'easy': 0.3,
        'medium': 0.5,
        'hard': 0.7
    };

    constructor(difficulty = 'medium', original = null, solution = null, current = null) {
        this.difficulty = difficulty;
        
        if (!original || !solution) {
            const [genOriginal, genSolution] = this.generateSudoku();
            this.originalPuzzle = genOriginal;
            this.solution = genSolution;
        } else {
            this.originalPuzzle = original;
            this.solution = solution;
        }

        this.currentGrid = current ? this.deepCopy(current) : this.deepCopy(this.originalPuzzle);
    }

    // =======================
    // HELPERS
    // =======================
    
    deepCopy(grid) {
        return grid.map(row => [...row]);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // =======================
    // PUZZLE GENERATION
    // =======================

    generateSudoku() {
        let grid = Array.from({ length: 9 }, () => Array(9).fill(0));

        // Fill diagonal 3x3 boxes
        for (let i = 0; i < 9; i += 3) {
            this.fillBox(grid, i, i);
        }

        // Solve the rest
        this.solveSudoku(grid);
        const solution = this.deepCopy(grid);

        // Remove numbers
        const ratio = SudokuGame.DIFFICULTY_MAP[this.difficulty] || 0.5;
        const cellsToRemove = Math.floor(81 * ratio);
        let puzzle = this.deepCopy(grid);
        let removed = 0;

        while (removed < cellsToRemove) {
            let row = Math.floor(Math.random() * 9);
            let col = Math.floor(Math.random() * 9);

            if (puzzle[row][col] !== 0) {
                let backup = puzzle[row][col];
                puzzle[row][col] = 0;

                if (this.countSolutions(this.deepCopy(puzzle)) !== 1) {
                    puzzle[row][col] = backup;
                } else {
                    removed++;
                }
            }
        }
        return [puzzle, solution];
    }

    fillBox(grid, row, col) {
        let nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        let index = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                grid[row + i][col + j] = nums[index++];
            }
        }
    }

    // =======================
    // SOLVING ALGORITHMS
    // =======================

    solveSudoku(grid) {
        const empty = this.findEmptyCell(grid);
        if (!empty) return true;

        const [row, col] = empty;
        const nums = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let num of nums) {
            if (this.isValidMoveInGrid(grid, row, col, num)) {
                grid[row][col] = num;
                if (this.solveSudoku(grid)) return true;
                grid[row][col] = 0;
            }
        }
        return false;
    }

    countSolutions(grid, limit = 2) {
        const empty = this.findEmptyCell(grid);
        if (!empty) return 1;

        const [row, col] = empty;
        let count = 0;

        for (let num = 1; num <= 9; num++) {
            if (this.isValidMoveInGrid(grid, row, col, num)) {
                grid[row][col] = num;
                count += this.countSolutions(grid, limit - count);
                grid[row][col] = 0;
                if (count >= limit) break;
            }
        }
        return count;
    }

    // =======================
    // VALIDATION
    // =======================

    findEmptyCell(grid = this.currentGrid) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (grid[i][j] === 0) return [i, j];
            }
        }
        return null;
    }

    isValidMoveInGrid(grid, row, col, num) {
        // Row & Col check
        for (let i = 0; i < 9; i++) {
            if (grid[row][i] === num && i !== col) return false;
            if (grid[i][col] === num && i !== row) return false;
        }

        // Box check
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                if (grid[i][j] === num && (i !== row || j !== col)) return false;
            }
        }
        return true;
    }

    isValidMove(row, col, num) {
        return this.isValidMoveInGrid(this.currentGrid, row, col, num);
    }

    isComplete() {
        if (this.findEmptyCell(this.currentGrid)) return false;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.currentGrid[i][j] !== this.solution[i][j]) return false;
            }
        }
        return true;
    }
}