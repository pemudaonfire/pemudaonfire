// --- 1. SETUP CANVAS & CONTEXT ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elemen DOM
const scoreElement = document.getElementById('score');
const distanceElement = document.getElementById('distance');
const speedElement = document.getElementById('speed');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');

// --- 2. KONSTANTA GAME ---

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const GROUND_HEIGHT = 50;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;

// Player
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const PLAYER_X = 100;
const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const SLIDE_DURATION = 500; // ms

// Obstacles
const OBSTACLE_MIN_WIDTH = 20;
const OBSTACLE_MAX_WIDTH = 50;
const OBSTACLE_MIN_HEIGHT = 30;
const OBSTACLE_MAX_HEIGHT = 70;
const OBSTACLE_SPAWN_DISTANCE = 300; // Jarak antar rintangan

// Coins
const COIN_SIZE = 20;
const COIN_VALUE = 10;

// Clouds
const CLOUD_SPEED = 0.5;

// --- 3. VARIABEL GAME STATE ---

let gameRunning = false;
let gamePaused = false;
let score = 0;
let distance = 0;
let gameSpeed = 6;
let speedMultiplier = 1;
let lastObstacleX = CANVAS_WIDTH;
let animationId = null;

// Player state
let player = {
    x: PLAYER_X,
    y: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    slideStartTime: 0
};

// Arrays
let obstacles = [];
let coins = [];
let clouds = [];
let particles = []; // Untuk efek visual

// Input
let keys = {};
let touchStartY = 0;

// --- 4. FUNGSI INISIALISASI ---

function initGame() {
    score = 0;
    distance = 0;
    gameSpeed = 6;
    speedMultiplier = 1;
    lastObstacleX = CANVAS_WIDTH;
    
    player = {
        x: PLAYER_X,
        y: GROUND_Y - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        velocityY: 0,
        isJumping: false,
        isSliding: false,
        slideStartTime: 0
    };
    
    obstacles = [];
    coins = [];
    clouds = [];
    particles = [];
    
    createClouds();
    updateDisplay();
}

function createClouds() {
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * (GROUND_Y - 100),
            width: 60 + Math.random() * 40,
            height: 30 + Math.random() * 20,
            speed: CLOUD_SPEED + Math.random() * 0.5
        });
    }
}

// --- 5. FUNGSI DRAWING ---

function drawBackground() {
    // Langit sudah di CSS gradient, tambah matahari
    ctx.fillStyle = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFD700';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 100, 80, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    clouds.forEach(cloud => {
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.height / 2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 3, cloud.y - 10, cloud.height / 2.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width / 1.5, cloud.y, cloud.height / 2.2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawGround() {
    // Rumput
    ctx.fillStyle = '#7CCD7C';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Garis tanah
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
    
    // Rumput detail (animasi)
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 10) {
        const offset = (distance * gameSpeed) % 20;
        ctx.beginPath();
        ctx.moveTo(i - offset, GROUND_Y + 5);
        ctx.lineTo(i - offset + 3, GROUND_Y + 15);
        ctx.stroke();
    }
}

function drawPlayer() {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width / 2, GROUND_Y + 5, player.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#FF6347';
    if (player.isSliding) {
        // Posisi sliding (lebih pendek dan lebar)
        ctx.fillRect(player.x, player.y + 30, player.width + 20, player.height - 30);
    } else {
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Head
    ctx.fillStyle = '#FFB6C1';
    const headY = player.isSliding ? player.y + 30 : player.y;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, headY + 10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 5, headY + 8, 3, 0, Math.PI * 2);
    ctx.arc(player.x + player.width / 2 + 5, headY + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Legs (animasi berlari)
    if (!player.isJumping && !player.isSliding) {
        const legOffset = Math.sin(Date.now() / 100) * 5;
        ctx.fillStyle = '#000';
        ctx.fillRect(player.x + 8, player.y + player.height, 8, 5 + legOffset);
        ctx.fillRect(player.x + player.width - 16, player.y + player.height, 8, 5 - legOffset);
    }
    
    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    if (player.isSliding) {
        ctx.strokeRect(player.x, player.y + 30, player.width + 20, player.height - 30);
    } else {
        ctx.strokeRect(player.x, player.y, player.width, player.height);
    }
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        // Obstacle utama (cactus/batu)
        ctx.fillStyle = '#654321';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Detail
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
        
        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawCoins() {
    coins.forEach(coin => {
        // Coin dengan animasi rotasi
        const rotation = (Date.now() / 5) % 360;
        
        ctx.save();
        ctx.translate(coin.x + coin.size / 2, coin.y + coin.size / 2);
        ctx.rotate(rotation * Math.PI / 180);
        
        // Koin emas
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, coin.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Detail koin
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, coin.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Simbol $
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    });
}

function drawParticles() {
    particles.forEach((particle, index) => {
        particle.life--;
        particle.y -= particle.vy;
        particle.x += particle.vx;
        particle.alpha -= 0.02;
        
        if (particle.life <= 0 || particle.alpha <= 0) {
            particles.splice(index, 1);
            return;
        }
        
        ctx.fillStyle = `rgba(255, 215, 0, ${particle.alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// --- 6. FUNGSI UPDATE ---

function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = CANVAS_WIDTH;
            cloud.y = Math.random() * (GROUND_Y - 100);
        }
    });
}

function updatePlayer() {
    // Handle sliding duration
    if (player.isSliding) {
        if (Date.now() - player.slideStartTime > SLIDE_DURATION) {
            player.isSliding = false;
            player.height = PLAYER_HEIGHT;
            player.y = GROUND_Y - PLAYER_HEIGHT;
        }
    }
    
    // Gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y >= GROUND_Y - player.height) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
}

function updateObstacles() {
    // Spawn obstacles
    if (lastObstacleX < CANVAS_WIDTH - OBSTACLE_SPAWN_DISTANCE) {
        const obstacleWidth = OBSTACLE_MIN_WIDTH + Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH);
        const obstacleHeight = OBSTACLE_MIN_HEIGHT + Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
        
        obstacles.push({
            x: CANVAS_WIDTH,
            y: GROUND_Y - obstacleHeight,
            width: obstacleWidth,
            height: obstacleHeight
        });
        
        // Random coin spawn
        if (Math.random() < 0.5) {
            coins.push({
                x: CANVAS_WIDTH + 50,
                y: GROUND_Y - 100 - Math.random() * 50,
                size: COIN_SIZE,
                collected: false
            });
        }
        
        lastObstacleX = CANVAS_WIDTH;
    }
    
    // Move obstacles
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
            lastObstacleX = 0;
        }
    });
}

function updateCoins() {
    coins.forEach((coin, index) => {
        coin.x -= gameSpeed;
        
        if (coin.x + coin.size < 0) {
            coins.splice(index, 1);
        }
    });
}

function updateGameSpeed() {
    // Increase speed over time
    distance += gameSpeed / 10;
    speedMultiplier = 1 + Math.floor(distance / 500) * 0.1;
    gameSpeed = 6 + Math.floor(distance / 500) * 0.5;
}

// --- 7. COLLISION DETECTION ---

function checkCollisions() {
    // Player vs Obstacles
    obstacles.forEach(obstacle => {
        if (isColliding(player, obstacle)) {
            gameOver();
        }
    });
    
    // Player vs Coins
    coins.forEach((coin, index) => {
        if (!coin.collected && isColliding(player, coin)) {
            coin.collected = true;
            score += COIN_VALUE;
            updateDisplay();
            
            // Create particles effect
            for (let i = 0; i < 10; i++) {
                particles.push({
                    x: coin.x + coin.size / 2,
                    y: coin.y + coin.size / 2,
                    size: 3 + Math.random() * 3,
                    vx: (Math.random() - 0.5) * 3,
                    vy: Math.random() * 2 + 1,
                    life: 30,
                    alpha: 1
                });
            }
            
            coins.splice(index, 1);
        }
    });
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// --- 8. GAME STATE FUNCTIONS ---

function jump() {
    if (!player.isJumping && !player.isSliding) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideStartTime = Date.now();
        player.height = 30;
        player.y = GROUND_Y - 30;
    }
}

function gameOver() {
    gameRunning = false;
    gamePaused = false;
    
    // Tampilkan game over
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FF6347';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FF6347';
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 30px Arial';
    ctx.shadowColor = '#FFD700';
    ctx.fillText(`Skor: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`Jarak: ${Math.floor(distance)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
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
    } else {
        // Draw pause screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSE', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

// --- 9. GAME LOOP ---

function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Update
    updateClouds();
    updatePlayer();
    updateObstacles();
    updateCoins();
    updateGameSpeed();
    checkCollisions();
    
    // Draw
    drawBackground();
    drawClouds();
    drawGround();
    drawObstacles();
    drawCoins();
    drawParticles();
    drawPlayer();
    
    // Update score
    score += Math.floor(speedMultiplier);
    updateDisplay();
    
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

// --- 10. INPUT HANDLING ---

// Keyboard
document.addEventListener('keydown', (e) => {
    if (!gameRunning || gamePaused) return;
    
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
    }
    
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        slide();
    }
});

// Touch controls
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    
    if (deltaY > 30) {
        // Swipe down - slide
        slide();
    } else if (deltaY < -30) {
        // Swipe up - jump (optional)
        jump();
    } else {
        // Tap - jump
        jump();
    }
});

// Click untuk jump
canvas.addEventListener('click', () => {
    if (!gameRunning || gamePaused) return;
    jump();
});

// --- 11. UI UPDATES ---

function updateDisplay() {
    scoreElement.textContent = score;
    distanceElement.textContent = Math.floor(distance) + 'm';
    speedElement.textContent = speedMultiplier.toFixed(1) + 'x';
}

// --- 12. EVENT LISTENERS ---

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

// --- 13. INISIALISASI ---

createClouds();
drawBackground();
drawClouds();
drawGround();
