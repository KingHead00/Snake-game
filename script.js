const AudioFX = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    playEat() {
        this.init(); try { const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.1); } catch(e){}
    },
    playDeath() {
        this.init(); try { const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.4); } catch(e){}
    },
    playClick() {
        this.init(); try { const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.05);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.05); } catch(e){}
    }
};

const SNAKE_SKINS = [
    { id: 's1', name: 'NEON', head: '#00ffcc', body: '#00bfa5', price: 0 },
    { id: 'svoid', name: 'VOID', head: '#000000', body: '#000000', price: 0, pair: 'bvoid' },
    { id: 's_banana', name: 'BANANA', head: '#ffe135', body: '#ccb52b', price: 0 },
    { id: 's_pink', name: 'PINK', head: '#ff66cc', body: '#cc3399', price: 0, pair: 'b_yellow' },
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
    { id: 'b_yellow', name: 'YELLOW', color: '#ffff00', price: 0, pair: 's_pink' },
    { id: 'b2', name: 'LIGHT BLUE', color: '#00ffff', price: 10 },
    { id: 'b3', name: 'GREEN', color: '#00ff00', price: 20 },
    { id: 'b4', name: 'ORANGE', color: '#ff8800', price: 30 },
    { id: 'b5', name: 'RAINBOW', color: 'rainbow', price: 50 }
];

const state = {
    snake: [], dir: {x:1, y:0}, lastD: {x:1, y:0}, inputQueue: [],
    food: {x:0, y:0},
    score: 0, particles: [],
    wallet: parseInt(localStorage.getItem('neon_v4_best') || '0'), 
    username: localStorage.getItem('neon_v4_user') || '',
    ownedSkins: JSON.parse(localStorage.getItem('neon_v4_owned') || '["s1", "svoid", "s_banana", "s_pink"]'),
    ownedBalls: JSON.parse(localStorage.getItem('neon_v4_balls') || '["b1", "bvoid", "b_banana", "b_yellow"]'),
    activeSnake: JSON.parse(localStorage.getItem('neon_v4_active_s')) || SNAKE_SKINS[0],
    activeBall: JSON.parse(localStorage.getItem('neon_v4_active_b')) || BALL_COLORS[0],
    lastTime: 0, accumTime: 0, gameOver: true, shake: 0,
    menuTimeout: null, cheatsActive: false, eyeFlash: 0
};

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });
const CONFIG = { 
    cols: 31, rows: 15, cellSize: 0, 
    speeds: { 
        slow: { base: 6, boost: 0.1, max: 12 }, 
        normal: { base: 8, boost: 0.15, max: 18 }, 
        hard: { base: 11, boost: 0.15, max: 22 },
        impossible: { base: 18, boost: 0.3, max: 40 } 
    }, 
    currentMode: 'hard' 
};

function save() {
    if (state.cheatsActive) return; 
    localStorage.setItem('neon_v4_best', state.wallet);
    localStorage.setItem('neon_v4_user', state.username);
    localStorage.setItem('neon_v4_owned', JSON.stringify(state.ownedSkins));
    localStorage.setItem('neon_v4_balls', JSON.stringify(state.ownedBalls));
    localStorage.setItem('neon_v4_active_s', JSON.stringify(state.activeSnake));
    localStorage.setItem('neon_v4_active_b', JSON.stringify(state.activeBall));
}

function applyCheats() {
    AudioFX.playClick();
    state.cheatsActive = true;
    state.ownedSkins = SNAKE_SKINS.map(s => s.id);
    state.ownedBalls = BALL_COLORS.map(b => b.id);
    document.getElementById('cheat-btn').classList.add('active');
    document.getElementById('cheat-btn').innerText = "CHEATS ON (NO SAVING)";
    renderShops();
}

function explode(x, y, color) {
    for(let i=0; i<15; i++) {
        state.particles.push({
            x: x * CONFIG.cellSize + CONFIG.cellSize/2,
            y: y * CONFIG.cellSize + CONFIG.cellSize/2,
            vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
            life: 1.0, color: (color === '#000000' ? '#ffffff' : color)
        });
    }
}

function toggleShop(id) {
    AudioFX.playClick();
    const target = document.getElementById(id);
    const isOpen = target.classList.contains('open');
    document.querySelectorAll('.shop-content').forEach(s => s.classList.remove('open'));
    if (!isOpen) target.classList.add('open');
}

function renderShops() {
    document.getElementById('high').textContent = state.wallet;
    const sGrid = document.getElementById('snake-grid'); sGrid.innerHTML = '';
    SNAKE_SKINS.forEach(skin => {
        const isOwned = state.ownedSkins.includes(skin.id);
        const isSel = state.activeSnake.id === skin.id;
        const card = document.createElement('div');
        card.className = `skin-card ${isSel ? 'selected' : ''}`;
        card.innerHTML = `<div class="swatch" style="background:${skin.head==='rainbow'?'linear-gradient(45deg,red,blue)':skin.head}; border: ${skin.head==='#000000'?'1px solid #333':'none'}"></div><b>${skin.name}</b><br>${isSel?'ACTIVE':(isOwned?'OWNED':skin.price+' pts')}`;
        card.onclick = () => { 
            AudioFX.playClick(); 
            if(isOwned) {
                state.activeSnake=skin;
                if(skin.pair) state.activeBall = BALL_COLORS.find(b => b.id === skin.pair);
            } else if(state.wallet>=skin.price){
                state.wallet-=skin.price; state.ownedSkins.push(skin.id); state.activeSnake=skin;
                if(skin.pair) {
                    if(!state.ownedBalls.includes(skin.pair)) state.ownedBalls.push(skin.pair);
                    state.activeBall = BALL_COLORS.find(b => b.id === skin.pair);
                }
            } 
            save(); renderShops(); 
        };
        sGrid.appendChild(card);
    });
    const bGrid = document.getElementById('ball-grid'); bGrid.innerHTML = '';
    BALL_COLORS.forEach(ball => {
        const isOwned = state.ownedBalls.includes(ball.id);
        const isSel = state.activeBall.id === ball.id;
        const card = document.createElement('div');
        card.className = `skin-card ${isSel ? 'selected' : ''}`;
        card.innerHTML = `<div class="swatch" style="background:${ball.color==='rainbow'?'linear-gradient(45deg,red,blue)':ball.color}; border: ${ball.color==='#000000'?'1px solid #333':'none'}"></div><b>${ball.name}</b><br>${isSel?'ACTIVE':(isOwned?'OWNED':ball.price+' pts')}`;
        card.onclick = () => { 
            AudioFX.playClick(); 
            if(isOwned) {
                state.activeBall=ball;
                if(ball.pair) state.activeSnake = SNAKE_SKINS.find(s => s.id === ball.pair);
            } else if(state.wallet>=ball.price){
                state.wallet-=ball.price; state.ownedBalls.push(ball.id); state.activeBall=ball;
                if(ball.pair) {
                    if(!state.ownedSkins.includes(ball.pair)) state.ownedSkins.push(ball.pair);
                    state.activeSnake = SNAKE_SKINS.find(s => s.id === ball.pair);
                }
            } 
            save(); renderShops(); 
        };
        bGrid.appendChild(card);
    });
}

function resize() {
    const container = document.getElementById('game-container');
    if(!container) return;
    const rawSize = Math.min((container.clientWidth-20)/CONFIG.cols, (container.clientHeight-20)/CONFIG.rows);
    CONFIG.cellSize = Math.floor(rawSize);
    canvas.width = CONFIG.cols * CONFIG.cellSize; canvas.height = CONFIG.rows * CONFIG.cellSize;
}

function spawnFood() {
    state.food = { x: Math.floor(Math.random()*CONFIG.cols), y: Math.floor(Math.random()*CONFIG.rows) };
    if (state.snake.some(p => p.x === state.food.x && p.y === state.food.y)) spawnFood();
}

function startGame() {
    AudioFX.playClick();
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
        if (nextMove.x !== -state.lastD.x || nextMove.y !== -state.lastD.y) state.dir = nextMove;
    }
    state.lastD = state.dir; 
    const head = { x: state.snake[0].x + state.dir.x, y: state.snake[0].y + state.dir.y };
    if (head.x < 0 || head.x >= CONFIG.cols || head.y < 0 || head.y >= CONFIG.rows || state.snake.some(p => p.x === head.x && p.y === head.y)) {
        state.gameOver = true; state.shake = 10; AudioFX.playDeath();
        canvas.classList.add('death-pulse'); 
        if (state.score > state.wallet) { state.wallet = state.score; }
        save(); state.menuTimeout = setTimeout(() => { if(state.gameOver) { document.getElementById('menu-text').textContent="CRASHED!"; document.getElementById('ui-layer').classList.remove('hidden'); renderShops(); } }, 800);
        return;
    }
    state.snake.unshift(head);
    if (head.x === state.food.x && head.y === state.food.y) {
        state.score++; document.getElementById('score').textContent = state.score;
        AudioFX.playEat(); canvas.classList.remove('pulse'); void canvas.offsetWidth; canvas.classList.add('pulse'); 
        const pCol = state.activeBall.color === 'rainbow' ? `hsl(${Math.random()*360}, 100%, 60%)` : state.activeBall.color;
        explode(state.food.x, state.food.y, pCol); 
        if(state.activeSnake.id === 'svoid') state.eyeFlash = 1.0;
        spawnFood();
    } else state.snake.pop();
    if(state.eyeFlash > 0) state.eyeFlash -= 0.05;
}

function render(now) {
    ctx.setTransform(1,0,0,1,0,0); if (state.shake > 0) { ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake); state.shake *= 0.85; }
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath();
    for(let x=0; x<=canvas.width; x+=CONFIG.cellSize) { ctx.moveTo(x,0); ctx.lineTo(x, canvas.height); }
    for(let y=0; y<=canvas.height; y+=CONFIG.cellSize) { ctx.moveTo(0,y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();
    state.particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; if(p.life <= 0) { state.particles.splice(i,1); return; } ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); });
    ctx.globalAlpha = 1.0;
    const rHue = (now / 5) % 360;
    let bCol = state.activeBall.color === 'rainbow' ? `hsl(${rHue}, 100%, 60%)` : state.activeBall.color;
    
    ctx.fillStyle = bCol === '#000000' ? '#111' : bCol; 
    ctx.shadowBlur = bCol === '#000000' ? 0 : 15; ctx.shadowColor = bCol;
    if(bCol === '#000000') { ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; }
    ctx.beginPath(); ctx.arc(state.food.x*CONFIG.cellSize+CONFIG.cellSize/2, state.food.y*CONFIG.cellSize+CONFIG.cellSize/2, (CONFIG.cellSize/2.8)*(1+Math.sin(now/200)*0.1), 0, Math.PI*2); 
    ctx.fill(); if(bCol === '#000000') ctx.stroke();
    ctx.shadowBlur = 0;

    state.snake.forEach((seg, i) => {
        let sH = state.activeSnake.head === 'rainbow' ? `hsl(${rHue}, 100%, 50%)` : state.activeSnake.head;
        let sB = state.activeSnake.body === 'rainbow' ? `hsl(${(rHue-i*10)%360}, 100%, 40%)` : state.activeSnake.body;
        ctx.fillStyle = (i === 0) ? sH : sB;
        const r = i === 0 ? 8 : 4; const x = seg.x*CONFIG.cellSize+1; const y = seg.y*CONFIG.cellSize+1;
        const w = CONFIG.cellSize-2; const h = CONFIG.cellSize-2;
        ctx.beginPath(); 
        if(state.activeSnake.id === 'svoid') {
            ctx.strokeStyle = '#333333'; ctx.lineWidth = 2; 
            ctx.roundRect(x,y,w,h,r); ctx.fill(); ctx.stroke();
        } else {
            if(i === 0) { ctx.shadowBlur = 15; ctx.shadowColor = sH; }
            ctx.roundRect(x,y,w,h,r); ctx.fill();
            ctx.shadowBlur = 0;
        }
        if(i === 0) {
            let eyeColor = state.activeSnake.id === 'svoid' ? `rgb(255, ${Math.floor(255 * (1 - state.eyeFlash))}, ${Math.floor(255 * (1 - state.eyeFlash))})` : (state.activeSnake.head === '#000000' ? '#fff' : '#000');
            ctx.fillStyle = eyeColor; 
            if(state.eyeFlash > 0 && state.activeSnake.id === 'svoid') { ctx.shadowBlur = 15; ctx.shadowColor = '#f00'; }
            const eyeSize = CONFIG.cellSize / 8; const offset = CONFIG.cellSize / 4;
            let e1x, e1y, e2x, e2y;
            if (state.lastD.x === 1) { e1x = e2x = x + w - offset; e1y = y + offset; e2y = y + h - offset; }
            else if (state.lastD.x === -1) { e1x = e2x = x + offset; e1y = y + offset; e2y = y + h - offset; }
            else if (state.lastD.y === -1) { e1y = e2y = y + offset; e1x = x + offset; e2x = x + w - offset; }
            else { e1y = e2y = y + h - offset; e1x = x + offset; e2x = x + w - offset; }
            ctx.beginPath(); ctx.arc(e1x, e1y, eyeSize, 0, Math.PI*2); ctx.fill(); 
            ctx.beginPath(); ctx.arc(e2x, e2y, eyeSize, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
}

function loop(now) {
    if(state.gameOver) { render(now); if(state.shake > 0.1 || state.particles.length > 0) requestAnimationFrame(loop); return; }
    const dt = now - state.lastTime; state.lastTime = now; state.accumTime += dt;
    const p = CONFIG.speeds[CONFIG.currentMode];
    const step = 1000 / Math.min(p.max, p.base + (state.score * p.boost));
    while (state.accumTime >= step) { if (!state.gameOver) update(); state.accumTime -= step; }
    render(now); requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('resize', resize); resize();
    if (state.username) document.getElementById('username').value = state.username;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.onclick = () => { AudioFX.playClick(); document.querySelectorAll('.speed-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); CONFIG.currentMode=btn.dataset.speed; };
    });
    document.getElementById('start-btn').onclick = startGame;
    window.addEventListener('keydown', e => {
        if (document.activeElement.tagName === 'INPUT') return;
        const k = e.key.toLowerCase();
        if (k === 'r' || k === ' ') startGame();
        if (k === 'q') window.location.href = "https://www.google.com";
        if (state.gameOver) return;
        let nD = null;
        if (k === 'w' || k === 'arrowup') nD = {x:0, y:-1};
        else if (k === 's' || k === 'arrowdown') nD = {x:0, y:1};
        else if (k === 'a' || k === 'arrowleft') nD = {x:-1, y:0};
        else if (k === 'd' || k === 'arrowright') nD = {x:1, y:0};
        if (nD) {
            const lastPlanned = state.inputQueue.length > 0 ? state.inputQueue[state.inputQueue.length - 1] : state.lastD;
            if ((nD.x !== lastPlanned.x || nD.y !== lastPlanned.y) && (nD.x !== -lastPlanned.x || nD.y !== -lastPlanned.y)) {
                if (state.inputQueue.length < 2) state.inputQueue.push(nD);
            }
        }
    });
    renderShops();
});
