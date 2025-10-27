// --- 1. INISIALISASI & SETUP AWAL ---

// Ambil elemen-elemen dari DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Konteks 2D untuk menggambar
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const startButton = document.getElementById('startButton');

// Fungsi untuk set ukuran canvas responsif
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 250);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    
    // Update posisi paddle dan ball sesuai ukuran baru
    if (!isGameRunning) {
        paddle.y = canvas.height - PADDLE_HEIGHT - 10;
        ball.y = paddle.y - BALL_RADIUS;
    }
}

// Panggil resize saat load dan saat ukuran window berubah
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// --- 2. VARIABEL & KONSTANTA GAME ---

// Variabel Game
let score = 0;
let lives = 3;
let level = 1;
let isGameRunning = false;

// Konstanta Paddle
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const PADDLE_SPEED = 8;

// Konstanta Ball
const BALL_RADIUS = 8;
let ballSpeedX = 4;
let ballSpeedY = -4;

// Konstanta Brick
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;

// Fungsi untuk menghitung ukuran brick berdasarkan canvas
function getBrickDimensions() {
    const BRICK_COLUMNS = Math.floor(canvas.width / 85);
    const BRICK_ROWS = Math.min(5, Math.floor((canvas.height - 150) / 35));
    const BRICK_WIDTH = (canvas.width - (BRICK_COLUMNS + 1) * BRICK_PADDING) / BRICK_COLUMNS;
    const BRICK_HEIGHT = 20;
    const BRICK_OFFSET_LEFT = BRICK_PADDING;
    
    return { BRICK_WIDTH, BRICK_HEIGHT, BRICK_ROWS, BRICK_COLUMNS, BRICK_OFFSET_LEFT };
}

// --- 3. OBJEK GAME ---

// Objek Paddle
let paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - PADDLE_HEIGHT - 10,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: PADDLE_SPEED
};

// Objek Ball
let ball = {
    x: canvas.width / 2,
    y: paddle.y - BALL_RADIUS,
    radius: BALL_RADIUS,
    speedX: ballSpeedX,
    speedY: ballSpeedY
};

// Array untuk menyimpan brick
let bricks = [];

// --- 4. FUNGSI-FUNGSI UTAMA ---

// Fungsi untuk membuat/menata ulang brick
function createBricks() {
    const { BRICK_ROWS, BRICK_COLUMNS } = getBrickDimensions();
    bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
        bricks[r] = [];
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            // Beri nilai 1 untuk menandakan brick aktif
            bricks[r][c] = { x: 0, y: 0, status: 1 };
        }
    }
}

// Fungsi untuk menggambar paddle
function drawPaddle() {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// Fungsi untuk menggambar ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.closePath();
}

// Fungsi untuk menggambar brick
function drawBricks() {
    const { BRICK_WIDTH, BRICK_HEIGHT, BRICK_ROWS, BRICK_COLUMNS, BRICK_OFFSET_LEFT } = getBrickDimensions();
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            if (bricks[r] && bricks[r][c] && bricks[r][c].status === 1) {
                const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                bricks[r][c].x = brickX;
                bricks[r][c].y = brickY;
                
                // Beri warna berbeda per baris
                const colors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db'];
                ctx.fillStyle = colors[r % colors.length];
                ctx.fillRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
            }
        }
    }
}

// Fungsi untuk deteksi tabrakan (Collision Detection)
function collisionDetection() {
    const { BRICK_WIDTH, BRICK_HEIGHT, BRICK_ROWS, BRICK_COLUMNS } = getBrickDimensions();
    for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLUMNS; c++) {
            const b = bricks[r] && bricks[r][c];
            if (b && b.status === 1) {
                if (ball.x > b.x && ball.x < b.x + BRICK_WIDTH && ball.y > b.y && ball.y < b.y + BRICK_HEIGHT) {
                    ball.speedY = -ball.speedY; // Balik arah Y
                    b.status = 0; // Hancurkan brick
                    score += 10;
                    scoreElement.innerText = score;

                    // Cek apakah semua brick sudah hancur
                    const totalBricks = BRICK_ROWS * BRICK_COLUMNS;
                    if (score === totalBricks * 10 * level) {
                        levelUp();
                    }
                }
            }
        }
    }
}

// --- 5. FUNGSI KONTROL & GAME STATE ---

// Fungsi untuk naik level
function levelUp() {
    level++;
    levelElement.innerText = level;
    ball.speedX *= 1.1; // Percepat ball 10%
    ball.speedY *= 1.1;
    resetBallAndPaddle();
    createBricks();
}

// Fungsi untuk reset posisi ball dan paddle
function resetBallAndPaddle() {
    ball.x = canvas.width / 2;
    ball.y = paddle.y - BALL_RADIUS;
    ball.speedX = Math.abs(ball.speedX) * (Math.random() > 0.5 ? 1 : -1); // Arah random
    ball.speedY = -Math.abs(ball.speedY); // Selalu ke atas saat reset
    
    paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
}

// Fungsi untuk menghentikan game
function gameOver() {
    isGameRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '50px Arial';
    ctx.fillStyle = '#e74c3c';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Skor Akhir: ' + score, canvas.width / 2, canvas.height / 2 + 40);
    startButton.disabled = false;
    startButton.innerText = 'Main Lagi';
}

// Fungsi utama game loop
function gameLoop() {
    if (!isGameRunning) return;

    // Hapus canvas sebelum menggambar ulang
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar semua objek
    drawBricks();
    drawPaddle();
    drawBall();
    collisionDetection();

    // Logika pergerakan Ball
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Deteksi tabrakan Ball dengan dinding (kiri/kanan/atas)
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.speedX = -ball.speedX;
    }
    if (ball.y - ball.radius < 0) {
        ball.speedY = -ball.speedY;
    }

    // Deteksi tabrakan Ball dengan Paddle
    if (ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        ball.speedY = -ball.speedY;
        // Tambahkan sedikit efek pada arah X berdasarkan tempat bola mengenai paddle
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.speedX = 8 * (hitPos - 0.5);
    }

    // Deteksi jika Ball jatuh ke bawah
    if (ball.y - ball.radius > canvas.height) {
        lives--;
        livesElement.innerText = lives;
        if (lives > 0) {
            resetBallAndPaddle();
        } else {
            gameOver();
        }
    }

    // Batasi paddle agar tidak keluar canvas
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

    // Lanjutkan ke frame berikutnya
    requestAnimationFrame(gameLoop);
}

// Fungsi untuk memulai game
function startGame() {
    // Reset semua variabel
    score = 0;
    lives = 3;
    level = 1;
    scoreElement.innerText = score;
    livesElement.innerText = lives;
    levelElement.innerText = level;
    
    // Reset kecepatan ball
    ball.speedX = 4;
    ball.speedY = -4;

    isGameRunning = true;
    startButton.disabled = true;
    createBricks();
    resetBallAndPaddle();
    gameLoop();
}

// --- 6. EVENT LISTENER ---

// Kontrol paddle dengan mouse
canvas.addEventListener('mousemove', (e) => {
    if (!isGameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    if (relativeX > PADDLE_WIDTH / 2 && relativeX < canvas.width - PADDLE_WIDTH / 2) {
        paddle.x = relativeX - PADDLE_WIDTH / 2;
    }
});

// Kontrol paddle dengan touch (untuk mobile)
canvas.addEventListener('touchmove', (e) => {
    if (!isGameRunning) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const relativeX = touch.clientX - rect.left;
    if (relativeX > PADDLE_WIDTH / 2 && relativeX < canvas.width - PADDLE_WIDTH / 2) {
        paddle.x = relativeX - PADDLE_WIDTH / 2;
    }
});

// Prevent default touch behavior
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
});

// Tombol untuk memulai
startButton.addEventListener('click', startGame);

// Inisialisasi awal (gambar brick di layar start)
resizeCanvas();
createBricks();
drawBricks();
drawPaddle();
drawBall();