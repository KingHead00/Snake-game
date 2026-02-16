/* Neon Snake - New skins */

const SNAKE_SKINS = [
    { id: 's1', name: 'NEON', head: '#00ffcc', body: '#00bfa5', price: 0 },
    { id: 'svoid', name: 'VOID', head: '#000000', body: '#000000', price: 0, pair: 'bvoid' },
    { id: 's_banana', name: 'BANANA', head: '#ffe135', body: '#ccb52b', price: 0 },
    { id: 's_pink', name: 'SANJIT FAV', head: 'special_pink_yellow', body: 'special_pink_yellow', price: 15, pair: 'b_yellow' },
    { id: 's2', name: 'GOLD', head: '#ffcc00', body: '#aa8800', price: 10 },
    { id: 's3', name: 'RED', head: '#ff0044', body: '#990022', price: 20 },
    { id: 's4', name: 'BLUE', head: '#0088ff', body: '#0044aa', price: 30 },
    { id: 's5', name: 'WHITE', head: '#ffffff', body: '#888888', price: 40 },
    { id: 's6', name: 'RAINBOW', head: 'rainbow', body: 'rainbow', price: 50 }
];

const BALL_COLORS = [
    { id: 'b1', name: 'PURPLE', color: '#ff00ff', price: 0 },
    { id: 'bvoid', name: 'VOID', color: '#000000', price: 0, pair: 'svoid' },
    { id: 'b_banana', name: 'BANANA', color: '#ffe135', price: 0 },
    { id: 'b_yellow', name: 'SANJIT FAV', color: 'special_pink_yellow', price: 15, pair: 's_pink' },
    { id: 'b2', name: 'LIGHT BLUE', color: '#00ffff', price: 10 },
    { id: 'b3', name: 'GREEN', color: '#00ff00', price: 20 },
    { id: 'b4', name: 'ORANGE', color: '#ff8800', price: 30 },
    { id: 'b5', name: 'RAINBOW', color: 'rainbow', price: 50 }
];

const CONFIG = { 
    cols: 31, rows: 15, cellSize: 0, 
    speeds: { 
        slow: { base: 6, boost: 0.1, max: 12 }, 
        normal: { base: 8, boost: 0.15, max: 18 }, 
        hard: { base: 16, boost: 0.4, max: 32 }, // HARD IS NOW HARDER
        impossible: { base: 18, boost: 0.3, max: 40 } 
    }, 
    currentMode: 'hard' // DEFAULTS TO HARD
};

function startGame() {
    AudioFX.playClick();
    document.body.classList.remove('death-screen'); 
    state.username = document.getElementById('username').value;
    save(); 
    if(state.menuTimeout) clearTimeout(state.menuTimeout);
    state.snake = [{x:8, y:7}, {x:7, y:7}, {x:6, y:7}];
    state.dir = {x:1, y:0}; state.lastD = {x:1, y:0}; state.inputQueue = [];
    state.score = 0; state.shake = 0; state.particles = []; state.eyeFlash = 0;
    document.getElementById('score').textContent = '0';
    canvas.className = ""; spawnFood(); state.gameOver = false; state.lastTime = performance.now();
    document.getElementById('ui-layer').classList.add('hidden');
    requestAnimationFrame(loop);
}

function update() {
    if (state.inputQueue.length > 0) {
        const nextMove = state.inputQueue.shift();
        if (nextMove.x !== -state.lastD.x || nextMove.y !== -state.lastD.y) {
            state.dir = nextMove;
            AudioFX.playTurn();
        }
    }
    state.lastD = state.dir; 
    const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
    
    if (head.x < 0 || head.x >= CONFIG.cols || head.y < 0 || head.y >= CONFIG.rows || state.snake.some(p => p.x === head.x && p.y === head.y)) {
        state.gameOver = true; state.shake = 10; AudioFX.playDeath();
        canvas.classList.add('death-pulse'); 
        document.body.classList.add('death-screen'); 
        
        // FIXED: Only update if score is better than current best
        if (!state.cheatsActive && state.score > state.wallet) { 
            state.wallet = state.score; 
        }
        
        save(); 
        state.menuTimeout = setTimeout(() => { 
            if(state.gameOver) { 
                document.getElementById('menu-text').textContent="CRASHED!"; 
                document.getElementById('ui-layer').classList.remove('hidden'); 
                renderShops(); 
            } 
        }, 800);
        return;
    }
    
    state.snake.unshift(head);
    if (head.x === state.food.x && head.y === state.food.y) {
        state.score++; 
        document.getElementById('score').textContent = state.score;
        AudioFX.playEat(); 
        state.shake = 8;
        canvas.classList.remove('eat-flash'); 
        void canvas.offsetWidth; 
        canvas.classList.add('eat-flash'); 
        
        // Particle color logic for Pink/Yellow and Rainbow
        let pCol;
        if(state.activeBall.color === 'special_pink_yellow') {
            pCol = (Math.random() > 0.5) ? '#ff00ff' : '#ffff00';
        } else {
            pCol = state.activeBall.color === 'rainbow' ? `hsl(${Math.random()*360}, 100%, 60%)` : state.activeBall.color;
        }
        
        explode(state.food.x, state.food.y, pCol); 
        if(state.activeSnake.id === 'svoid') state.eyeFlash = 1.0;
        spawnFood();
    } else {
        state.snake.pop();
    }
}

// Initializing the default state on join
document.addEventListener('DOMContentLoaded', () => {
    // ... other init code ...
    CONFIG.currentMode = 'hard'; // Force hard
    document.querySelectorAll('.speed-btn').forEach(btn => {
        if(btn.dataset.speed === 'hard') btn.classList.add('active');
    });
});


// Listener for the 2 Player Mode button
document.getElementById('twoPlayerBtn').addEventListener('click', function() {
    isTwoPlayer = true; // Enable 2 player flag
    resetGame();        // Reset game state
    gameLoop();         // Start the game loop
});
