// テトリスゲームの設定
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    I: '#00f0f0',  // シアン
    O: '#f0f000',  // 黄色
    T: '#a000f0',  // 紫
    S: '#00f000',  // 緑
    Z: '#f00000',  // 赤
    J: '#0000f0',  // 青
    L: '#f0a000',  // オレンジ
    EMPTY: '#000000',
    GRID: '#111111',
    GHOST: 'rgba(255, 255, 255, 0.2)'
};

// テトロミノの形状定義
const SHAPES = {
    I: [
        [[0, 0, 0, 0],
         [1, 1, 1, 1],
         [0, 0, 0, 0],
         [0, 0, 0, 0]]
    ],
    O: [
        [[1, 1],
         [1, 1]]
    ],
    T: [
        [[0, 1, 0],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 1],
         [0, 1, 0]],
        [[0, 0, 0],
         [1, 1, 1],
         [0, 1, 0]],
        [[0, 1, 0],
         [1, 1, 0],
         [0, 1, 0]]
    ],
    S: [
        [[0, 1, 1],
         [1, 1, 0],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 1],
         [0, 0, 1]]
    ],
    Z: [
        [[1, 1, 0],
         [0, 1, 1],
         [0, 0, 0]],
        [[0, 0, 1],
         [0, 1, 1],
         [0, 1, 0]]
    ],
    J: [
        [[1, 0, 0],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 1],
         [0, 1, 0],
         [0, 1, 0]],
        [[0, 0, 0],
         [1, 1, 1],
         [0, 0, 1]],
        [[0, 1, 0],
         [0, 1, 0],
         [1, 1, 0]]
    ],
    L: [
        [[0, 0, 1],
         [1, 1, 1],
         [0, 0, 0]],
        [[0, 1, 0],
         [0, 1, 0],
         [0, 1, 1]],
        [[0, 0, 0],
         [1, 1, 1],
         [1, 0, 0]],
        [[1, 1, 0],
         [0, 1, 0],
         [0, 1, 0]]
    ]
};

// ゲーム状態
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetrisCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.isRunning = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.highScore = localStorage.getItem('tetrisHighScore') || 0;
        
        this.initControls();
        this.updateDisplay();
        this.draw();
    }
    
    createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }
    
    initControls() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameOver = false;
        this.isPaused = false;
        
        if (!this.currentPiece) {
            this.nextPiece = this.createPiece();
            this.spawnPiece();
        }
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.update(time));
    }
    
    togglePause() {
        if (!this.isRunning || this.gameOver) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'RESUME' : 'PAUSE';
        
        if (!this.isPaused) {
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.update(time));
        }
    }
    
    reset() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.isRunning = false;
        this.currentPiece = null;
        this.nextPiece = null;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        this.updateDisplay();
        this.draw();
    }
    
    restart() {
        this.reset();
        this.start();
    }
    
    createPiece() {
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        const type = pieces[Math.floor(Math.random() * pieces.length)];
        
        return {
            type: type,
            shape: SHAPES[type][0],
            rotation: 0,
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0][0].length / 2),
            y: 0,
            color: COLORS[type]
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        if (this.checkCollision(this.currentPiece)) {
            this.endGame();
        }
        
        this.drawNext();
    }
    
    handleKeyPress(e) {
        if (!this.isRunning || this.gameOver || this.isPaused) {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
            }
            return;
        }
        
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
                this.togglePause();
                break;
        }
    }
    
    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.checkCollision(this.currentPiece)) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            
            if (dy > 0) {
                this.lockPiece();
            }
        } else {
            this.draw();
        }
    }
    
    rotatePiece() {
        const allRotations = SHAPES[this.currentPiece.type];
        const nextRotation = (this.currentPiece.rotation + 1) % allRotations.length;
        const originalRotation = this.currentPiece.rotation;
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.rotation = nextRotation;
        this.currentPiece.shape = allRotations[nextRotation];
        
        // 壁キック（回転時の位置調整）
        if (this.checkCollision(this.currentPiece)) {
            // 右に寄せる
            this.currentPiece.x++;
            if (this.checkCollision(this.currentPiece)) {
                // 左に寄せる
                this.currentPiece.x -= 2;
                if (this.checkCollision(this.currentPiece)) {
                    // 元に戻す
                    this.currentPiece.x++;
                    this.currentPiece.rotation = originalRotation;
                    this.currentPiece.shape = originalShape;
                    return;
                }
            }
        }
        
        this.draw();
    }
    
    checkCollision(piece) {
        const shape = piece.shape;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    lockPiece() {
        const shape = this.currentPiece.shape;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newY = this.currentPiece.y + y;
                    const newX = this.currentPiece.x + x;
                    
                    if (newY >= 0) {
                        this.board[newY][newX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // スコア計算（1行: 100, 2行: 300, 3行: 500, 4行: 800）
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            
            // レベルアップ（10ライン毎）
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            // ハイスコア更新
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('tetrisHighScore', this.highScore);
            }
            
            this.updateDisplay();
        }
    }
    
    update(time) {
        if (!this.isRunning || this.gameOver || this.isPaused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }
        
        this.draw();
        requestAnimationFrame((time) => this.update(time));
    }
    
    draw() {
        // キャンバスをクリア
        this.ctx.fillStyle = COLORS.EMPTY;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド線を描画
        this.ctx.strokeStyle = COLORS.GRID;
        this.ctx.lineWidth = 1;
        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // ボードを描画
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(this.ctx, x, y, this.board[y][x]);
                }
            }
        }
        
        // ゴーストピース（落下予測位置）を描画
        if (this.currentPiece) {
            const ghost = { ...this.currentPiece };
            while (!this.checkCollision(ghost)) {
                ghost.y++;
            }
            ghost.y--;
            
            if (ghost.y !== this.currentPiece.y) {
                this.drawPiece(this.ctx, ghost, COLORS.GHOST);
            }
        }
        
        // 現在のピースを描画
        if (this.currentPiece) {
            this.drawPiece(this.ctx, this.currentPiece, this.currentPiece.color);
        }
    }
    
    drawBlock(ctx, x, y, color) {
        const pixelSize = BLOCK_SIZE;
        const innerSize = pixelSize - 4;
        
        // 外側（影）
        ctx.fillStyle = this.darkenColor(color, 0.5);
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        
        // 内側（明るい部分）
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize + 2, y * pixelSize + 2, innerSize, innerSize);
        
        // ハイライト（8bitスタイル）
        ctx.fillStyle = this.lightenColor(color, 0.3);
        ctx.fillRect(x * pixelSize + 2, y * pixelSize + 2, innerSize, 4);
        ctx.fillRect(x * pixelSize + 2, y * pixelSize + 2, 4, innerSize);
    }
    
    drawPiece(ctx, piece, color) {
        const shape = piece.shape;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    if (color === COLORS.GHOST) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            (piece.x + x) * BLOCK_SIZE + 2,
                            (piece.y + y) * BLOCK_SIZE + 2,
                            BLOCK_SIZE - 4,
                            BLOCK_SIZE - 4
                        );
                    } else {
                        this.drawBlock(ctx, piece.x + x, piece.y + y, color);
                    }
                }
            }
        }
    }
    
    drawNext() {
        this.nextCtx.fillStyle = COLORS.EMPTY;
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const shape = this.nextPiece.shape;
        const blockSize = 24;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const pixelX = offsetX + x * blockSize;
                    const pixelY = offsetY + y * blockSize;
                    
                    // 外側
                    this.nextCtx.fillStyle = this.darkenColor(this.nextPiece.color, 0.5);
                    this.nextCtx.fillRect(pixelX, pixelY, blockSize, blockSize);
                    
                    // 内側
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(pixelX + 2, pixelY + 2, blockSize - 4, blockSize - 4);
                    
                    // ハイライト
                    this.nextCtx.fillStyle = this.lightenColor(this.nextPiece.color, 0.3);
                    this.nextCtx.fillRect(pixelX + 2, pixelY + 2, blockSize - 4, 3);
                    this.nextCtx.fillRect(pixelX + 2, pixelY + 2, 3, blockSize - 4);
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    endGame() {
        this.gameOver = true;
        this.isRunning = false;
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('gameOverScreen').classList.add('flex');
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }
    
    // ユーティリティ関数
    darkenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    lightenColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + factor));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + factor));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// ゲーム初期化
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new TetrisGame();
});
