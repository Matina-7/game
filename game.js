/********************
 * CANVAS
 ********************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

/********************
 * IMAGES (GitHub Pages safe paths)
 ********************/
const bgImg = new Image();
bgImg.src = "./assets/image1.png"; // red brick background

const catImg = new Image();
catImg.src = "./assets/image2.png"; // siamese cat

const coinImg = new Image();
coinImg.src = "./assets/image3.png"; // coin

const monsterImg = new Image();
monsterImg.src = "./assets/image4.png"; // monster

/********************
 * DOM
 ********************/
const startScreen = document.getElementById("startScreen");
const endingScreen = document.getElementById("endingScreen");
const dialogueBox = document.getElementById("dialogueBox");

const coinText = document.getElementById("coinCount");
const timerText = document.getElementById("timer");

/********************
 * INPUT
 ********************/
let keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/********************
 * GAME STATE
 ********************/
let gameStarted = false;
let gameEnded = false;
let dialogueActive = false;

/********************
 * TIMER
 ********************/
const TIME_LIMIT = 90;
let timeLeft = TIME_LIMIT;

/********************
 * PLAYER
 ********************/
const player = {
    x: 100,
    y: 380,
    w: 70,
    h: 70,
    vx: 0,
    vy: 0,
    speed: 3,        // slower movement
    jumpPower: 15,
    jumpsLeft: 2,    // double jump
    dashEnabled: false
};

const GRAVITY_DEFAULT = 0.8;
let gravity = GRAVITY_DEFAULT;

/********************
 * WORLD
 ********************/
const camera = { x: 0 };
let platforms = [];
let coins = [];
let monsters = [];

/********************
 * NARRATIVE
 ********************/
let dialogueTriggers = [600, 1400, 2200];
let triggerIndex = 0;

/********************
 * ITEMS
 ********************/
let activeItem = null;
let itemTimer = 0;

/********************
 * INIT LEVEL
 ********************/
function initLevel() {
    platforms = [];
    coins = [];
    monsters = [];

    // ground
    platforms.push({ x: 0, y: 450, w: 4000, h: 50 });

    // 8 platforms
    for (let i = 0; i < 8; i++) {
        platforms.push({
            x: 400 + i * 300,
            y: 320 - (i % 3) * 60,
            w: 120,
            h: 16
        });
    }

    // 10 coins
    for (let i = 0; i < 10; i++) {
        coins.push({
            x: 350 + i * 260,
            y: 260 - (i % 4) * 40,
            collected: false
        });
    }

    // 7 monsters
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
    triggerIndex = 0;
}

/********************
 * COLLISION
 ********************/
function hit(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

/********************
 * DIALOGUE
 ********************/
function showDialogue() {
    dialogueActive = true;
    dialogueBox.style.display = "block";
}

document.querySelectorAll(".choiceBtn").forEach(btn => {
    btn.onclick = () => {
        applyItem(btn.dataset.item);
        dialogueBox.style.display = "none";
        dialogueActive = false;
    };
});

/********************
 * ITEMS (5s)
 ********************/
function applyItem(item) {
    activeItem = item;
    itemTimer = 5;

    if (item === "spring") {
        player.jumpPower = 22;
    }
    if (item === "fish") {
        player.speed = 5;
        player.dashEnabled = true;
    }
    if (item === "balloon") {
        gravity = 0.3;
    }
}

function resetItem() {
    activeItem = null;
    player.jumpPower = 15;
    player.speed = 3;
    player.dashEnabled = false;
    gravity = GRAVITY_DEFAULT;
}

/********************
 * UPDATE
 ********************/
function update(dt) {
    if (!gameStarted || gameEnded || dialogueActive) return;

    timeLeft -= dt;
    timerText.textContent = `Time: ${timeLeft.toFixed(1)}`;

    if (timeLeft <= 0) {
        endGame(false);
        return;
    }

    // movement
    let move = 0;
    if (keys["a"]) move -= 1;
    if (keys["d"]) move += 1;

    let speed = player.speed;
    if (keys["shift"] && player.dashEnabled) speed *= 1.8;

    player.vx = move * speed;

    // jump
    if (keys["w"] && player.jumpsLeft > 0) {
        player.vy = -player.jumpPower;
        player.jumpsLeft--;
        keys["w"] = false;
    }

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    // platforms & ground
    let grounded = false;
    for (let p of platforms) {
        if (
            player.x + player.w > p.x &&
            player.x < p.x + p.w &&
            player.y + player.h > p.y &&
            player.y + player.h < p.y + p.h + 20 &&
            player.vy >= 0
        ) {
            player.y = p.y - player.h;
            player.vy = 0;
            grounded = true;
            player.jumpsLeft = 2;
        }
    }

    // coins
    coins.forEach(c => {
        if (!c.collected && hit(player, { ...c, w: 36, h: 36 })) {
            c.collected = true;
            const count = coins.filter(x => x.collected).length;
            coinText.textContent = `Coins: ${count} / 10`;
        }
    });

    // monsters → restart
    monsters.forEach(m => {
        if (hit(player, m)) restartGame();
    });

    // narrative triggers
    if (
        triggerIndex < dialogueTriggers.length &&
        player.x > dialogueTriggers[triggerIndex]
    ) {
        triggerIndex++;
        showDialogue();
    }

    // item timer
    if (itemTimer > 0) {
        itemTimer -= dt;
        if (itemTimer <= 0) resetItem();
    }

    // win
    if (player.x > 3600 && coins.filter(c => c.collected).length >= 7) {
        endGame(true);
    }

    camera.x = Math.max(0, player.x - 200);
}

/********************
 * DRAW
 ********************/
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.drawImage(bgImg, -camera.x * 0.4, 0, 5000, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, 0);

    // platforms
    ctx.fillStyle = "#444";
    platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // coins
    coins.forEach(c => {
        if (!c.collected) ctx.drawImage(coinImg, c.x, c.y, 36, 36);
    });

    // monsters
    monsters.forEach(m => {
        ctx.drawImage(monsterImg, m.x, m.y, m.w, m.h);
    });

    // player
    ctx.drawImage(catImg, player.x, player.y, player.w, player.h);

    ctx.restore();
}

/********************
 * LOOP
 ********************/
let last = performance.now();
function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

/********************
 * START / END
 ********************/
function restartGame() {
    location.reload();
}

function endGame(win) {
    gameEnded = true;
    endingScreen.style.display = "flex";
    endingScreen.querySelector("p").textContent = win
        ? "Thank you for adventuring with me! Play again?"
        : "Time is up! Try again!";
}

/********************
 * BUTTONS (safe binding)
 ********************/
const startBtn = document.getElementById("startBtn");
if (startBtn) {
    startBtn.onclick = () => {
        startScreen.style.display = "none";
        gameStarted = true;
        initLevel();
        requestAnimationFrame(loop);
    };
}

const restartBtn = document.getElementById("restartBtn");
if (restartBtn) {
    restartBtn.onclick = () => location.reload();
}
