// --- 1. SETUP CANVAS & CONTEXT ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elemen DOM
const levelElement = document.getElementById('level');
const stepsElement = document.getElementById('steps');
const timeElement = document.getElementById('time');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const nextLevelButton = document.getElementById('nextLevelButton');

// Arrow buttons
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

// --- 2. KONSTANTA GAME ---

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Isometric settings
const TILE_WIDTH = 40;
const TILE_HEIGHT = 20;
const WALL_HEIGHT = 30;

// Maze settings
const MAZE_SIZES = [
    { rows: 7, cols: 7 },   // Level 1
    { rows: 9, cols: 9 },   // Level 2
    { rows: 11, cols: 11 }, // Level 3
    { rows: 13, cols: 13 }, // Level 4
    { rows: 15, cols: 15 }  // Level 5
];

// Colors
const COLORS = {
    floor: '#8B7355',
    floorDark: '#6B5335',
    wall: '#4A4A4A',
    wallDark: '#2A2A2A',
    wallTop: '#6A6A6A',
    player: '#FF6347',
    playerShadow: 'rgba(0, 0, 0, 0.3)',
    exit: '#32CD32',
    star: '#FFD700',
    path: 'rgba(255, 255, 0, 0.2)'
};

// --- 3. VARIABEL GAME STATE ---

let gameRunning = false;
let currentLevel = 1;
let steps = 0;
let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;

// Player
let player = {
    row: 1,
    col: 1
};

// Maze
let maze = [];
let exit = { row: 0, col: 0 };
let stars = [];
let collectedStars = 0;

// Camera offset for centering
let offsetX = 0;
let offsetY = 0;

// --- 4. MAZE GENERATION (Recursive Backtracking Algorithm) ---

function generateMaze(rows, cols) {
    // Initialize maze dengan semua dinding
    const maze = Array(rows).fill(null).map(() => Array(cols).fill(1));
    
    // Stack untuk backtracking
    const stack = [];
    const startRow = 1;
    const startCol = 1;
    
    // Mulai dari posisi awal
    maze[startRow][startCol] = 0;
    stack.push([startRow, startCol]);
    
    // Directions: up, right, down, left
    const directions = [
        [-2, 0], [0, 2], [2, 0], [0, -2]
    ];
    
    while (stack.length > 0) {
        const [row, col] = stack[stack.length - 1];
        
        // Shuffle directions
        const shuffled = directions.sort(() => Math.random() - 0.5);
        let moved = false;
        
        for (const [dr, dc] of shuffled) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            // Check bounds
            if (newRow > 0 && newRow < rows - 1 && newCol > 0 && newCol < cols - 1) {
                if (maze[newRow][newCol] === 1) {
                    // Carve path
                    maze[newRow][newCol] = 0;
                    maze[row + dr / 2][col + dc / 2] = 0;
                    stack.push([newRow, newCol]);
                    moved = true;
                    break;
                }
            }
        }
        
        if (!moved) {
            stack.pop();
        }
    }
    
    return maze;
}

function initLevel() {
    const size = MAZE_SIZES[Math.min(currentLevel - 1, MAZE_SIZES.length - 1)];
    maze = generateMaze(size.rows, size.cols);
    
    // Set player start position
    player.row = 1;
    player.col = 1;
    
    // Set exit position (bottom-right corner area)
    exit.row = size.rows - 2;
    exit.col = size.cols - 2;
    maze[exit.row][exit.col] = 2; // 2 = exit
    
    // Generate stars (collectibles)
    stars = [];
    collectedStars = 0;
    const starCount = Math.min(currentLevel + 2, 8);
    
    for (let i = 0; i < starCount; i++) {
        let starRow, starCol;
        do {
            starRow = 1 + Math.floor(Math.random() * (size.rows - 2));
            starCol = 1 + Math.floor(Math.random() * (size.cols - 2));
        } while (
            maze[starRow][starCol] !== 0 || 
            (starRow === player.row && starCol === player.col) ||
            (starRow === exit.row && starCol === exit.col) ||
            stars.some(s => s.row === starRow && s.col === starCol)
        );
        
        stars.push({ row: starRow, col: starCol, collected: false });
    }
    
    // Reset game state
    steps = 0;
    startTime = Date.now();
    elapsedTime = 0;
    
    // Calculate camera offset
    calculateOffset();
    
    updateDisplay();
}

function calculateOffset() {
    const mazeRows = maze.length;
    const mazeCols = maze[0].length;
    
    // Calculate maze dimensions in isometric view
    const mazeWidth = (mazeRows + mazeCols) * TILE_WIDTH / 2;
    const mazeHeight = (mazeRows + mazeCols) * TILE_HEIGHT / 2;
    
    offsetX = CANVAS_WIDTH / 2;
    offsetY = 100;
}

// --- 5. ISOMETRIC CONVERSION ---

function toIsometric(row, col) {
    const x = (col - row) * TILE_WIDTH / 2;
    const y = (col + row) * TILE_HEIGHT / 2;
    return { x: x + offsetX, y: y + offsetY };
}

// --- 6. DRAWING FUNCTIONS ---

function drawFloorTile(row, col) {
    const pos = toIsometric(row, col);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
    ctx.lineTo(pos.x, pos.y + TILE_HEIGHT);
    ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
    ctx.closePath();
    
    // Gradient for depth
    const gradient = ctx.createLinearGradient(pos.x - TILE_WIDTH / 2, pos.y, pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT);
    gradient.addColorStop(0, COLORS.floor);
    gradient.addColorStop(1, COLORS.floorDark);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = COLORS.wallDark;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawWall(row, col) {
    const pos = toIsometric(row, col);
    
    // Left face
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
    ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(pos.x, pos.y + WALL_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = COLORS.wallDark;
    ctx.fill();
    ctx.strokeStyle = COLORS.wallDark;
    ctx.stroke();
    
    // Right face
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
    ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(pos.x, pos.y + WALL_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = COLORS.wall;
    ctx.fill();
    ctx.strokeStyle = COLORS.wallDark;
    ctx.stroke();
    
    // Top face
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
    ctx.lineTo(pos.x, pos.y + TILE_HEIGHT);
    ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fillStyle = COLORS.wallTop;
    ctx.fill();
    ctx.strokeStyle = COLORS.wallDark;
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawExit(row, col) {
    const pos = toIsometric(row, col);
    
    // Flag pole
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y + TILE_HEIGHT / 2);
    ctx.lineTo(pos.x, pos.y - 30);
    ctx.stroke();
    
    // Flag
    ctx.fillStyle = COLORS.exit;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 30);
    ctx.lineTo(pos.x + 25, pos.y - 22);
    ctx.lineTo(pos.x, pos.y - 15);
    ctx.closePath();
    ctx.fill();
    
    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.exit;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawStar(row, col) {
    const pos = toIsometric(row, col);
    const time = Date.now() / 1000;
    const bounce = Math.sin(time * 3) * 5;
    
    ctx.save();
    ctx.translate(pos.x, pos.y - 10 + bounce);
    
    // Star shape
    ctx.fillStyle = COLORS.star;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.star;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? 8 : 4;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.restore();
}

function drawPlayer() {
    const pos = toIsometric(player.row, player.col);
    
    // Shadow
    ctx.fillStyle = COLORS.playerShadow;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + TILE_HEIGHT / 2 + 5, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body (sphere)
    const gradient = ctx.createRadialGradient(pos.x - 5, pos.y - 15, 5, pos.x, pos.y - 10, 15);
    gradient.addColorStop(0, '#FF8C69');
    gradient.addColorStop(1, COLORS.player);
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.player;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y - 10, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(pos.x - 5, pos.y - 12, 3, 0, Math.PI * 2);
    ctx.arc(pos.x + 5, pos.y - 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(pos.x - 5, pos.y - 12, 1.5, 0, Math.PI * 2);
    ctx.arc(pos.x + 5, pos.y - 12, 1.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawMaze() {
    // Draw from back to front for proper layering
    for (let row = maze.length - 1; row >= 0; row--) {
        for (let col = 0; col < maze[0].length; col++) {
            if (maze[row][col] === 0 || maze[row][col] === 2) {
                drawFloorTile(row, col);
            }
        }
    }
    
    // Draw walls
    for (let row = 0; row < maze.length; row++) {
        for (let col = 0; col < maze[0].length; col++) {
            if (maze[row][col] === 1) {
                drawWall(row, col);
            }
        }
    }
    
    // Draw stars
    stars.forEach(star => {
        if (!star.collected) {
            drawStar(star.row, star.col);
        }
    });
    
    // Draw exit
    drawExit(exit.row, exit.col);
    
    // Draw player
    drawPlayer();
}

// --- 7. GAME LOGIC ---

function movePlayer(dRow, dCol) {
    if (!gameRunning) return;
    
    const newRow = player.row + dRow;
    const newCol = player.col + dCol;
    
    // Check bounds and walls
    if (newRow >= 0 && newRow < maze.length && 
        newCol >= 0 && newCol < maze[0].length && 
        maze[newRow][newCol] !== 1) {
        
        player.row = newRow;
        player.col = newCol;
        steps++;
        updateDisplay();
        
        // Check for star collection
        stars.forEach(star => {
            if (!star.collected && star.row === player.row && star.col === player.col) {
                star.collected = true;
                collectedStars++;
            }
        });
        
        // Check for exit
        if (player.row === exit.row && player.col === exit.col) {
            levelComplete();
        }
        
        render();
    }
}

function levelComplete() {
    gameRunning = false;
    clearInterval(timerInterval);
    
    // Calculate bonus
    const timeBonus = Math.max(0, 100 - Math.floor(elapsedTime / 1000));
    const starBonus = collectedStars * 50;
    const totalScore = steps + timeBonus + starBonus;
    
    // Draw completion message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFD700';
    ctx.fillText('LEVEL SELESAI!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 25px Arial';
    ctx.fillText(`Langkah: ${steps}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.fillText(`Waktu: ${formatTime(elapsedTime)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    ctx.fillText(`Bintang: ${collectedStars}/${stars.length}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    ctx.shadowBlur = 0;
    
    resetButton.disabled = false;
    nextLevelButton.disabled = false;
}

function startGame() {
    currentLevel = 1;
    gameRunning = true;
    initLevel();
    startTimer();
    startButton.disabled = true;
    resetButton.disabled = false;
    nextLevelButton.disabled = true;
    render();
}

function resetLevel() {
    gameRunning = true;
    initLevel();
    startTimer();
    nextLevelButton.disabled = true;
    render();
}

function nextLevel() {
    currentLevel++;
    if (currentLevel > MAZE_SIZES.length) {
        // Game completed
        gameRunning = false;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#FFD700';
        ctx.fillText('SELAMAT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        ctx.font = 'bold 30px Arial';
        ctx.fillText('Anda menyelesaikan semua level!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.shadowBlur = 0;
        
        startButton.disabled = false;
        startButton.textContent = 'Main Lagi';
        resetButton.disabled = true;
        nextLevelButton.disabled = true;
        return;
    }
    
    gameRunning = true;
    initLevel();
    startTimer();
    nextLevelButton.disabled = true;
    render();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameRunning) {
            elapsedTime = Date.now() - startTime;
            timeElement.textContent = formatTime(elapsedTime);
        }
    }, 100);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updateDisplay() {
    levelElement.textContent = currentLevel;
    stepsElement.textContent = steps;
}

function render() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMaze();
}

// --- 8. INPUT HANDLING ---

// Keyboard
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            movePlayer(-1, 0);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            movePlayer(1, 0);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            movePlayer(0, -1);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            movePlayer(0, 1);
            break;
    }
});

// Arrow buttons
btnUp.addEventListener('click', () => movePlayer(-1, 0));
btnDown.addEventListener('click', () => movePlayer(1, 0));
btnLeft.addEventListener('click', () => movePlayer(0, -1));
btnRight.addEventListener('click', () => movePlayer(0, 1));

// --- 9. EVENT LISTENERS ---

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetLevel);
nextLevelButton.addEventListener('click', nextLevel);

// --- 10. INITIALIZATION ---

// Draw initial screen
ctx.fillStyle = '#fff';
ctx.font = 'bold 30px Arial';
ctx.textAlign = 'center';
ctx.fillText('Tekan "Mulai Game" untuk bermain!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
