// 게임 캔버스 설정
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
canvas.width = 800;
canvas.height = 300;

// 게임 상태
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let highScore = localStorage.getItem('hurdlerHighScore') || 0;
let gameSpeed = 6;
let frameCount = 0;

// DOM 요소
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');

// 초기 하이스코어 표시
highScoreElement.textContent = `HI ${highScore}`;

// 러너 객체
const runner = {
    x: 80,
    y: 200,
    width: 50,
    height: 70,
    velocityY: 0,
    gravity: 0.8,
    jumpForce: -15,
    isJumping: false,
    groundY: 200,
    frameIndex: 0,
    frameTimer: 0,
    frameInterval: 6
};

// 허들 배열
let hurdles = [];

// 트랙 라인
let trackOffset = 0;

// 구름 배열
let clouds = [
    { x: 100, y: 50, width: 60 },
    { x: 300, y: 30, width: 80 },
    { x: 550, y: 60, width: 50 },
    { x: 750, y: 40, width: 70 }
];

// 러너 그리기
function drawRunner() {
    ctx.save();

    // 러너 몸체 (간단한 스틱맨 스타일)
    const x = runner.x;
    const y = runner.y;

    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 머리
    ctx.fillStyle = '#F5CBA7';
    ctx.beginPath();
    ctx.arc(x + 25, y - 45, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 머리카락
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.arc(x + 25, y - 50, 12, Math.PI, Math.PI * 2);
    ctx.fill();

    // 몸통 (운동복)
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.moveTo(x + 25, y - 30);
    ctx.lineTo(x + 15, y - 5);
    ctx.lineTo(x + 35, y - 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 번호
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('1', x + 22, y - 15);

    // 다리 애니메이션
    const legAngle = runner.isJumping ? 0.3 : Math.sin(runner.frameIndex * 0.8) * 0.5;

    // 바지 (검은색)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 8;

    // 왼쪽 다리
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 5);
    if (runner.isJumping) {
        ctx.lineTo(x + 10, y + 25);
    } else {
        ctx.lineTo(x + 20 + Math.sin(legAngle) * 20, y + 30);
    }
    ctx.stroke();

    // 오른쪽 다리
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 5);
    if (runner.isJumping) {
        ctx.lineTo(x + 40, y + 20);
    } else {
        ctx.lineTo(x + 30 - Math.sin(legAngle) * 20, y + 30);
    }
    ctx.stroke();

    // 신발
    ctx.fillStyle = '#3498DB';
    if (runner.isJumping) {
        ctx.fillRect(x + 5, y + 22, 12, 6);
        ctx.fillRect(x + 35, y + 17, 12, 6);
    } else {
        ctx.fillRect(x + 15 + Math.sin(legAngle) * 20, y + 27, 12, 6);
        ctx.fillRect(x + 25 - Math.sin(legAngle) * 20, y + 27, 12, 6);
    }

    // 팔 애니메이션
    ctx.strokeStyle = '#F5CBA7';
    ctx.lineWidth = 5;

    const armAngle = runner.isJumping ? 0.5 : Math.sin(runner.frameIndex * 0.8 + Math.PI) * 0.4;

    // 왼쪽 팔
    ctx.beginPath();
    ctx.moveTo(x + 20, y - 25);
    ctx.lineTo(x + 10 + Math.sin(armAngle) * 15, y - 10);
    ctx.stroke();

    // 오른쪽 팔
    ctx.beginPath();
    ctx.moveTo(x + 30, y - 25);
    ctx.lineTo(x + 40 - Math.sin(armAngle) * 15, y - 10);
    ctx.stroke();

    ctx.restore();
}

// 허들 그리기
function drawHurdle(hurdle) {
    ctx.save();

    const x = hurdle.x;
    const y = hurdle.y;
    const width = hurdle.width;
    const height = hurdle.height;

    // 허들 다리 (왼쪽)
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 2;

    // 왼쪽 지지대
    ctx.fillRect(x, y + height - 50, 8, 50);
    ctx.strokeRect(x, y + height - 50, 8, 50);

    // 오른쪽 지지대
    ctx.fillRect(x + width - 8, y + height - 50, 8, 50);
    ctx.strokeRect(x + width - 8, y + height - 50, 8, 50);

    // 상단 바
    ctx.fillStyle = '#E74C3C';
    ctx.fillRect(x - 5, y, width + 10, 12);

    // 상단 바 줄무늬
    ctx.fillStyle = '#FFF';
    for (let i = 0; i < width + 10; i += 15) {
        ctx.fillRect(x - 5 + i, y, 7, 12);
    }

    // 상단 바 테두리
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 5, y, width + 10, 12);

    ctx.restore();
}

// 트랙 그리기
function drawTrack() {
    // 하늘
    const skyGradient = ctx.createLinearGradient(0, 0, 0, 180);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, 180);

    // 구름 그리기
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.width);
    });

    // 관중석 배경
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(0, 140, canvas.width, 50);

    // 관중 (간단한 점들)
    for (let i = 0; i < canvas.width; i += 15) {
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];
        ctx.fillStyle = colors[i % 5];
        ctx.beginPath();
        ctx.arc(i + 7, 155 + Math.sin(i) * 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    // 트랙 베이스
    const trackGradient = ctx.createLinearGradient(0, 180, 0, canvas.height);
    trackGradient.addColorStop(0, '#D2691E');
    trackGradient.addColorStop(0.3, '#CD853F');
    trackGradient.addColorStop(1, '#8B4513');
    ctx.fillStyle = trackGradient;
    ctx.fillRect(0, 180, canvas.width, 120);

    // 트랙 라인
    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = trackOffset;

    // 레인 구분선
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 200 + i * 30);
        ctx.lineTo(canvas.width, 200 + i * 30);
        ctx.stroke();
    }

    ctx.setLineDash([]);

    // 바닥선 (러너가 뛰는 라인)
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 268, canvas.width, 4);
}

// 구름 그리기
function drawCloud(x, y, width) {
    ctx.beginPath();
    ctx.arc(x, y, width * 0.3, 0, Math.PI * 2);
    ctx.arc(x + width * 0.3, y - width * 0.1, width * 0.35, 0, Math.PI * 2);
    ctx.arc(x + width * 0.6, y, width * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

// 허들 생성
let nextHurdleGap = 400; // 다음 허들까지의 간격

function createHurdle() {
    const minGap = 200;
    const maxGap = 600;

    if (hurdles.length === 0) {
        hurdles.push({
            x: canvas.width,
            y: 218,
            width: 40,
            height: 50,
            passed: false
        });
        nextHurdleGap = minGap + Math.random() * (maxGap - minGap);
    } else if (hurdles[hurdles.length - 1].x < canvas.width - nextHurdleGap) {
        hurdles.push({
            x: canvas.width,
            y: 218,
            width: 40,
            height: 50,
            passed: false
        });
        // 다음 허들 간격을 랜덤하게 설정
        nextHurdleGap = minGap + Math.random() * (maxGap - minGap);
    }
}

// 충돌 감지
function checkCollision(hurdle) {
    // 러너 충돌 박스 (약간 작게 설정하여 공정한 판정)
    const runnerBox = {
        x: runner.x + 10,
        y: runner.y - 40,
        width: 30,
        height: 70
    };

    // 허들 충돌 박스 (상단 바 부분만)
    const hurdleBox = {
        x: hurdle.x,
        y: hurdle.y,
        width: hurdle.width,
        height: 15
    };

    return runnerBox.x < hurdleBox.x + hurdleBox.width &&
           runnerBox.x + runnerBox.width > hurdleBox.x &&
           runnerBox.y < hurdleBox.y + hurdleBox.height &&
           runnerBox.y + runnerBox.height > hurdleBox.y;
}

// 점프
function jump() {
    if (!runner.isJumping) {
        runner.velocityY = runner.jumpForce;
        runner.isJumping = true;
    }
}

// 러너 업데이트
function updateRunner() {
    // 중력 적용
    runner.velocityY += runner.gravity;
    runner.y += runner.velocityY;

    // 바닥 체크
    if (runner.y >= runner.groundY) {
        runner.y = runner.groundY;
        runner.velocityY = 0;
        runner.isJumping = false;
    }

    // 달리기 애니메이션
    if (!runner.isJumping) {
        runner.frameTimer++;
        if (runner.frameTimer >= runner.frameInterval) {
            runner.frameTimer = 0;
            runner.frameIndex++;
        }
    }
}

// 허들 업데이트
function updateHurdles() {
    for (let i = hurdles.length - 1; i >= 0; i--) {
        hurdles[i].x -= gameSpeed;

        // 허들 통과 체크 (점수)
        if (!hurdles[i].passed && hurdles[i].x + hurdles[i].width < runner.x) {
            hurdles[i].passed = true;
            score += 10;
            scoreElement.textContent = score;
        }

        // 충돌 체크
        if (checkCollision(hurdles[i])) {
            gameOver();
            return;
        }

        // 화면 밖으로 나간 허들 제거
        if (hurdles[i].x + hurdles[i].width < 0) {
            hurdles.splice(i, 1);
        }
    }
}

// 구름 업데이트
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= gameSpeed * 0.3;
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width + cloud.width;
            cloud.y = 30 + Math.random() * 40;
        }
    });
}

// 난이도 증가
function increaseDifficulty() {
    if (frameCount % 500 === 0 && gameSpeed < 15) {
        gameSpeed += 0.5;
    }
}

// 게임 오버
function gameOver() {
    gameState = 'gameover';

    // 하이스코어 업데이트
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('hurdlerHighScore', highScore);
        highScoreElement.textContent = `HI ${highScore}`;
    }

    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// 게임 리셋
function resetGame() {
    score = 0;
    gameSpeed = 6;
    frameCount = 0;
    hurdles = [];

    runner.y = runner.groundY;
    runner.velocityY = 0;
    runner.isJumping = false;
    runner.frameIndex = 0;

    scoreElement.textContent = '0';
    gameOverScreen.classList.add('hidden');
    startScreen.classList.add('hidden');

    gameState = 'playing';
}

// 메인 게임 루프
function gameLoop() {
    // 화면 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 트랙 그리기
    drawTrack();

    if (gameState === 'playing') {
        // 업데이트
        updateRunner();
        updateHurdles();
        updateClouds();
        createHurdle();
        increaseDifficulty();

        // 트랙 오프셋 업데이트
        trackOffset += gameSpeed;
        if (trackOffset >= 50) trackOffset = 0;

        frameCount++;
    }

    // 그리기
    drawRunner();
    hurdles.forEach(hurdle => drawHurdle(hurdle));

    requestAnimationFrame(gameLoop);
}

// 이벤트 리스너
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();

        if (gameState === 'start') {
            resetGame();
        } else if (gameState === 'playing') {
            jump();
        } else if (gameState === 'gameover') {
            resetGame();
        }
    }
});

// 터치/클릭 이벤트
canvas.addEventListener('click', handleInteraction);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInteraction();
});

startScreen.addEventListener('click', handleInteraction);
gameOverScreen.addEventListener('click', handleInteraction);

function handleInteraction() {
    if (gameState === 'start') {
        resetGame();
    } else if (gameState === 'playing') {
        jump();
    } else if (gameState === 'gameover') {
        resetGame();
    }
}

// 게임 시작
gameLoop();
