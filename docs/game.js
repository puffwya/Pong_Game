const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const pvpBtn = document.getElementById('pvpBtn');
const pveBtn = document.getElementById('pveBtn');
const difficultySelect = document.getElementById("difficultySelect");
const homeBtn = document.getElementById("homeButton");
const maxScoreSelect = document.getElementById('maxScoreSelect');
maxScoreSelect.addEventListener('change', () => {
  maxScore = parseInt(maxScoreSelect.value);
});

let leftScore = 0;
let rightScore = 0;

let aiDifficulty = "medium"; // Medium by default
let maxScore = 5; // 5 by default
let animationFrameId = null;
let mode = null;

let updateBall, movePaddle, getBallX, getBallY, getPaddleY;
let gameRunning = false;

Module.onRuntimeInitialized = () => {
  updateBall = Module.cwrap('updateBall', null, []);
  movePaddle = Module.cwrap('movePaddle', null, ['number', 'number']);
  getBallX = Module.cwrap('getBallX', 'number', []);
  getBallY = Module.cwrap('getBallY', 'number', []);
  getPaddleY = Module.cwrap('getPaddleY', 'number', ['number']);

  menu.style.display = 'block';
  canvas.style.display = 'none';

  pvpBtn.addEventListener('click', () => startPvP());
  pveBtn.addEventListener('click', () => {
    aiDifficulty = difficultySelect.value;
    startPvE();
  });
};

const keys = {};
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = true;
});
window.addEventListener('keyup', e => keys[e.key] = false);

function startPvP() {
  // Player vs Player mode
  mode = 'pvp'
  menu.style.display = 'none';
  homeBtn.style.display = "block";
  canvas.style.display = 'block';
  gameRunning = true;
  gameLoopPvP();
}

function startPvE() {
  // Player vs AI mode
  mode = 'pve'
  menu.style.display = 'none';
  homeBtn.style.display = "block";
  canvas.style.display = "block";
  gameRunning = true;
  gameLoopPvE();
}

function gameLoopPvP() {
  if (!gameRunning) return;

  // Player 1 controls: W/S
  if (keys['w']) movePaddle(0, -1);
  if (keys['s']) movePaddle(0, 1);

  // Player 2 controls: ArrowUp/ArrowDown
  if (keys['ArrowUp']) movePaddle(1, -1);
  if (keys['ArrowDown']) movePaddle(1, 1);

  updateBall();

  const ballX = getBallX();
  const ballY = getBallY();
  const leftY = getPaddleY(0);
  const rightY = getPaddleY(1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.fillRect(20, leftY, 10, 80);
  ctx.fillRect(canvas.width - 30, rightY, 10, 80);

  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';

  const scoredSide = Module.ccall('getLastScore', 'number');

  // Update score only when a new scoring event occurs
  if (scoredSide !== -1) {
    if (scoredSide == 0) {
      leftScore++;
    } else if (scoredSide == 1) {
      rightScore++;
    }
  }

  ctx.fillText(leftScore, canvas.width * 0.25, 50);
  ctx.fillText(rightScore, canvas.width * 0.75, 50);

  // Tells pong.cpp score was processed, reset lastScore to -1
  Module.ccall('clearLastScore', null, [], []);

  
  // Check for GameOver
  if (leftScore >= maxScore || rightScore >= maxScore) {
    cancelAnimationFrame(animationFrameId);
    showGameOverPopup(
      mode === 'pvp'
        ? (leftScore > rightScore ? 'Player 1' : 'Player 2')
        : (leftScore > rightScore ? 'Player' : 'AI')
    );
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoopPvP);
}

function gameLoopPvE() {
  if (!gameRunning) return;

  // Player 1 controls: ArrowUp/ArrowDown
  if (keys['ArrowUp']) movePaddle(0, -1);
  if (keys['ArrowDown']) movePaddle(0, 1);

  Module.ccall("updateGamePvE", null, ["string"], [aiDifficulty]);

  const ballX = getBallX();
  const ballY = getBallY();
  const leftY = getPaddleY(0);
  const rightY = getPaddleY(1);
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = 'white';
  ctx.fillRect(20, leftY, 10, 80);
  ctx.fillRect(canvas.width - 30, rightY, 10, 80);
  
  ctx.beginPath();
  ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '30px Arial';
  ctx.fillStyle = 'white';

  const scoredSide = Module.ccall('getLastScore', 'number');

  // Update score only when a new scoring event occurs
  if (scoredSide !== -1) {
    if (scoredSide == 0) {
      leftScore++;
    } else if (scoredSide == 1) {
      rightScore++;
    }
  }
  
  ctx.fillText(leftScore, canvas.width * 0.25, 50);
  ctx.fillText(rightScore, canvas.width * 0.75, 50);
  
  // Tells pong.cpp score was processed, reset lastScore to -1
  Module.ccall('clearLastScore', null, [], []);
  
  // Check for GameOver
  if (leftScore >= maxScore || rightScore >= maxScore) {
    cancelAnimationFrame(animationFrameId);
    showGameOverPopup(
      mode === 'pve'
        ? (leftScore > rightScore ? 'Player 1' : 'Player 2')
        : (leftScore > rightScore ? 'Player' : 'AI')
    );
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoopPvE);
}

function showGameOverPopup(winnerName) {
  const popup = document.getElementById("gameOverPopup");
  const winnerText = document.getElementById("winnerText");

  winnerText.textContent = `${winnerName} Wins!`;
  popup.classList.remove("hidden");
}

document.getElementById("resetGameBtn").addEventListener("click", () => {
  document.getElementById("gameOverPopup").classList.add("hidden");
  // Reset game state in C++
  Module.ccall('resetGame', null, [], []);

  // Reset game state in JS
  resetGame();

  // Reset the game based on current mode
  if (mode === "pvp") {
    startPvP();
  } else if (mode === "pve") {
    startPvE();
  } else {
    // fallback: go back to home screen or default behavior
    goHome();
  }
});

function goHome() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    gameRunning = false;
  }

  // Reset scores on JS side
  leftScore = 0;
  rightScore = 0;
  lastProcessedScore = -1;

  // Reset game state in C++
  Module.ccall('resetGame', null, [], []);

  // Hide game canvas and controls
  canvas.style.display = 'none';
  homeBtn.style.display = 'none';

  // Show main menu
  menu.style.display = 'block';
}


function resetGame() {

  // Reset scores
  leftScore = 0;
  rightScore = 0;

  // Hide game over popup
  document.getElementById("gameOverPopup").classList.add("hidden");

  gameOver = false;
}
