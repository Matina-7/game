/********************************************************
 * CANVAS
 ********************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/********************************************************
 * IMAGES  ⚠️ IMPORTANT: filenames with spaces
 ********************************************************/
const bgImg = new Image();
bgImg.src = "./image%201.png";   // red brick background

const catImg = new Image();
catImg.src = "./image%202.png";  // siamese cat

const coinImg = new Image();
coinImg.src = "./image%203.png"; // coin

const monsterImg = new Image();
monsterImg.src = "./image%204.png"; // monster

/********************************************************
 * INPUT
 ********************************************************/
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/********************************************************
 * HUD
 ********************************************************/
const coinText = document.getElementById("coinCount");
const timerText = document.getElementById("timer");

/********************************************************
 * GAME CONSTANTS
 ********************************************************/
const TIME_LIMIT = 90;
const GRAVITY = 0.8;

/********************************************************
 * PLAYER
 ********************************************************/
const player = {
  x: 100,
  y: 380,
  w: 70,
  h: 70,
  vx: 0,
  vy: 0,
  speed: 3,        // slow movement
  jumpPower: 15,
  jumpsLeft: 2
};

/********************************************************
 * WORLD
 ********************************************************/
const camera = { x: 0 };
let platforms = [];
let coins = [];
let monsters = [];

/********************************************************
 * STATE
 ********************************************************/
let timeLeft = TIME_LIMIT;
let collectedCoins = 0;
let gameOver = false;

/********************************************************
 * INIT LEVEL
 ********************************************************/
function initLevel() {
  platforms = [];
  coins = [];
  monsters = [];

  platforms.push({ x: 0, y: 450, w: 4000, h: 50 });

  for (let i = 0; i < 8; i++) {
    platforms.push({
      x: 400 + i * 300,
      y: 320 - (i % 3) * 60,
      w: 120,
      h: 16
    });
  }

  for (let i = 0; i < 10; i++) {
    coins.push({
      x: 350 + i * 260,
      y: 260 - (i % 4) * 40,
      collected: false
    });
  }

  for (let i = 0; i < 7; i++) {
    monsters.push({
      x: 700 + i * 420,
      y: 390,
      w: 60,
      h: 60
    });
  }

  player.x = 100;
  player.y = 380;
  player.vx = 0;
  player.vy = 0;
  player.jumpsLeft = 2;

  timeLeft = TIME_LIMIT;
  collectedCoins = 0;
  gameOver = false;

  coinText.textContent = "Coins: 0 / 10";
}

/********************************************************
 * COLLISION
 ********************************************************/
function hit(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/********************************************************
 * UPDATE
 ********************************************************/
function update(dt) {
  if (gameOver) return;

  timeLeft -= dt;
  timerText.textContent = `Time: ${timeLeft.toFixed(1)}`;

  if (timeLeft <= 0) {
    gameOver = true;
    timerText.textContent = "Time: 0.0";
    return;
  }

  let move = 0;
  if (keys["a"]) move -= 1;
  if (keys["d"]) move += 1;
  player.vx = move * player.speed;

  if (keys["w"] && player.jumpsLeft > 0) {
    player.vy = -player.jumpPower;
    player.jumpsLeft--;
    keys["w"] = false;
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  for (const p of platforms) {
    if (
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h > p.y &&
      player.y + player.h < p.y + p.h + 20 &&
      player.vy >= 0
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.jumpsLeft = 2;
    }
  }

  coins.forEach(c => {
    if (!c.collected && hit(player, { ...c, w: 36, h: 36 })) {
      c.collected = true;
      collectedCoins++;
      coinText.textContent = `Coins: ${collectedCoins} / 10`;
    }
  });

  monsters.forEach(m => {
    if (hit(player, m)) initLevel();
  });

  if (player.x > 3600 && collectedCoins >= 7) {
    gameOver = true;
    timerText.textContent = "You Win!";
  }

  camera.x = Math.max(0, player.x - 200);
}

/********************************************************
 * DRAW
 ********************************************************/
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(bgImg, -camera.x * 0.4, 0, 5000, canvas.height);

  ctx.save();
  ctx.translate(-camera.x, 0);

  platforms.forEach(p => {
    ctx.fillStyle = "#444";
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  coins.forEach(c => {
    if (!c.collected) ctx.drawImage(coinImg, c.x, c.y, 36, 36);
  });

  monsters.forEach(m => {
    ctx.drawImage(monsterImg, m.x, m.y, m.w, m.h);
  });

  ctx.drawImage(catImg, player.x, player.y, player.w, player.h);

  ctx.restore();
}

/********************************************************
 * LOOP
 ********************************************************/
let lastTime = performance.now();
function loop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

/********************************************************
 * AUTO START
 ********************************************************/
initLevel();
requestAnimationFrame(loop);
