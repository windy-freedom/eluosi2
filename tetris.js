class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.BLOCK_SIZE = 30;
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.lastDrop = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.colors = [
            '#000000', '#FF0000', '#00FF00', '#0000FF', 
            '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'
        ];
        
        this.pieces = [
            // I
            [[[1,1,1,1]], [[1],[1],[1],[1]]],
            // O
            [[[2,2],[2,2]]],
            // T
            [[[0,3,0],[3,3,3]], [[3,0],[3,3],[3,0]], [[3,3,3],[0,3,0]], [[0,3],[3,3],[0,3]]],
            // S
            [[[0,4,4],[4,4,0]], [[4,0],[4,4],[0,4]]],
            // Z
            [[[5,5,0],[0,5,5]], [[0,5],[5,5],[5,0]]],
            // J
            [[[6,0,0],[6,6,6]], [[6,6],[6,0],[6,0]], [[6,6,6],[0,0,6]], [[0,6],[0,6],[6,6]]],
            // L
            [[[0,0,7],[7,7,7]], [[7,0],[7,0],[7,7]], [[7,7,7],[7,0,0]], [[7,7],[0,7],[0,7]]]
        ];
        
        this.init();
    }
    
    init() {
        this.initBoard();
        this.bindEvents();
        this.generateNextPiece();
        this.updateDisplay();
        this.draw();
    }
    
    initBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'Space':
                    e.preventDefault();
                    this.dropPiece();
                    break;
            }
        });
    }
    
    startGame() {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.gamePaused = false;
            this.spawnPiece();
            this.gameLoop();
            document.getElementById('startBtn').disabled = true;
        }
    }
    
    togglePause() {
        if (this.gameRunning) {
            this.gamePaused = !this.gamePaused;
            document.getElementById('pauseBtn').textContent = this.gamePaused ? '继续' : '暂停';
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.initBoard();
        this.generateNextPiece();
        this.updateDisplay();
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').textContent = '暂停';
        this.draw();
    }
    
    generateNextPiece() {
        const pieceIndex = Math.floor(Math.random() * this.pieces.length);
        this.nextPiece = {
            type: pieceIndex + 1,
            shape: this.pieces[pieceIndex],
            rotation: 0,
            x: 0,
            y: 0
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.generateNextPiece();
        
        this.currentPiece.x = Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.currentPiece.shape[0][0].length / 2);
        this.currentPiece.y = 0;
        
        if (this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }
    
    checkCollision(piece, x, y) {
        const shape = piece.shape[piece.rotation % piece.shape.length];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(this.currentPiece, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        
        if (dy > 0) {
            this.lockPiece();
            return false;
        }
        
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const newRotation = (this.currentPiece.rotation + 1) % this.currentPiece.shape.length;
        const oldRotation = this.currentPiece.rotation;
        
        this.currentPiece.rotation = newRotation;
        
        if (this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.rotation = oldRotation;
        }
    }
    
    dropPiece() {
        while (this.movePiece(0, 1)) {
            this.score += 2;
        }
    }
    
    lockPiece() {
        const shape = this.currentPiece.shape[this.currentPiece.rotation % this.currentPiece.shape.length];
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== 0) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.type;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    calculateScore(lines) {
        const baseScore = [0, 40, 100, 300, 1200];
        return baseScore[lines] * this.level;
    }
    
    gameOver() {
        this.gameRunning = false;
        alert(`游戏结束！最终得分: ${this.score}`);
        document.getElementById('startBtn').disabled = false;
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (this.gamePaused) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }
        
        const now = Date.now();
        
        if (now - this.lastDrop > this.dropInterval) {
            this.movePiece(0, 1);
            this.lastDrop = now;
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // 绘制已锁定的方块
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawBlock(this.ctx, col, row, this.colors[this.board[row][col]]);
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentPiece) {
            const shape = this.currentPiece.shape[this.currentPiece.rotation % this.currentPiece.shape.length];
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] !== 0) {
                        this.drawBlock(
                            this.ctx, 
                            this.currentPiece.x + col, 
                            this.currentPiece.y + row, 
                            this.colors[this.currentPiece.type]
                        );
                    }
                }
            }
        }
        
        // 绘制下一个方块
        this.nextCtx.fillStyle = '#000';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const shape = this.nextPiece.shape[0];
            const offsetX = (this.nextCanvas.width - shape[0].length * 20) / 2;
            const offsetY = (this.nextCanvas.height - shape.length * 20) / 2;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col] !== 0) {
                        this.nextCtx.fillStyle = this.colors[this.nextPiece.type];
                        this.nextCtx.fillRect(
                            offsetX + col * 20,
                            offsetY + row * 20,
                            18,
                            18
                        );
                    }
                }
            }
        }
    }
    
    drawBlock(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(
            x * this.BLOCK_SIZE + 1,
            y * this.BLOCK_SIZE + 1,
            this.BLOCK_SIZE - 2,
            this.BLOCK_SIZE - 2
        );
        
        // 添加高光效果
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
            x * this.BLOCK_SIZE + 1,
            y * this.BLOCK_SIZE + 1,
            this.BLOCK_SIZE - 2,
            3
        );
        ctx.fillRect(
            x * this.BLOCK_SIZE + 1,
            y * this.BLOCK_SIZE + 1,
            3,
            this.BLOCK_SIZE - 2
        );
        
        // 添加阴影效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
            x * this.BLOCK_SIZE + this.BLOCK_SIZE - 4,
            y * this.BLOCK_SIZE + 1,
            3,
            this.BLOCK_SIZE - 2
        );
        ctx.fillRect(
            x * this.BLOCK_SIZE + 1,
            y * this.BLOCK_SIZE + this.BLOCK_SIZE - 4,
            this.BLOCK_SIZE - 2,
            3
        );
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});
