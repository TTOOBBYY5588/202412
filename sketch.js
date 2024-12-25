let sprites = {};  // 儲存所有動畫圖片
let backgroundImg;  // 背景圖片
let gameState = 'playing';  // 'playing', 'gameover'
let player1Wins = 0;
let player2Wins = 0;

// 角色1的狀態
let char1 = {
  x: 0,
  y: 0,
  animation: 'down',
  frameIndex: 0,
  lastFrameTime: 0,
  health: 100,
  lastDirection: 'down',
  isAttacking: false  // 新增攻擊狀態
};

// 角色2的狀態
let char2 = {
  x: 0,
  y: 0,
  animation: 'down',
  frameIndex: 0,
  lastFrameTime: 0,
  health: 100,
  lastDirection: 'down',
  isAttacking: false  // 新增攻擊狀態
};

// 在文件開頭添加角色動作配置
const CHAR1_ANIMATIONS = {
  left: {
    width: 32,
    height: 45,
    frames: 3
  },
  right: {
    width: 31,
    height: 45,
    frames: 2
  },
  up: {
    width: 29.8,
    height: 45,
    frames: 2
  },
  down: {
    width: 29,
    height: 47,
    frames: 3
  },
  attack: {
    width: 36.8 ,
    height: 48,
    frames: 4
  }
};

const CHAR2_ANIMATIONS = {
  left: {
    width: 30,
    height: 52,
    frames: 2
  },
  right: {
    width: 29,
    height: 52,
    frames: 2
  },
  up: {
    width: 33,
    height: 52,
    frames: 2
  },
  down: {
    width: 33,
    height: 58,
    frames: 2
  },
  attack: {
    width: 57.3,
    height: 55,
    frames: 3
  }
};

// 移除舊的常量設置
// const SPRITE1_WIDTH = 20.8;    // 移除
// const SPRITE1_HEIGHT = 18;     // 移除
// const SPRITE2_WIDTH = 18;      // 移除
// const SPRITE2_HEIGHT = 18;     // 移除
const CHAR1_SCALE = 2.5;
const CHAR2_SCALE = 2;
const FRAME_DELAY = 100;
const MOVE_SPEED = 5;

// 在文件開頭添加子彈相關的變數
let bullets1 = [];  // 角色1的子彈
let bullets2 = [];  // 角色2的子彈
const BULLET_SPEED = 10;
const BULLET_SIZE = 10;
const BULLET_DAMAGE = 10;

// 新增UI相關常量
const UI_COLORS = {
  primary: '#4a90e2',    // 主要顏色
  secondary: '#f39c12',  // 次要顏色
  danger: '#e74c3c',     // 危險/血量顏色
  success: '#2ecc71',    // 成功顏色
  background: 'rgba(0, 0, 0, 0.7)'  // 半透明黑色背景
};

// 在文件開頭添加特效相關的變數
let bulletEffects = [];  // 儲存子彈特效
let hitEffects = [];    // 儲存命中特效

// 在文件開頭添加粒子數組
let particles = [];

function preload() {
  // 載入角色1的動畫圖片
  sprites.char1 = {
    left: loadImage('image/chac1/left.png'),
    right: loadImage('image/chac1/right.png'),
    up: loadImage('image/chac1/up.png'),
    down: loadImage('image/chac1/down.png'),
    attack: loadImage('image/chac1/attackleft.png')
  };
  
  // 載入角色2的動畫圖片
  sprites.char2 = {
    left: loadImage('image/chac2/left.png'),
    right: loadImage('image/chac2/right.png'),
    up: loadImage('image/chac2/up.png'),
    down: loadImage('image/chac2/down.png'),
    attack: loadImage('image/chac2/attackleft.png')
  };
  
  backgroundImg = loadImage('image/background/1.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  
  // 設置兩個角色的初始位置
  char1.x = width/3;
  char1.y = height/2;
  char2.x = width*2/3;
  char2.y = height/2;
  
  // 初始化一些粒子
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  image(backgroundImg, width/2, height/2, width, height);
  
  if (gameState === 'playing') {
    handleMovement();
    updateBullets();
    
    drawCharacter(char1, 'char1');
    drawCharacter(char2, 'char2');
    drawBullets();
    drawHealthBars();
  } else if (gameState === 'gameover') {
    drawGameOver();
  }
  
  drawScore();
  drawBottomLogo();
  
  // 更新和顯示所有粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    
    // 如果粒子生命值耗盡，則移除
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
  
  // 當按下滑鼠時添加新粒子（限制最大數量）
  if (mouseIsPressed && particles.length < 100) {
    particles.push(new Particle());
  }
}

function drawCharacter(char, spriteKey) {
  // 獲取當前動作的配置
  const animConfig = spriteKey === 'char1' ? 
    CHAR1_ANIMATIONS[char.animation] : 
    CHAR2_ANIMATIONS[char.animation];
  
  // 更新動畫幀
  if (millis() - char.lastFrameTime > FRAME_DELAY) {
    char.frameIndex = (char.frameIndex + 1) % animConfig.frames;
    char.lastFrameTime = millis();

    // 如果是攻擊動畫且播放完成
    if (char.isAttacking && char.frameIndex === 0) {
      char.isAttacking = false;
      char.animation = char.lastDirection;  // 恢復到上一個方向的動畫
    }
  }
  
  let currentSprite = sprites[spriteKey][char.animation];
  let scale = spriteKey === 'char1' ? CHAR1_SCALE : CHAR2_SCALE;
  let sx = char.frameIndex * animConfig.width;
  
  image(
    currentSprite,
    char.x,
    char.y,
    animConfig.width * scale,
    animConfig.height * scale,
    sx,
    0,
    animConfig.width,
    animConfig.height
  );
}

function handleMovement() {
  // 如果角色正在攻擊，不處理移動
  if (!char1.isAttacking) {
    // 角色1的移動控制 (WASD)
    if (keyIsDown(65)) { // A
      char1.x -= MOVE_SPEED;
      char1.animation = 'left';
      char1.lastDirection = 'left';
    }
    else if (keyIsDown(68)) { // D
      char1.x += MOVE_SPEED;
      char1.animation = 'right';
      char1.lastDirection = 'right';
    }
    else if (keyIsDown(87)) { // W
      char1.y -= MOVE_SPEED;
      char1.animation = 'up';
      char1.lastDirection = 'up';
    }
    else if (keyIsDown(83)) { // S
      char1.y += MOVE_SPEED;
      char1.animation = 'down';
      char1.lastDirection = 'down';
    }
  }

  if (!char2.isAttacking) {
    // 角色2的移動控制 (方向鍵)
    if (keyIsDown(LEFT_ARROW)) {
      char2.x -= MOVE_SPEED;
      char2.animation = 'left';
      char2.lastDirection = 'left';
    }
    else if (keyIsDown(RIGHT_ARROW)) {
      char2.x += MOVE_SPEED;
      char2.animation = 'right';
      char2.lastDirection = 'right';
    }
    else if (keyIsDown(UP_ARROW)) {
      char2.y -= MOVE_SPEED;
      char2.animation = 'up';
      char2.lastDirection = 'up';
    }
    else if (keyIsDown(DOWN_ARROW)) {
      char2.y += MOVE_SPEED;
      char2.animation = 'down';
      char2.lastDirection = 'down';
    }
  }

  // 更新邊界檢查
  const char1Config = CHAR1_ANIMATIONS[char1.animation];
  const char2Config = CHAR2_ANIMATIONS[char2.animation];
  
  // 修改 X 軸範圍
  char1.x = constrain(
    char1.x, 
    char1Config.width * CHAR1_SCALE/2, 
    width - char1Config.width * CHAR1_SCALE/2
  );
  
  // 修改 Y 軸範圍，限制在下半部
  char1.y = constrain(
    char1.y, 
    height/2,  // 下限改為畫面高度的一半
    height - char1Config.height * CHAR1_SCALE/2
  );
  
  // 角色2的邊界檢查也做相同修改
  char2.x = constrain(
    char2.x, 
    char2Config.width * CHAR2_SCALE/2, 
    width - char2Config.width * CHAR2_SCALE/2
  );
  
  char2.y = constrain(
    char2.y, 
    height/2,  // 下限改為畫面高度的一半
    height - char2Config.height * CHAR2_SCALE/2
  );
}

function keyPressed() {
  // 角色1的攻擊 (F鍵)
  if ((key === 'f' || key === 'F') && !char1.isAttacking) {
    char1.animation = 'attack';
    char1.frameIndex = 0;
    char1.isAttacking = true;
    
    // 發射子彈
    let bulletDirection = char1.lastDirection;
    let bulletVelX = 0;
    let bulletVelY = 0;
    
    switch(bulletDirection) {
      case 'left':
        bulletVelX = -BULLET_SPEED;
        break;
      case 'right':
        bulletVelX = BULLET_SPEED;
        break;
      case 'up':
        bulletVelY = -BULLET_SPEED;
        break;
      case 'down':
        bulletVelY = BULLET_SPEED;
        break;
    }
    
    bullets1.push({
      x: char1.x,
      y: char1.y,
      velX: bulletVelX,
      velY: bulletVelY
    });
  }
  
  // 角色2的攻擊 (0鍵)
  if (key === '0' && !char2.isAttacking) {
    char2.animation = 'attack';
    char2.frameIndex = 0;
    char2.isAttacking = true;
    
    // 發射子彈
    let bulletDirection = char2.lastDirection;
    let bulletVelX = 0;
    let bulletVelY = 0;
    
    switch(bulletDirection) {
      case 'left':
        bulletVelX = -BULLET_SPEED;
        break;
      case 'right':
        bulletVelX = BULLET_SPEED;
        break;
      case 'up':
        bulletVelY = -BULLET_SPEED;
        break;
      case 'down':
        bulletVelY = BULLET_SPEED;
        break;
    }
    
    bullets2.push({
      x: char2.x,
      y: char2.y,
      velX: bulletVelX,
      velY: bulletVelY
    });
  }
}

// 修改drawHealthBars函數
function drawHealthBars() {
  const barWidth = 250;  // 縮短血條寬度
  const barHeight = 20;  // 降低血條高度
  const margin = 40;
  
  // 繪製血量條背景
  noStroke();
  fill(UI_COLORS.background);
  rect(margin - 10, margin - 10, barWidth + 20, barHeight + 40, 10);
  rect(width - margin - barWidth - 10, margin - 10, barWidth + 20, barHeight + 40, 10);
  
  // 繪製角色1的血量條
  stroke(0);
  strokeWeight(1);  // 降低邊框粗細
  fill(UI_COLORS.background);
  rect(margin, margin, barWidth, barHeight, 5);
  fill(UI_COLORS.danger);
  rect(margin, margin, barWidth * (char1.health/100), barHeight, 5);
  
  // 繪製角色2的血量條
  fill(UI_COLORS.background);
  rect(width - margin - barWidth, margin, barWidth, barHeight, 5);
  fill(UI_COLORS.danger);
  rect(width - margin - barWidth, margin, barWidth * (char2.health/100), barHeight, 5);
  
  // 顯示具體數值和玩家名稱
  noStroke();
  fill(255);
  textSize(14);  // 縮小字體
  textAlign(LEFT, CENTER);
  text(`Player 1 (WASD移動, F攻擊) - HP: ${char1.health}%`, margin, margin + barHeight + 15);
  textAlign(RIGHT, CENTER);
  text(`Player 2 (方向鍵移動, 0攻擊) - HP: ${char2.health}%`, width - margin, margin + barHeight + 15);
}

// 修改 drawBottomLogo 函數，改為頂部 LOGO
function drawBottomLogo() {
  textSize(72);  // 增加字體大小
  textAlign(CENTER, CENTER);  // 改為置中對齊
  strokeWeight(6);  // 增加描邊粗細
  stroke(0);
  fill(UI_COLORS.primary);
  text('淡江教育科技系', width/2, height/4);  // 移到上半部，高度設為 1/4 處
}

// 優化遊戲結束畫面
function drawGameOver() {
  // 半透明背景
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  
  // 獲勝者文字 - 紫色系
  textSize(72);
  textAlign(CENTER, CENTER);
  strokeWeight(6);
  stroke(100, 0, 150);
  fill(200, 100, 255);
  let winner = char1.health <= 0 ? "Player 2" : "Player 1";
  text(`${winner} Wins!`, width/2, height/3);
  
  // 重新開始按鈕 - 改為更大的圓形符號
  let buttonSize = 400;  // 原本80的5倍
  let buttonX = width/2;
  let buttonY = height * 2/3;
  
  // 按鈕懸停效果
  if (dist(mouseX, mouseY, buttonX, buttonY) < buttonSize/2) {
    fill(UI_COLORS.success);
  } else {
    fill(UI_COLORS.secondary);
  }
  
  // 繪製圓形按鈕背景
  stroke(0);
  strokeWeight(8);  // 增加邊框粗細
  circle(buttonX, buttonY, buttonSize);
  
  // 繪製重新開始符號（箭頭）
  stroke(255);
  strokeWeight(12);  // 增加箭頭粗細
  noFill();
  
  // 畫圓形箭頭
  arc(buttonX, buttonY, buttonSize * 0.6, buttonSize * 0.6, -PI/6, PI * 1.6);
  
  // 畫箭頭尖端
  let arrowX = buttonX + buttonSize * 0.15;
  let arrowY = buttonY - buttonSize * 0.2;
  let arrowSize = buttonSize * 0.15;
  
  line(arrowX, arrowY, arrowX + arrowSize, arrowY);
  line(arrowX + arrowSize, arrowY, arrowX + arrowSize * 0.7, arrowY - arrowSize * 0.7);
}

// 修改 drawScore 函數，改變計分板樣式
function drawScore() {
  // 分數背景
  fill(UI_COLORS.background);
  noStroke();
  rect(width/2 - 70, 10, 140, 40, 10);  // 縮小寬度和高度
  
  // 分數文字
  textSize(28);  // 縮小字體
  textAlign(CENTER, CENTER);
  stroke(100, 0, 150);  // 深紫色描邊
  strokeWeight(3);
  fill(200, 100, 255);  // 亮紫色填充
  text(`${player1Wins} - ${player2Wins}`, width/2, 30);
}

// 修改 drawBullets 函數，移除軌跡特效並改善視覺效果
function drawBullets() {
  // 繪製子彈
  for (let bullet of bullets1) {
    drawBulletWithGlow(bullet, true);
  }
  
  for (let bullet of bullets2) {
    drawBulletWithGlow(bullet, false);
  }
  
  // 更新和繪製命中特效
  for (let i = hitEffects.length - 1; i >= 0; i--) {
    let effect = hitEffects[i];
    effect.life--;
    effect.size += 3;  // 增加擴散速度
    effect.alpha -= 15;  // 加快消失速度
    
    if (effect.life <= 0) {
      hitEffects.splice(i, 1);
      continue;
    }
    
    // 繪製命中特效 - 改為更華麗的效果
    noStroke();
    if (effect.isPlayer1) {
      // 玩家1的命中特效 - 紅色系
      fill(255, 50, 50, effect.alpha * 0.7);
      circle(effect.x, effect.y, effect.size);
      fill(255, 150, 150, effect.alpha * 0.5);
      circle(effect.x, effect.y, effect.size * 0.7);
    } else {
      // 玩家2的命中特效 - 藍色系
      fill(50, 50, 255, effect.alpha * 0.7);
      circle(effect.x, effect.y, effect.size);
      fill(150, 150, 255, effect.alpha * 0.5);
      circle(effect.x, effect.y, effect.size * 0.7);
    }
  }
}

// 修改 drawBulletWithGlow 函數，改善子彈視覺效果
function drawBulletWithGlow(bullet, isPlayer1) {
  const glowSize = BULLET_SIZE * 2;
  
  // 外發光效果
  noStroke();
  if (isPlayer1) {
    // 玩家1的子彈 - 紅色系
    fill(255, 50, 50, 50);
    circle(bullet.x, bullet.y, glowSize);
    fill(255, 100, 100, 100);
    circle(bullet.x, bullet.y, BULLET_SIZE * 1.5);
    fill(255, 200, 200);
  } else {
    // 玩家2的子彈 - 藍色系
    fill(50, 50, 255, 50);
    circle(bullet.x, bullet.y, glowSize);
    fill(100, 100, 255, 100);
    circle(bullet.x, bullet.y, BULLET_SIZE * 1.5);
    fill(200, 200, 255);
  }
  
  // 子彈本體
  circle(bullet.x, bullet.y, BULLET_SIZE);
}

// 新增滑鼠點擊處理
function mousePressed() {
  if (gameState === 'gameover') {
    let buttonX = width/2;
    let buttonY = height * 2/3;
    let buttonSize = 400;  // 更新按鈕大小
    
    // 檢查是否點擊圓形重新開始按鈕
    if (dist(mouseX, mouseY, buttonX, buttonY) < buttonSize/2) {
      resetGame();
    }
  }
}

// 新增重置遊戲函數
function resetGame() {
  // 重置角色狀態
  char1.health = 100;
  char2.health = 100;
  char1.x = width/3;
  char1.y = height/2;
  char2.x = width*2/3;
  char2.y = height/2;
  char1.animation = 'down';
  char2.animation = 'down';
  char1.lastDirection = 'down';
  char2.lastDirection = 'down';
  char1.isAttacking = false;
  char2.isAttacking = false;
  
  // 重置遊戲狀態
  gameState = 'playing';
  
  // 清空所有子彈
  bullets1 = [];
  bullets2 = [];
  
  // 清空所有特效
  bulletEffects = [];
  hitEffects = [];
}

// 修改 updateBullets 函數中的命中檢測部分
function updateBullets() {
  // 更新角色1的子彈
  for (let i = bullets1.length - 1; i >= 0; i--) {
    let bullet = bullets1[i];
    bullet.x += bullet.velX;
    bullet.y += bullet.velY;
    
    // 檢查是否擊中角色2
    if (dist(bullet.x, bullet.y, char2.x, char2.y) < BULLET_SIZE + 25) {
      // 產生命中特效
      for (let j = 0; j < 8; j++) {  // 產生8個粒子
        let angle = (j / 8) * TWO_PI;
        hitEffects.push({
          x: bullet.x,
          y: bullet.y,
          size: BULLET_SIZE * 2,
          alpha: 255,
          life: 20,
          isPlayer1: true
        });
      }
      
      char2.health = max(0, char2.health - BULLET_DAMAGE);
      bullets1.splice(i, 1);
      
      if (char2.health <= 0) {
        gameState = 'gameover';
        player1Wins++;
      }
      continue;
    }
    
    // 移除超出畫面的子彈
    if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
      bullets1.splice(i, 1);
    }
  }
  
  // 更新角色2的子彈 (類似的修改)
  for (let i = bullets2.length - 1; i >= 0; i--) {
    let bullet = bullets2[i];
    bullet.x += bullet.velX;
    bullet.y += bullet.velY;
    
    // 檢查是否擊中角色1
    if (dist(bullet.x, bullet.y, char1.x, char1.y) < BULLET_SIZE + 25) {
      // 產生命中特效
      for (let j = 0; j < 8; j++) {
        let angle = (j / 8) * TWO_PI;
        hitEffects.push({
          x: bullet.x,
          y: bullet.y,
          size: BULLET_SIZE * 2,
          alpha: 255,
          life: 20,
          isPlayer1: false
        });
      }
      
      char1.health = max(0, char1.health - BULLET_DAMAGE);
      bullets2.splice(i, 1);
      
      if (char1.health <= 0) {
        gameState = 'gameover';
        player2Wins++;
      }
      continue;
    }
    
    // 移除超出畫面的子彈
    if (bullet.x < 0 || bullet.x > width || bullet.y < 0 || bullet.y > height) {
      bullets2.splice(i, 1);
    }
  }
}

// 粒子類
class Particle {
  constructor() {
    this.x = mouseX || random(width);
    this.y = mouseY || random(height);
    this.size = random(5, 20);
    this.speedX = random(-2, 2);
    this.speedY = random(-2, 2);
    this.color = color(random(255), random(255), random(255), 255);
    this.life = 255;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 邊界檢查
    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 0 || this.y > height) this.speedY *= -1;
    
    // 生命值逐漸減少
    this.life -= 3;
    this.color.setAlpha(this.life);
  }
  
  display() {
    noStroke();
    fill(this.color);
    circle(this.x, this.y, this.size);
  }
  
  isDead() {
    return this.life <= 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
