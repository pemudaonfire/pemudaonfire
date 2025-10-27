// --- 1. KONSTANTA & KONFIGURASI ---

// Simbol Unicode untuk bidak catur
const PIECES = {
    // Putih
    'K': '♔', // King
    'Q': '♕', // Queen
    'R': '♖', // Rook
    'B': '♗', // Bishop
    'N': '♘', // Knight
    'P': '♙', // Pawn
    // Hitam
    'k': '♚',
    'q': '♛',
    'r': '♜',
    'b': '♝',
    'n': '♞',
    'p': '♟'
};

// Posisi awal catur (notasi FEN sederhana)
const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

// --- 2. VARIABEL GLOBAL ---

let board = [];
let currentPlayer = 'white'; // 'white' atau 'black'
let selectedSquare = null;
let validMoves = [];
let moveHistory = [];
let capturedPieces = { white: [], black: [] };

// Elemen DOM
const chessboardElement = document.getElementById('chessboard');
const currentPlayerElement = document.getElementById('current-player');
const gameStatusElement = document.getElementById('game-status');
const resetButton = document.getElementById('resetButton');
const undoButton = document.getElementById('undoButton');
const capturedWhiteElement = document.getElementById('captured-white');
const capturedBlackElement = document.getElementById('captured-black');

// --- 3. FUNGSI INISIALISASI ---

// Inisialisasi papan catur
function initBoard() {
    board = INITIAL_BOARD.map(row => [...row]);
    currentPlayer = 'white';
    selectedSquare = null;
    validMoves = [];
    moveHistory = [];
    capturedPieces = { white: [], black: [] };
    renderBoard();
    updateDisplay();
}

// Render papan catur ke DOM
function renderBoard() {
    chessboardElement.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            
            // Tentukan warna kotak (catur pattern)
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            
            // Tambahkan bidak jika ada
            const piece = board[row][col];
            if (piece) {
                square.textContent = PIECES[piece];
            }
            
            // Tambahkan data posisi
            square.dataset.row = row;
            square.dataset.col = col;
            
            // Event listener
            square.addEventListener('click', () => handleSquareClick(row, col));
            
            chessboardElement.appendChild(square);
        }
    }
    
    // Highlight kotak yang dipilih dan valid moves
    highlightSquares();
}

// Highlight kotak terpilih dan langkah valid
function highlightSquares() {
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(square => {
        square.classList.remove('selected', 'valid-move', 'valid-capture');
    });
    
    if (selectedSquare) {
        const index = selectedSquare.row * 8 + selectedSquare.col;
        squares[index].classList.add('selected');
    }
    
    validMoves.forEach(move => {
        const index = move.row * 8 + move.col;
        if (move.isCapture) {
            squares[index].classList.add('valid-capture');
        } else {
            squares[index].classList.add('valid-move');
        }
    });
}

// --- 4. FUNGSI GAME LOGIC ---

// Handle klik pada kotak
function handleSquareClick(row, col) {
    const piece = board[row][col];
    
    // Jika ada kotak terpilih, coba pindahkan
    if (selectedSquare) {
        const isValidMove = validMoves.some(move => move.row === row && move.col === col);
        
        if (isValidMove) {
            makeMove(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            validMoves = [];
        } else if (piece && isCurrentPlayerPiece(piece)) {
            // Pilih bidak baru dari pemain yang sama
            selectSquare(row, col);
        } else {
            // Batal pilihan
            selectedSquare = null;
            validMoves = [];
        }
    } else if (piece && isCurrentPlayerPiece(piece)) {
        // Pilih bidak
        selectSquare(row, col);
    }
    
    renderBoard();
}

// Pilih kotak
function selectSquare(row, col) {
    selectedSquare = { row, col };
    validMoves = getValidMoves(row, col);
}

// Cek apakah bidak milik pemain saat ini
function isCurrentPlayerPiece(piece) {
    if (currentPlayer === 'white') {
        return piece === piece.toUpperCase();
    } else {
        return piece === piece.toLowerCase();
    }
}

// Dapatkan semua langkah valid untuk bidak
function getValidMoves(row, col) {
    const piece = board[row][col].toLowerCase();
    let moves = [];
    
    switch (piece) {
        case 'p':
            moves = getPawnMoves(row, col);
            break;
        case 'r':
            moves = getRookMoves(row, col);
            break;
        case 'n':
            moves = getKnightMoves(row, col);
            break;
        case 'b':
            moves = getBishopMoves(row, col);
            break;
        case 'q':
            moves = getQueenMoves(row, col);
            break;
        case 'k':
            moves = getKingMoves(row, col);
            break;
    }
    
    return moves;
}

// Langkah Pawn (Pion)
function getPawnMoves(row, col) {
    const moves = [];
    const piece = board[row][col];
    const direction = piece === piece.toUpperCase() ? -1 : 1; // Putih naik, Hitam turun
    const startRow = piece === piece.toUpperCase() ? 6 : 1;
    
    // Maju 1 kotak
    if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
        moves.push({ row: row + direction, col, isCapture: false });
        
        // Maju 2 kotak dari posisi awal
        if (row === startRow && !board[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col, isCapture: false });
        }
    }
    
    // Tangkap diagonal
    [-1, 1].forEach(dc => {
        const newRow = row + direction;
        const newCol = col + dc;
        if (isValidPosition(newRow, newCol) && board[newRow][newCol] && !isCurrentPlayerPiece(board[newRow][newCol])) {
            moves.push({ row: newRow, col: newCol, isCapture: true });
        }
    });
    
    return moves;
}

// Langkah Rook (Benteng)
function getRookMoves(row, col) {
    const moves = [];
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; // Kanan, Kiri, Bawah, Atas
    
    directions.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        
        while (isValidPosition(newRow, newCol)) {
            if (!board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, isCapture: false });
            } else {
                if (!isCurrentPlayerPiece(board[newRow][newCol])) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
                break;
            }
            newRow += dr;
            newCol += dc;
        }
    });
    
    return moves;
}

// Langkah Knight (Kuda)
function getKnightMoves(row, col) {
    const moves = [];
    const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    knightMoves.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isValidPosition(newRow, newCol)) {
            if (!board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, isCapture: false });
            } else if (!isCurrentPlayerPiece(board[newRow][newCol])) {
                moves.push({ row: newRow, col: newCol, isCapture: true });
            }
        }
    });
    
    return moves;
}

// Langkah Bishop (Gajah)
function getBishopMoves(row, col) {
    const moves = [];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // Diagonal
    
    directions.forEach(([dr, dc]) => {
        let newRow = row + dr;
        let newCol = col + dc;
        
        while (isValidPosition(newRow, newCol)) {
            if (!board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, isCapture: false });
            } else {
                if (!isCurrentPlayerPiece(board[newRow][newCol])) {
                    moves.push({ row: newRow, col: newCol, isCapture: true });
                }
                break;
            }
            newRow += dr;
            newCol += dc;
        }
    });
    
    return moves;
}

// Langkah Queen (Ratu) - kombinasi Rook dan Bishop
function getQueenMoves(row, col) {
    return [...getRookMoves(row, col), ...getBishopMoves(row, col)];
}

// Langkah King (Raja)
function getKingMoves(row, col) {
    const moves = [];
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    
    directions.forEach(([dr, dc]) => {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (isValidPosition(newRow, newCol)) {
            if (!board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, isCapture: false });
            } else if (!isCurrentPlayerPiece(board[newRow][newCol])) {
                moves.push({ row: newRow, col: newCol, isCapture: true });
            }
        }
    });
    
    return moves;
}

// Cek apakah posisi valid
function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Lakukan perpindahan
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    // Simpan state untuk undo
    moveHistory.push({
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        piece: piece,
        captured: capturedPiece,
        player: currentPlayer
    });
    
    // Tangkap bidak jika ada
    if (capturedPiece) {
        const capturedColor = capturedPiece === capturedPiece.toUpperCase() ? 'white' : 'black';
        capturedPieces[capturedColor].push(capturedPiece);
        updateCapturedDisplay();
        
        // Cek apakah King tertangkap (game over)
        if (capturedPiece.toLowerCase() === 'k') {
            gameOver(currentPlayer);
            return;
        }
    }
    
    // Pindahkan bidak
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = '';
    
    // Ganti giliran
    currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
    updateDisplay();
}

// Undo langkah terakhir
function undoMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory.pop();
    
    // Kembalikan bidak
    board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
    board[lastMove.to.row][lastMove.to.col] = lastMove.captured || '';
    
    // Kembalikan bidak tertangkap
    if (lastMove.captured) {
        const capturedColor = lastMove.captured === lastMove.captured.toUpperCase() ? 'white' : 'black';
        const index = capturedPieces[capturedColor].lastIndexOf(lastMove.captured);
        if (index > -1) {
            capturedPieces[capturedColor].splice(index, 1);
        }
        updateCapturedDisplay();
    }
    
    // Kembalikan giliran
    currentPlayer = lastMove.player;
    selectedSquare = null;
    validMoves = [];
    
    renderBoard();
    updateDisplay();
}

// Game Over
function gameOver(winner) {
    const winnerText = winner === 'white' ? 'Putih' : 'Hitam';
    gameStatusElement.textContent = `🏆 ${winnerText} MENANG! Raja lawan tertangkap!`;
    gameStatusElement.style.color = '#dc3545';
    
    // Disable klik
    chessboardElement.style.pointerEvents = 'none';
}

// --- 5. FUNGSI UPDATE DISPLAY ---

function updateDisplay() {
    const playerText = currentPlayer === 'white' ? 'Putih' : 'Hitam';
    currentPlayerElement.innerHTML = `Giliran: <strong>${playerText}</strong>`;
    
    if (moveHistory.length === 0) {
        gameStatusElement.textContent = 'Mulai permainan!';
        gameStatusElement.style.color = '#28a745';
    } else {
        gameStatusElement.textContent = `Langkah ke-${moveHistory.length}`;
        gameStatusElement.style.color = '#007bff';
    }
    
    undoButton.disabled = moveHistory.length === 0;
}

function updateCapturedDisplay() {
    capturedWhiteElement.innerHTML = capturedPieces.white
        .map(piece => `<span class="captured-piece">${PIECES[piece]}</span>`)
        .join('');
    
    capturedBlackElement.innerHTML = capturedPieces.black
        .map(piece => `<span class="captured-piece">${PIECES[piece]}</span>`)
        .join('');
}

// --- 6. EVENT LISTENERS ---

resetButton.addEventListener('click', () => {
    if (moveHistory.length > 0) {
        if (confirm('Apakah Anda yakin ingin memulai permainan baru?')) {
            chessboardElement.style.pointerEvents = 'auto';
            initBoard();
        }
    } else {
        chessboardElement.style.pointerEvents = 'auto';
        initBoard();
    }
});

undoButton.addEventListener('click', undoMove);

// --- 7. INISIALISASI GAME ---

initBoard();
