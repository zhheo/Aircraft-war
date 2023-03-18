const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameInterval;
let lastFrameTime = 0;

function resetGame() {
  plane = new Plane();
  bullets = [];
  monsters = [];
  gifts = [];
  score = 0;
  lastBulletTime = 0;
  lastMonsterTime = 0;
  lastGiftTime = 0;
  gameOverStatus = false;
}


function spawnMonster() {
    const x = Math.random() * (canvas.width - 40);
    const monster = new Monster(x, -40);
    monsters.push(monster);
}

function spawnGift() {
    const x = Math.random() * (canvas.width - 20);
    const gift = new Gift(x, -20);
    gifts.push(gift);
}

class GameObject {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Plane extends GameObject {
    constructor() {
        super(canvas.width / 2 - 40, canvas.height - 60, 80, 30); // 将宽度从 50 改为 80
        this.color = 'blue';
        this.speed = 5;
        this.lives = 5;
        this.direction = 0;
    }

    update() {
        this.x += this.direction * this.speed;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
}

class Bullet extends GameObject {
    constructor(x, y) {
        super(x, y, 5, 10);
        this.color = 'yellow';
        this.speed = 10;
    }

    update() {
        this.y -= this.speed;
    }
}

class Monster extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.color = 'red';
        this.speed = canvas.height / 4;
        this.hp = 1;
    }

    update(dt) {
        // 基础速度为 canvas.height / 4
        // 随着得分的增加，怪兽速度增加，但最大速度为 canvas.height / 0.1
        const maxSpeed = canvas.height / 0.1;
        const speedMultiplier = Math.min(1 + score / 50000, maxSpeed / this.speed);
        this.y += this.speed * dt * speedMultiplier;
    }
}

class Gift extends GameObject {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.color = 'green';
        this.speed = canvas.height / 4;
    }

    update(dt) {
        // 基础速度为 canvas.height / 4
        // 随着得分的增加，怪兽速度增加，但最大速度为 canvas.height / 0.1
        const maxSpeed = canvas.height / 0.1;
        const speedMultiplier = Math.min(1 + score / 50000, maxSpeed / this.speed);
        this.y += this.speed * dt * speedMultiplier;
    }
}

let plane;
let bullets;
let monsters;
let gifts;
let lastBulletTime;
let lastMonsterTime;
let lastGiftTime;
let score;
let gameOverStatus;

function update(dt) {
    if (gameOverStatus) {
        return;
    }

    plane.update();

    for (const bullet of bullets) {
        bullet.update();
    }

    for (const monster of monsters) {
        monster.update(dt);
    }

    for (const gift of gifts) {
        gift.update(dt);
    }

    handleCollisions();

    score += 10 * dt;

    removeOffscreenObjects();

    spawnObjects(dt);
}

function draw() {
    if (gameOverStatus) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    plane.draw();
  
    for (const bullet of bullets) {
      bullet.draw();
    }
  
    for (const monster of monsters) {
      monster.draw();
    }
  
    for (const gift of gifts) {
      gift.draw();
    }
  
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`生命值: ${plane.lives.toFixed(2)}`, 10, 20);
    ctx.fillText(`分数: ${Math.floor(score)}`, canvas.width - 110, 20);
  }
  

function onKeyDown(e) {
    if (e.key === 'ArrowLeft') {
        plane.direction = -1;
    } else if (e.key === 'ArrowRight') {
        plane.direction = 1;
    }
}

function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        plane.direction = 0;
    }
}

function handleCollisions() {
    for (const bullet of bullets) {
        for (const monster of monsters) {
            if (isColliding(bullet, monster)) {
                monster.hp -= 1;
                bullet.y = -100;
                if (monster.hp <= 0) {
                    score += 500;
                    monster.y = -100;
                }
            }
        }
    }

    for (const gift of gifts) {
        if (isColliding(plane, gift)) {
            // 增加生命值，但不超过 5
            const lifeGain = 0.5;
            if (plane.lives + lifeGain <= 5) {
                plane.lives += lifeGain;
            } else {
                plane.lives = 5;
            }
            gift.y = -100;
        }
    }
    

    for (const monster of monsters) {
        if (isColliding(plane, monster)) {
            plane.lives -= 1;
            monster.y = -100;
            if (plane.lives <= 0) {
                gameOver(Math.floor(score));
            }
        }
    }
}


function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function removeOffscreenObjects() {
    bullets = bullets.filter(obj => obj.y + obj.height > 0);
    monsters = monsters.filter(obj => obj.y - obj.height < canvas.height);
    gifts = gifts.filter(obj => obj.y - obj.height < canvas.height);
}

function spawnObjects(dt) {
    lastBulletTime += dt;
    lastMonsterTime += dt;
    lastGiftTime += dt;

    if (lastBulletTime > 0.2) {
        bullets.push(new Bullet(plane.x + plane.width / 2 - 2.5, plane.y));
        lastBulletTime = 0;
    }

    if (lastMonsterTime > (Math.random() * 2 + 0.1)) {
        spawnMonster();
        lastMonsterTime = 0;
    }

    if (lastGiftTime > (Math.random() * 7 + 8)) {
        spawnGift();
        lastGiftTime = 0;
    }
}

let animationFrameId;

function gameLoop(timestamp) {
    const dt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    update(dt);
    draw();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    resetGame();
    // gameInterval = setInterval(update, 1000 / 60); // 删除这行代码
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    requestAnimationFrame(gameLoop); // 添加这行代码
}


function gameOver(score) {
    gameOverStatus = true;
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    document.getElementById('gameOverScreen').style.display = 'flex';
    finalScore.textContent = score;
}


function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none'; // 添加这行代码
    resetGame();
    startGame();
}

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', restartGame);