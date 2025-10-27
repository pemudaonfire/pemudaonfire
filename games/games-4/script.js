// --- 1. SETUP CANVAS & CONTEXT ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elemen DOM
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const livesElement = document.getElementById('lives');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

// --- 2. KONSTANTA GAME ---

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Player
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 50;
const PLAYER_SPEED = 7;

// Bullet
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 15;
const BULLET_SPEED = 10;
const BULLET_COOLDOWN = 250; // ms

// Enemy
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const ENEMY_SPEED_BASE = 2;
const ENEMY_ROWS = 3;
const ENEMY_COLS = 8;
const ENEMY_PADDING = 10;
const ENEMY_SHOOT_CHANCE = 0.002; // Per frame

// Enemy Bullet
const ENEMY_BULLET_SPEED = 5;

// --- 3. VARIABEL GAME STATE ---

let gameRunning = false;
let gamePaused = false;
let score = 0;
let level = 1;
let lives = 3;
let lastBulletTime = 0;
let animationId = null;

// Input
let keys = {};
let touchX = null;
let autoShoot = false; // Untuk mobile

// --- 4. OBJEK GAME ---

// Player
let player = {
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 20,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    dx: 0
};

// Arrays
let bullets = [];
let enemies = [];
let enemyBullets = [];
let stars = []; // Untuk background

// --- 5. FUNGSI INISIALISASI ---

function initGame() {
    score = 0;
    level = 1;
    lives = 3;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    
    player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    player.y = CANVAS_HEIGHT - PLAYER_HEIGHT - 20;
    player.dx = 0;
    
    createStars();
    createEnemies();
    updateDisplay();
}

function createStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function createEnemies() {
    enemies = [];
    const startX = 50;
    const startY = 50;
    
    for (let row = 0; row < ENEMY_ROWS; row++) {
        for (let col = 0; col < ENEMY_COLS; col++) {
            enemies.push({
                x: startX + col * (ENEMY_WIDTH + ENEMY_PADDING),
                y: startY + row * (ENEMY_HEIGHT + ENEMY_PADDING),
                width: ENEMY_WIDTH,
                height: ENEMY_HEIGHT,
                alive: true,
                type: row // Jenis alien berdasarkan baris
            });
        }
    }
}

// --- 6. FUNGSI DRAWING ---

function drawStars() {
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

function drawPlayer() {
    // Body pesawat
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(player.x + player.width / 2 - 8, player.y + 15, 16, 12);
    
    // Wings
    ctx.fillStyle = '#00cc00';
    ctx.fillRect(player.x - 10, player.y + player.height - 15, 10, 15);
    ctx.fillRect(player.x + player.width, player.y + player.height - 15, 10, 15);
    
    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff00';
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function drawBullets() {
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffff00';
    
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    ctx.shadowBlur = 0;
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        // Warna berdasarkan tipe
        const colors = ['#ff0066', '#ff6600', '#9900ff'];
        ctx.fillStyle = colors[enemy.type];
        
        // Body alien
        ctx.fillRect(enemy.x + 5, enemy.y, enemy.width - 10, enemy.height);
        
        // Tentacles
        ctx.fillRect(enemy.x, enemy.y + 10, 5, enemy.height - 10);
        ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 10, 5, enemy.height - 10);
        
        // Eyes
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(enemy.x + 10, enemy.y + 8, 8, 8);
        ctx.fillRect(enemy.x + enemy.width - 18, enemy.y + 8, 8, 8);
        
        // Glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = colors[enemy.type];
        ctx.strokeStyle = colors[enemy.type];
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x + 5, enemy.y, enemy.width - 10, enemy.height);
        ctx.shadowBlur = 0;
    });
}

function drawEnemyBullets() {
    ctx.fillStyle = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff0000';
    
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT);
    });
    
    ctx.shadowBlur = 0;
}

function drawScore() {
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${level}`, 10, 30);
}

// --- 7. FUNGSI UPDATE ---

function updateStars() {
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * CANVAS_WIDTH;
        }
    });
}

function updatePlayer() {
    player.x += player.dx;
    
    // Batasan layar
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.width;
    }
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.y -= BULLET_SPEED;
        return bullet.y > -bullet.height;
    });
}

function updateEnemies() {
    const enemySpeed = ENEMY_SPEED_BASE * (1 + level * 0.2);
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.y += enemySpeed * 0.3; // Bergerak turun perlahan
        
        // Enemy shooting
        if (Math.random() < ENEMY_SHOOT_CHANCE * (1 + level * 0.5)) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - BULLET_WIDTH / 2,
                y: enemy.y + enemy.height,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT
            });
        }
    });
    
    // Cek jika enemy mencapai bawah
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height > CANVAS_HEIGHT - 100) {
            loseLife();
        }
    });
}

function updateEnemyBullets() {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.y += ENEMY_BULLET_SPEED;
        return bullet.y < CANVAS_HEIGHT;
    });
}

// --- 8. COLLISION DETECTION ---

function checkCollisions() {
    // Bullet vs Enemy
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (enemy.alive && isColliding(bullet, enemy)) {
                enemy.alive = false;
                bullets.splice(bIndex, 1);
                
                // Tambah score berdasarkan tipe enemy
                score += (enemy.type + 1) * 10;
                updateDisplay();
                
                // Cek level up
                if (enemies.every(e => !e.alive)) {
                    levelUp();
                }
            }
        });
    });
    
    // Enemy Bullet vs Player
    enemyBullets.forEach((bullet, index) => {
        if (isColliding(bullet, player)) {
            enemyBullets.splice(index, 1);
            loseLife();
        }
    });
    
    // Enemy vs Player (tabrakan langsung)
    enemies.forEach(enemy => {
        if (enemy.alive && isColliding(enemy, player)) {
            enemy.alive = false;
            loseLife();
        }
    });
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- 9. GAME STATE FUNCTIONS ---

function shoot() {
    const now = Date.now();
    if (now - lastBulletTime > BULLET_COOLDOWN) {
        bullets.push({
            x: player.x + player.width / 2 - BULLET_WIDTH / 2,
            y: player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT
        });
        lastBulletTime = now;
    }
}

function loseLife() {
    lives--;
    updateDisplay();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset posisi player
        player.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
        player.y = CANVAS_HEIGHT - PLAYER_HEIGHT - 20;
        
        // Hapus semua peluru musuh
        enemyBullets = [];
    }
}

function levelUp() {
    level++;
    updateDisplay();
    
    // Bonus skor
    score += level * 100;
    
    // Buat musuh baru
    createEnemies();
    
    // Clear bullets
    bullets = [];
    enemyBullets = [];
}

function gameOver() {
    gameRunning = false;
    gamePaused = false;
    
    // Tampilkan game over
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 60px Courier New';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff0000';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 30px Courier New';
    ctx.shadowColor = '#00ffff';
    ctx.fillText(`Skor Akhir: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`Level: ${level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    ctx.shadowBlur = 0;
    
    startButton.disabled = false;
    startButton.textContent = 'Main Lagi';
    pauseButton.disabled = true;
}

function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    pauseButton.textContent = gamePaused ? 'Resume' : 'Pause';
    
    if (!gamePaused) {
        gameLoop();
    }
}

// --- 10. GAME LOOP ---

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update
    updateStars();
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateEnemyBullets();
    checkCollisions();
    
    // Draw
    drawStars();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawEnemyBullets();
    drawScore();
    
    // Auto shoot untuk mobile
    if (autoShoot) {
        shoot();
    }
    
    // Continue loop
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    initGame();
    gameRunning = true;
    gamePaused = false;
    startButton.disabled = true;
    pauseButton.disabled = false;
    pauseButton.textContent = 'Pause';
    gameLoop();
}

// --- 11. INPUT HANDLING ---

// Keyboard
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;
    
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        shoot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update player movement berdasarkan keys
setInterval(() => {
    if (!gameRunning || gamePaused) return;
    
    player.dx = 0;
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.dx = -player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.dx = player.speed;
    }
}, 1000 / 60);

// Touch/Mouse untuk mobile
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    autoShoot = true;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    touchX = (e.touches[0].clientX - rect.left) * scaleX;
    
    player.x = touchX - player.width / 2;
    
    // Batasan
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.width;
    }
});

canvas.addEventListener('touchend', () => {
    autoShoot = false;
});

// Mouse support
canvas.addEventListener('mousedown', (e) => {
    if (!gameRunning || gamePaused) return;
    autoShoot = true;
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning || gamePaused || !autoShoot) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    
    player.x = mouseX - player.width / 2;
    
    // Batasan
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) {
        player.x = CANVAS_WIDTH - player.width;
    }
});

canvas.addEventListener('mouseup', () => {
    autoShoot = false;
});

canvas.addEventListener('mouseleave', () => {
    autoShoot = false;
});

// --- 12. UI UPDATES ---

function updateDisplay() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    
    const hearts = '❤️'.repeat(Math.max(0, lives));
    const emptyHearts = '🖤'.repeat(Math.max(0, 3 - lives));
    livesElement.textContent = hearts + emptyHearts;
}

// --- 13. EVENT LISTENERS ---

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

// --- 14. INISIALISASI ---

createStars();
drawStars();
