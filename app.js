const app = document.getElementById("app");

const STORAGE_KEY = "valentine_game_save_v11_story_map";
const DINNER_TOP_SCORE_KEY = "valentine_game_nyc_dinner_top_score_v1";

let mapControlTeardown = null;
let clickHeartsBound = false;
let nycPromptTimer = null;
let nycFollowTeardown = null;
let nycObstacleTeardown = null;
let nycCollisionTeardown = null;
let nycDinnerRunnerTeardown = null;
let nycReturnFromWin = false;

function loadDinnerTopScore() {
    const raw = localStorage.getItem(DINNER_TOP_SCORE_KEY);
    const parsed = Number.parseInt(raw ?? "0", 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
}

function saveDinnerTopScore(score) {
    const safe = Math.max(0, Math.floor(Number(score) || 0));
    localStorage.setItem(DINNER_TOP_SCORE_KEY, String(safe));
}

function defaultState() {
    return {
        screen: "home", // home | customize | map | shelf | note | computer | planeClip | nycRoom | nycDinner
        characterMode: null, // null | alone | withme
        mapIntroDone: false,
        mapPostComputerIntroPending: false,
        mapCharPos: null,
        bookshelfPassed: false
    };
}

let state = loadSave();

function loadSave() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    try { return { ...defaultState(), ...JSON.parse(raw) }; }
    catch { return defaultState(); }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function go(screen) {
    if (screen !== "map" && mapControlTeardown != null) {
        mapControlTeardown();
        mapControlTeardown = null;
    }
    if (nycPromptTimer != null) {
        clearTimeout(nycPromptTimer);
        nycPromptTimer = null;
    }
    if (nycFollowTeardown != null) {
        nycFollowTeardown();
        nycFollowTeardown = null;
    }
    if (nycObstacleTeardown != null) {
        nycObstacleTeardown();
        nycObstacleTeardown = null;
    }
    if (nycCollisionTeardown != null) {
        nycCollisionTeardown();
        nycCollisionTeardown = null;
    }
    if (nycDinnerRunnerTeardown != null) {
        nycDinnerRunnerTeardown();
        nycDinnerRunnerTeardown = null;
    }
    state.screen = screen;
    save();
    render();
}

function startNycCoupleFollow(stage, couple) {
    if (stage == null || couple == null) return null;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let running = true;
    let frameId = 0;

    let targetX = stage.clientWidth * 0.5;
    let targetY = stage.clientHeight * 0.82;
    let currentX = targetX;
    let currentY = targetY;

    const applyPos = () => {
        couple.style.left = `${currentX}px`;
        couple.style.top = `${currentY}px`;
    };
    applyPos();

    const moveToPointer = (clientX, clientY) => {
        const rect = stage.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;
        targetX = clamp(localX, rect.width * 0.36, rect.width * 0.64);
        targetY = clamp(localY, rect.height * 0.6, rect.height * 0.92);
    };

    const onPointerMove = (e) => moveToPointer(e.clientX, e.clientY);
    const onTouchMove = (e) => {
        if (e.touches.length > 0) moveToPointer(e.touches[0].clientX, e.touches[0].clientY);
    };

    const frame = () => {
        if (!running) return;
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        applyPos();
        frameId = requestAnimationFrame(frame);
    };

    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("touchmove", onTouchMove, { passive: true });
    frameId = requestAnimationFrame(frame);

    return () => {
        running = false;
        cancelAnimationFrame(frameId);
        stage.removeEventListener("pointermove", onPointerMove);
        stage.removeEventListener("touchmove", onTouchMove);
    };
}

function startNycObstacleSpawner(layer, onSpawned = null) {
    if (layer == null) return null;

    let running = true;
    let spawnTimer = null;
    const obstacleTimers = new Set();
    const randomSignedUnit = (minAbs, maxAbs) => {
        const magnitude = minAbs + (Math.random() * (maxAbs - minAbs));
        const sign = Math.random() < 0.5 ? -1 : 1;
        return magnitude * sign;
    };

    const spawnObstacle = () => {
        if (!running || !layer.isConnected) return;
        if (typeof onSpawned === "function") onSpawned();

        const obstacle = document.createElement("div");
        obstacle.className = "roadObstacle";
        const obstacleTypes = ["paperObstacle", "ratObstacle", "rockObstacle"];
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacle.classList.add(obstacleType);
        const unitPx = layer.clientWidth / 100;
        const startX = randomSignedUnit(0, 14) * unitPx;
        const fallX = randomSignedUnit(10, 50) * unitPx;
        const midBlend = 0.32 + (Math.random() * 0.34);
        const midX = (startX * (1 - midBlend)) + (fallX * midBlend);
        obstacle.style.setProperty("--startX", `${startX.toFixed(1)}px`);
        obstacle.style.setProperty("--fallX", `${fallX.toFixed(1)}px`);
        obstacle.style.setProperty("--fallXMid", `${midX.toFixed(1)}px`);
        const durationMs = 3800 + Math.floor(Math.random() * 2000);
        obstacle.style.animationDuration = `${durationMs / 1000}s`;

        const resolveObstacle = () => {
            if (obstacle.dataset.resolved === "1") return;
            obstacle.dataset.resolved = "1";
            if (obstacle.isConnected) obstacle.remove();
        };

        obstacle.addEventListener("animationend", resolveObstacle, { once: true });
        const timerId = window.setTimeout(() => {
            obstacleTimers.delete(timerId);
            resolveObstacle();
        }, durationMs + 120);
        obstacleTimers.add(timerId);

        layer.appendChild(obstacle);
    };

    spawnObstacle();
    spawnTimer = setInterval(spawnObstacle, 500);

    return () => {
        running = false;
        if (spawnTimer != null) {
            clearInterval(spawnTimer);
            spawnTimer = null;
        }
        for (const timerId of obstacleTimers) {
            clearTimeout(timerId);
        }
        obstacleTimers.clear();
        if (layer.isConnected) layer.innerHTML = "";
    };
}

function startNycCollisionWatch(stage, couple, obstacleLayer, onHit) {
    if (stage == null || couple == null || obstacleLayer == null) return null;

    let running = true;
    let frameId = 0;
    let hitTriggered = false;

    const intersects = (a, b) => (
        a.left < b.right
        && a.right > b.left
        && a.top < b.bottom
        && a.bottom > b.top
    );

    const frame = () => {
        if (!running || hitTriggered || state.screen !== "nycRoom") return;
        if (couple.hidden) {
            frameId = requestAnimationFrame(frame);
            return;
        }

        const coupleRectRaw = couple.getBoundingClientRect();
        const coupleRect = {
            left: coupleRectRaw.left + (coupleRectRaw.width * 0.2),
            right: coupleRectRaw.right - (coupleRectRaw.width * 0.2),
            top: coupleRectRaw.top + (coupleRectRaw.height * 0.2),
            bottom: coupleRectRaw.bottom - (coupleRectRaw.height * 0.1)
        };

        const obstacles = obstacleLayer.querySelectorAll(".roadObstacle");
        for (const obstacle of obstacles) {
            const obstacleRectRaw = obstacle.getBoundingClientRect();
            const obstacleRect = {
                left: obstacleRectRaw.left + (obstacleRectRaw.width * 0.34),
                right: obstacleRectRaw.right - (obstacleRectRaw.width * 0.34),
                top: obstacleRectRaw.top + (obstacleRectRaw.height * 0.34),
                bottom: obstacleRectRaw.bottom - (obstacleRectRaw.height * 0.34)
            };
            if (intersects(coupleRect, obstacleRect)) {
                hitTriggered = true;
                onHit(obstacle);
                return;
            }
        }

        frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => {
        running = false;
        cancelAnimationFrame(frameId);
    };
}

function startNycDinnerRunnerGame(config) {
    const {
        stage,
        player,
        obstacleLayer,
        scoreEl,
        bestScoreEl,
        gameOverOverlay,
        restartBtn
    } = config;
    if (
        stage == null
        || player == null
        || obstacleLayer == null
        || scoreEl == null
        || bestScoreEl == null
        || gameOverOverlay == null
        || restartBtn == null
    ) {
        return null;
    }

    let running = true;
    let gameOver = false;
    let frameId = 0;
    let lastTime = performance.now();
    let spawnTimeout = null;
    const obstacles = new Set();
    let vy = 0;
    let y = 0;
    let elapsed = 0;
    let score = 0;
    let bestScore = loadDinnerTopScore();
    const gravity = 2400;
    const jumpVelocity = -1020;
    const playerBaseBottom = 24;
    const playerHeightPx = 196;
    const baseRunSpeed = 470;
    const runSpeedGain = 24;
    const maxRunSpeed = 960;

    const obstacleTypes = [
        "dinnerObstacleDish",
        "dinnerObstacleDrink",
        "dinnerObstacleBread"
    ];

    const setPlayerY = () => {
        player.style.transform = `translateY(${y.toFixed(1)}px)`;
    };

    const jump = () => {
        if (!running || gameOver) return;
        if (y >= -0.5) {
            vy = jumpVelocity;
        }
    };

    const restartGame = () => {
        teardown();
        const restart = startNycDinnerRunnerGame(config);
        nycDinnerRunnerTeardown = restart;
    };

    const onKeyDown = (e) => {
        if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
            e.preventDefault();
            if (gameOver) {
                restartGame();
                return;
            }
            jump();
        }
    };

    const onPointerDown = () => jump();

    const scheduleNextSpawn = () => {
        if (!running || gameOver) return;
        if (spawnTimeout != null) {
            clearTimeout(spawnTimeout);
        }
        const runSpeed = Math.min(maxRunSpeed, baseRunSpeed + (elapsed * runSpeedGain));
        const nextDelay = Math.max(220, 640 - (runSpeed * 0.42)) + Math.floor(Math.random() * 260);
        spawnTimeout = window.setTimeout(() => {
            spawnTimeout = null;
            spawnObstacle();
        }, nextDelay);
    };

    const spawnObstacle = () => {
        if (!running || gameOver || !obstacleLayer.isConnected) return;
        if (obstacles.size > 0) return;

        const obstacle = document.createElement("div");
        obstacle.className = "nycDinnerRunnerObstacle";
        const variant = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacle.classList.add(variant);
        const startX = stage.clientWidth + 140 + Math.random() * 60;
        const laneBottom = 24 + (Math.random() * 16);
        const size = 66 + (Math.random() * 54);
        obstacle.dataset.x = `${startX}`;
        obstacle.style.left = `${startX}px`;
        obstacle.style.bottom = `${laneBottom}px`;
        obstacle.style.width = `${size.toFixed(1)}px`;
        obstacle.style.height = `${size.toFixed(1)}px`;
        obstacleLayer.appendChild(obstacle);
        obstacles.add(obstacle);
    };

    const hitTest = (a, b) => (
        a.left < b.right
        && a.right > b.left
        && a.top < b.bottom
        && a.bottom > b.top
    );

    const finishGame = () => {
        if (gameOver) return;
        gameOver = true;
        const finalScore = Math.floor(score);
        if (finalScore > bestScore) {
            bestScore = finalScore;
            saveDinnerTopScore(bestScore);
        }
        bestScoreEl.textContent = `Top Score: ${bestScore}`;
        if (spawnTimeout != null) {
            clearTimeout(spawnTimeout);
            spawnTimeout = null;
        }
        gameOverOverlay.hidden = false;
    };

    const frame = (now) => {
        if (!running) return;
        const dt = Math.min(0.035, (now - lastTime) / 1000);
        lastTime = now;
        elapsed += dt;
        const runSpeed = Math.min(maxRunSpeed, baseRunSpeed + (elapsed * runSpeedGain));

        vy += gravity * dt;
        y += vy * dt;
        if (y > 0) {
            y = 0;
            vy = 0;
        }
        setPlayerY();

        const playerRectRaw = player.getBoundingClientRect();
        const playerRect = {
            left: playerRectRaw.left + (playerRectRaw.width * 0.2),
            right: playerRectRaw.right - (playerRectRaw.width * 0.2),
            top: playerRectRaw.top + (playerRectRaw.height * 0.16),
            bottom: playerRectRaw.bottom - (playerRectRaw.height * 0.08)
        };

        for (const obstacle of obstacles) {
            const nextX = Number(obstacle.dataset.x || "0") - (runSpeed * dt);
            obstacle.dataset.x = `${nextX}`;
            obstacle.style.left = `${nextX}px`;
            if (nextX < -220) {
                obstacles.delete(obstacle);
                obstacle.remove();
                scheduleNextSpawn();
                continue;
            }

            if (!gameOver) {
                const obstacleRectRaw = obstacle.getBoundingClientRect();
                const obstacleRect = {
                    left: obstacleRectRaw.left + (obstacleRectRaw.width * 0.12),
                    right: obstacleRectRaw.right - (obstacleRectRaw.width * 0.12),
                    top: obstacleRectRaw.top + (obstacleRectRaw.height * 0.12),
                    bottom: obstacleRectRaw.bottom - (obstacleRectRaw.height * 0.12)
                };
                if (hitTest(playerRect, obstacleRect)) {
                    finishGame();
                }
            }
        }

        if (!gameOver) {
            score += dt * 18;
            scoreEl.textContent = `${Math.floor(score)}`;
        }

        frameId = requestAnimationFrame(frame);
    };

    const teardown = () => {
        running = false;
        cancelAnimationFrame(frameId);
        if (spawnTimeout != null) {
            clearTimeout(spawnTimeout);
            spawnTimeout = null;
        }
        document.removeEventListener("keydown", onKeyDown);
        stage.removeEventListener("pointerdown", onPointerDown);
        for (const obstacle of obstacles) {
            obstacle.remove();
        }
        obstacles.clear();
        player.style.transform = "";
    };

    restartBtn.onclick = restartGame;

    obstacleLayer.innerHTML = "";
    player.hidden = false;
    player.style.bottom = `${playerBaseBottom}px`;
    player.style.height = `${playerHeightPx}px`;
    y = 0;
    vy = 0;
    setPlayerY();
    gameOverOverlay.hidden = true;
    score = 0;
    scoreEl.textContent = "0";
    bestScoreEl.textContent = `Top Score: ${bestScore}`;
    document.addEventListener("keydown", onKeyDown);
    stage.addEventListener("pointerdown", onPointerDown);
    spawnObstacle();
    frameId = requestAnimationFrame(frame);
    return teardown;
}

function mountClickHearts() {
    if (clickHeartsBound) return;
    clickHeartsBound = true;

    document.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;

        const count = 7;
        for (let i = 0; i < count; i += 1) {
            const heart = document.createElement("span");
            heart.className = "clickHeart";
            heart.textContent = "❤";

            const spreadX = (Math.random() - 0.5) * 44;
            const spreadY = (Math.random() - 0.5) * 30;
            const driftX = (Math.random() - 0.5) * 80;
            const scale = 0.7 + (Math.random() * 0.8);
            const duration = 600 + Math.floor(Math.random() * 500);

            heart.style.left = `${e.clientX + spreadX}px`;
            heart.style.top = `${e.clientY + spreadY}px`;
            heart.style.setProperty("--dx", `${driftX}px`);
            heart.style.setProperty("--dur", `${duration}ms`);
            heart.style.transform = `translate(-50%, -50%) scale(${scale})`;

            document.body.appendChild(heart);
            heart.addEventListener("animationend", () => heart.remove(), { once: true });
        }
    });
}

function headerTitle() {
    return `
    <div class="header">
      <div class="headerActions">
        <button class="btn secondary" id="homeBtn">Back to Start</button>
      </div>
    </div>
  `;
}

function mountHomeButton() {
    const homeBtn = document.getElementById("homeBtn");
    if (homeBtn != null) {
        homeBtn.onclick = () => go("home");
    }
}

function showErrorOverlay(backScreen = state.screen) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "#d40000";
    overlay.style.display = "grid";
    overlay.style.placeItems = "center";
    overlay.style.zIndex = "9999";

    overlay.innerHTML = `
    <div style="text-align:center; padding:24px;">
      <div style="color:white; font-weight:900; font-size:64px; letter-spacing:6px;">ERROR</div>
      <div style="color:white; margin-top:10px; font-size:18px; opacity:0.95;">
        Wrong choice. Try again.
      </div>
      <button id="errBtn" style="
        margin-top:18px;
        padding:12px 16px;
        border-radius:14px;
        border:2px solid rgba(255,255,255,0.7);
        background:rgba(255,255,255,0.12);
        color:white;
        font-weight:800;
        cursor:pointer;
      ">Go back and try again</button>
    </div>
  `;

    document.body.appendChild(overlay);
    overlay.querySelector("#errBtn").onclick = () => {
        overlay.remove();
        go(backScreen);
    };
}

function screenPlaneClip() {
    return `
    <div class="planeClipScreen">
      <video class="planeClipVideo" id="planeClipVideo" autoplay controls playsinline>
        <source src="assets/plane video.mp4" type="video/mp4">
      </video>
    </div>
  `;
}

function screenNycRoom(useHungryPrompt = false) {
    const nycBubbleSrc = useHungryPrompt ? "assets/im hungry text.png" : "assets/lets go for a walk text.png";
    const nycBubbleAlt = useHungryPrompt
        ? "baby im hungry can we eat now? Theres a restaurant i want to go to"
        : "Baby lets go for a walk first";
    return `
    ${headerTitle()}
    <div class="nycRoomStage" id="nycRoomStage">
      <video class="nycGameBgVideo" id="nycGameBgVideo" muted loop playsinline hidden>
        <source src="assets/nyc towards building.mp4" type="video/mp4">
      </video>
      <div class="nycAvoidHud" id="nycAvoidHud" hidden>
        Avoided: <span id="nycAvoidCount">0</span>/22
      </div>
      <div class="nycObstacleLayer" id="nycObstacleLayer" hidden></div>
      <div class="nycWinOverlay" id="nycWinOverlay" hidden>
        <img class="nycWinSignImage" src="assets/protect congrats.png" alt="这么好的男朋友！保护大米这么好！">
        <div class="nycOverlayBtnRow">
          <button class="nycWinPlayAgainBtn" id="nycWinPlayAgainBtn">Play Again</button>
          <button class="nycWinBackBtn" id="nycWinBackBtn">Next</button>
        </div>
      </div>
      <div class="nycGameOverOverlay" id="nycGameOverOverlay" hidden>
        <div class="nycGameOverSign">不保护我</div>
        <div class="nycOverlayBtnRow">
          <button class="nycPlayAgainBtn" id="nycPlayAgainBtn">Play Again</button>
          <button class="nycGameOverNextBtn" id="nycGameOverNextBtn">Next</button>
        </div>
      </div>
      <img class="nycCouple" src="assets/ccwithme.png" alt="Couple">
      <div class="nycWalkBubble" id="nycWalkBubble" hidden>
        <img src="${nycBubbleSrc}" alt="${nycBubbleAlt}">
      </div>
      <button class="nycWalkOkBtn" id="nycWalkOkBtn" aria-label="OK" hidden></button>
      <div class="nycStartSign" id="nycStartSign" hidden>
        <img src="assets/take care game sign.png" alt="Take Care Game Sign">
      </div>
      <button class="nycStartBtn" id="nycStartBtn" aria-label="Start" hidden>Start Game</button>
    </div>
  `;
}

function screenNycDinner() {
    return `
    ${headerTitle()}
    <div class="nycDinnerStage" id="nycDinnerStage" aria-label="NYC dinner scene">
      <div class="nycDinnerChat nycDinnerChatLeft" id="nycDinnerChatLeft">
        <img class="nycDinnerChatImg" id="nycDinnerChatLeftImg" alt="Dinner speech bubble">
      </div>
      <div class="nycDinnerChat nycDinnerChatRight" id="nycDinnerChatRight" hidden>
        <img class="nycDinnerChatImg" id="nycDinnerChatRightImg" alt="Dinner speech bubble">
      </div>
      <button class="nycDinnerOkBtn" id="nycDinnerOkBtn" aria-label="Next">Next</button>
      <div class="nycDinnerGameIntro" id="nycDinnerGameIntro" hidden>
        <img class="nycDinnerGameSign" src="assets/restaurant_sign_transparent.png" alt="Restaurant game sign">
        <button class="nycDinnerStartBtn" id="nycDinnerStartBtn" aria-label="Start">Start</button>
      </div>
      <div class="nycDinnerRunner" id="nycDinnerRunner" hidden>
        <div class="nycDinnerRunnerHud">Score: <span id="nycDinnerRunnerScore">0</span></div>
        <div class="nycDinnerRunnerObstacleLayer" id="nycDinnerRunnerObstacleLayer"></div>
        <img class="nycDinnerRunnerPlayer" id="nycDinnerRunnerPlayer" src="assets/restaurant-runner.png" data-fallback-src="assets/ccalone.png" alt="Runner character">
        <div class="nycDinnerRunnerGameOver" id="nycDinnerRunnerGameOver" hidden>
          <div class="nycDinnerRunnerGameOverText">Game Over</div>
          <div class="nycDinnerRunnerBestScore" id="nycDinnerRunnerBestScore">Top Score: 0</div>
          <div class="nycDinnerRunnerBtnRow">
            <button class="nycDinnerRunnerRestartBtn" id="nycDinnerRunnerRestartBtn">Play Again</button>
            <button class="nycDinnerRunnerNextBtn" id="nycDinnerRunnerNextBtn">Next</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function screenHome() {
    return `
    <div class="openingScreen">
      <video class="openingBgVideo" autoplay muted loop playsinline>
        <source src="assets/opening video.mp4" type="video/mp4">
      </video>
      <div class="openingShade"></div>
      <img class="openingLogo" src="assets/love game.png" alt="Love Game">
      <div class="openingContent">
        <button class="startImageBtn" id="startBtn" aria-label="Start"></button>
      </div>
    </div>
  `;
}

function screenCustomize() {
    return `
    <div class="customizeScreen">
      <video class="customizeBgVideo" autoplay muted loop playsinline>
        <source src="assets/choose your own character video.mp4" type="video/mp4">
      </video>
      <div class="customizeShade"></div>
      <div class="customizeContent">
        ${headerTitle()}
        <div class="card customizeCard">
          <img class="customizeTitleImage" src="assets/choose your own character logo.png" alt="Choose Your Character">

          <div class="choiceRow">
            <div class="choiceBtn" id="chooseAlone">
              <img src="assets/ccalone.png" alt="ccalone">
              <div class="choiceTitle">ccalone</div>
              <div class="choiceHint">Just him</div>
            </div>

            <div class="choiceBtn" id="chooseWithMe">
              <img src="assets/ccwithme.png" alt="ccwithme">
              <div class="choiceTitle">ccwithme</div>
              <div class="choiceHint">Him + you</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function screenMap() {
    const showIntro = state.mapIntroDone !== true || state.mapPostComputerIntroPending === true;
    const introImage = state.mapPostComputerIntroPending === true
        ? "assets/text 2.png"
        : "assets/text bubble 1.png";
    return `
    ${headerTitle()}
    <div class="roomStage">
      <div class="roomOverlay"></div>

      ${showIntro ? `
      <div class="roomIntroBubble" id="roomIntroBubble">
        <img src="${introImage}" alt="Room intro message">
      </div>
      <button
        class="introOkBtn"
        id="roomIntroOk"
        aria-label="OK"
        style="
          width:360px;
          max-width:92%;
          aspect-ratio: 1536 / 1024;
          background:transparent url('assets/好的宝宝.png') center center no-repeat;
          background-size:contain;
          border:none;
          cursor:pointer;
        "
      ></button>
      ` : ""}

      <button class="shelfAction" id="shelfBtn">Look closer</button>
      <button class="computerAction" id="computerBtn">Look closer</button>
      <div class="mapTouchControls" id="mapTouchControls" aria-label="Movement controls">
        <button class="mapCtrlBtn mapCtrlUp" id="mapCtrlUp" aria-label="Move up">UP</button>
        <button class="mapCtrlBtn mapCtrlLeft" id="mapCtrlLeft" aria-label="Move left">LEFT</button>
        <button class="mapCtrlBtn mapCtrlRight" id="mapCtrlRight" aria-label="Move right">RIGHT</button>
        <button class="mapCtrlBtn mapCtrlDown" id="mapCtrlDown" aria-label="Move down">DOWN</button>
      </div>
      <img class="wanderChar" src="assets/ccwithme.png" alt="walking character">
    </div>
  `;
}

function screenShelf() {
    return `
    <div class="shelfScene" aria-label="Bookshelf close-up scene">
      <button class="shelfHeartHotspot" id="shelfHeartBtn" aria-label="Open note"></button>
    </div>
  `;
}

function screenNote() {
    return `
    <div class="noteScene" aria-label="Close-up note scene">
      <div class="noteMessage">I made this game for you my love! Now lets go explore!</div>
      <button class="backRoomBtn" id="backRoomBtn">Back to Room</button>
    </div>
  `;
}

function screenComputer() {
    return `
    <div class="computerScene" aria-label="Computer close-up scene">
      <div class="computerFrame">
        <button class="computerHeartHotspot" id="computerHeartBtn" aria-label="Open heart app"></button>
        <img class="loveBugCrawler" id="loveBugCrawler" src="assets/love bug.png" alt="Crawling love bug" hidden>
        <div class="catchStartOverlay" id="catchStartOverlay" hidden>
          <img class="catchStartSign" src="assets/catch the love bug sign.png" alt="Catch the Love Bug sign">
          <button class="huntStartBtn" id="huntStartBtn" aria-label="Start Love Bug Hunt">Start Hunt</button>
        </div>
        <div class="escapeSignOverlay" id="escapeSignOverlay" hidden>
          <div class="escapeSignFrame">
            <img class="escapeSignImage" src="assets/love bug escape.png" alt="Love bug escape sign">
            <button class="escapeOkBtn" id="escapeOkBtn" aria-label="OK">OK</button>
            <button class="escapeErrorHotspot" id="escapeErrorHotspot" aria-label="Trigger error near OK"></button>
          </div>
        </div>
        <div class="nycSignOverlay" id="nycSignOverlay" hidden>
          <div class="nycSignFrame">
            <img class="nycSignImage" src="assets/go to nyc love bug.png" alt="Love bug headed to New York City sign">
            <button class="nycGoHotspot" id="nycGoHotspot" aria-label="Let's Go image button"></button>
            <button class="nycErrorHotspot" id="nycErrorHotspot" aria-label="Trigger error near Let's Go"></button>
          </div>
        </div>
        <div class="loveBugPopup" id="loveBugPopup" hidden>
          <div id="loveBugStep1">
            <img class="loveBugImage" src="assets/love bug.png" alt="Love bug">
            <div class="loveBugTitle">Love bug appeared!</div>
            <button class="loveBugNextBtn" id="loveBugNextBtn">Next</button>
          </div>
          <div id="loveBugStep2" hidden>
            <img class="loveBugMessageImage" src="assets/love bug message 1.png" alt="We have found a love bug in your system message">
            <button class="loveBugOkBtn" id="loveBugOkBtn">OK</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function startMapCharacterControl() {
    if (mapControlTeardown != null) {
        mapControlTeardown();
        mapControlTeardown = null;
    }

    const stage = document.querySelector(".roomStage");
    const char = document.querySelector(".wanderChar");
    const shelfBtn = document.getElementById("shelfBtn");
    const computerBtn = document.getElementById("computerBtn");
    const introBubble = document.getElementById("roomIntroBubble");
    if (stage == null || char == null) return;

    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    const heldByKeyboard = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    const heldByTouch = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    const touchCleanupFns = [];

    function recomputeKeys() {
        keys.ArrowUp = heldByKeyboard.ArrowUp || heldByTouch.ArrowUp;
        keys.ArrowDown = heldByKeyboard.ArrowDown || heldByTouch.ArrowDown;
        keys.ArrowLeft = heldByKeyboard.ArrowLeft || heldByTouch.ArrowLeft;
        keys.ArrowRight = heldByKeyboard.ArrowRight || heldByTouch.ArrowRight;
    }

    const speed = 360;
    let running = true;
    let lastTime = performance.now();

    const pos = {
        x: (stage.clientWidth - char.offsetWidth) * 0.08,
        y: (stage.clientHeight - char.offsetHeight) * 0.72
    };
    if (
        state.mapCharPos != null
        && Number.isFinite(state.mapCharPos.x)
        && Number.isFinite(state.mapCharPos.y)
    ) {
        pos.x = state.mapCharPos.x;
        pos.y = state.mapCharPos.y;
    }
    let facing = state.mapCharPos?.facing === "left" ? "left" : "right";

    function persistMapPose(saveNow) {
        state.mapCharPos = { x: pos.x, y: pos.y, facing };
        if (saveNow) save();
    }

    function clamp() {
        const maxX = Math.max(0, stage.clientWidth - char.offsetWidth);
        const maxY = Math.max(0, stage.clientHeight - char.offsetHeight);
        pos.x = Math.max(0, Math.min(maxX, pos.x));
        pos.y = Math.max(0, Math.min(maxY, pos.y));
    }

    function updateIntroBubblePosition() {
        if (introBubble == null || introBubble.isConnected === false) return;
        const bubbleX = pos.x + (char.offsetWidth * 0.72);
        const bubbleY = pos.y - (char.offsetHeight * 0.02);
        introBubble.style.left = bubbleX + "px";
        introBubble.style.top = bubbleY + "px";
    }

    function introActive() {
        return introBubble != null && introBubble.isConnected;
    }

    function inShelfZone() {
        const charRight = pos.x + char.offsetWidth;
        const zoneLeft = stage.clientWidth * 0.78;
        return charRight >= zoneLeft;
    }

    function updateShelfPrompt() {
        if (shelfBtn == null) return;
        shelfBtn.classList.toggle("show", inShelfZone());
    }

    function inComputerZone() {
        const cx = pos.x + (char.offsetWidth * 0.5);
        const cy = pos.y + (char.offsetHeight * 0.72);
        const zone = {
            left: stage.clientWidth * 0.32,
            right: stage.clientWidth * 0.56,
            top: stage.clientHeight * 0.46,
            bottom: stage.clientHeight * 0.86
        };
        return cx >= zone.left && cx <= zone.right && cy >= zone.top && cy <= zone.bottom;
    }

    function updateComputerPrompt() {
        if (computerBtn == null) return;
        const show = state.bookshelfPassed === true && inComputerZone();
        computerBtn.classList.toggle("show", show);
    }

    function draw() {
        char.style.left = pos.x + "px";
        char.style.top = pos.y + "px";
        updateIntroBubblePosition();
        updateShelfPrompt();
        updateComputerPrompt();
    }

    function teardown() {
        if (!running) return;
        running = false;
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("resize", onResize);
        for (const cleanup of touchCleanupFns) cleanup();
        touchCleanupFns.length = 0;
        if (shelfBtn != null) shelfBtn.onclick = null;
        if (computerBtn != null) computerBtn.onclick = null;
    }

    function onResize() {
        clamp();
        draw();
    }

    function onKeyDown(e) {
        if (Object.prototype.hasOwnProperty.call(keys, e.key)) {
            e.preventDefault();
            if (introActive()) return;
            heldByKeyboard[e.key] = true;
            recomputeKeys();
        }
    }

    function onKeyUp(e) {
        if (Object.prototype.hasOwnProperty.call(keys, e.key)) {
            heldByKeyboard[e.key] = false;
            recomputeKeys();
        }
    }

    function frame(now) {
        if (!running) return;
        if (state.screen !== "map") {
            teardown();
            return;
        }

        const dt = Math.min(0.03, (now - lastTime) / 1000);
        lastTime = now;

        if (introActive()) {
            heldByKeyboard.ArrowUp = false;
            heldByKeyboard.ArrowDown = false;
            heldByKeyboard.ArrowLeft = false;
            heldByKeyboard.ArrowRight = false;
            heldByTouch.ArrowUp = false;
            heldByTouch.ArrowDown = false;
            heldByTouch.ArrowLeft = false;
            heldByTouch.ArrowRight = false;
            recomputeKeys();
            draw();
            requestAnimationFrame(frame);
            return;
        }

        let dx = 0;
        let dy = 0;
        if (keys.ArrowLeft) dx -= 1;
        if (keys.ArrowRight) dx += 1;
        if (keys.ArrowUp) dy -= 1;
        if (keys.ArrowDown) dy += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.hypot(dx, dy) || 1;
            pos.x += (dx / length) * speed * dt;
            pos.y += (dy / length) * speed * dt;

            if (dx < 0) {
                facing = "left";
                char.style.transform = "scaleX(1)";
            }
            if (dx > 0) {
                facing = "right";
                char.style.transform = "scaleX(-1)";
            }
        }

        clamp();
        draw();
        requestAnimationFrame(frame);
    }

    clamp();
    char.style.transform = facing === "left" ? "scaleX(1)" : "scaleX(-1)";
    draw();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

    const mapCtrlBindings = [
        { id: "mapCtrlUp", key: "ArrowUp" },
        { id: "mapCtrlDown", key: "ArrowDown" },
        { id: "mapCtrlLeft", key: "ArrowLeft" },
        { id: "mapCtrlRight", key: "ArrowRight" }
    ];
    for (const binding of mapCtrlBindings) {
        const btn = document.getElementById(binding.id);
        if (btn == null) continue;

        const onDown = (e) => {
            e.preventDefault();
            heldByTouch[binding.key] = true;
            recomputeKeys();
        };
        const onUp = (e) => {
            e.preventDefault();
            heldByTouch[binding.key] = false;
            recomputeKeys();
        };

        btn.addEventListener("pointerdown", onDown);
        btn.addEventListener("pointerup", onUp);
        btn.addEventListener("pointercancel", onUp);
        btn.addEventListener("pointerleave", onUp);

        touchCleanupFns.push(() => {
            heldByTouch[binding.key] = false;
            btn.removeEventListener("pointerdown", onDown);
            btn.removeEventListener("pointerup", onUp);
            btn.removeEventListener("pointercancel", onUp);
            btn.removeEventListener("pointerleave", onUp);
        });
    }

    if (shelfBtn != null) {
        shelfBtn.onclick = () => {
            state.bookshelfPassed = true;
            persistMapPose(true);
            go("shelf");
        };
    }

    if (computerBtn != null) {
        computerBtn.onclick = () => {
            persistMapPose(true);
            go("computer");
        };
    }

    requestAnimationFrame(frame);
    mapControlTeardown = teardown;
}

function render() {
    app.classList.toggle("openingMode", state.screen === "home");
    app.classList.toggle("customizeMode", state.screen === "customize");
    app.classList.toggle("mapMode", state.screen === "map");
    app.classList.toggle("shelfMode", state.screen === "shelf");
    app.classList.toggle("noteMode", state.screen === "note");
    app.classList.toggle("computerMode", state.screen === "computer");
    app.classList.toggle("planeClipMode", state.screen === "planeClip");
    app.classList.toggle("nycRoomMode", state.screen === "nycRoom");
    app.classList.toggle("nycDinnerMode", state.screen === "nycDinner");

    if (state.screen === "home") {
        app.innerHTML = screenHome();
        const startBtn = document.getElementById("startBtn");
        if (startBtn != null) startBtn.onclick = () => go("customize");
        return;
    }

    if (state.screen === "customize") {
        app.innerHTML = screenCustomize();
        mountHomeButton();

        const chooseAlone = document.getElementById("chooseAlone");
        const chooseWithMe = document.getElementById("chooseWithMe");

        if (chooseAlone != null) {
            chooseAlone.onclick = () => {
                state.characterMode = "alone";
                save();
                showErrorOverlay();
            };
        }

        if (chooseWithMe != null) {
            chooseWithMe.onclick = () => {
                state.characterMode = "withme";
                state.mapIntroDone = false;
                state.mapPostComputerIntroPending = false;
                state.mapCharPos = null;
                state.bookshelfPassed = false;
                save();
                go("map");
            };
        }
        return;
    }

    if (state.screen === "map") {
        if (state.characterMode !== "withme") {
            go("customize");
            return;
        }

        app.innerHTML = screenMap();
        mountHomeButton();
        startMapCharacterControl();

        const introOk = document.getElementById("roomIntroOk");
        const introBubble = document.getElementById("roomIntroBubble");
        if (introOk != null && introBubble != null) {
            introOk.onclick = () => {
                const playPlaneClip = state.mapPostComputerIntroPending === true;
                state.mapIntroDone = true;
                state.mapPostComputerIntroPending = false;
                save();
                introBubble.remove();
                introOk.remove();
                if (playPlaneClip) {
                    go("planeClip");
                    return;
                }
            };
        }
        return;
    }

    if (state.screen === "planeClip") {
        app.innerHTML = screenPlaneClip();
        const planeClipVideo = document.getElementById("planeClipVideo");
        if (planeClipVideo != null) {
            const moveToNycRoom = () => go("nycRoom");
            planeClipVideo.onended = moveToNycRoom;
            planeClipVideo.onerror = moveToNycRoom;
            planeClipVideo.play().catch(() => { });
        } else {
            go("nycRoom");
        }
        return;
    }

    if (state.screen === "nycRoom") {
        const nycArrivalFromWin = nycReturnFromWin === true;
        app.innerHTML = screenNycRoom(nycArrivalFromWin);
        nycReturnFromWin = false;
        mountHomeButton();
        const nycWalkBubble = document.getElementById("nycWalkBubble");
        const nycWalkOkBtn = document.getElementById("nycWalkOkBtn");
        const nycRoomStage = document.getElementById("nycRoomStage");
        const nycGameBgVideo = document.getElementById("nycGameBgVideo");
        const nycAvoidHud = document.getElementById("nycAvoidHud");
        const nycAvoidCount = document.getElementById("nycAvoidCount");
        const nycObstacleLayer = document.getElementById("nycObstacleLayer");
        const nycWinOverlay = document.getElementById("nycWinOverlay");
        const nycWinPlayAgainBtn = document.getElementById("nycWinPlayAgainBtn");
        const nycWinBackBtn = document.getElementById("nycWinBackBtn");
        const nycGameOverOverlay = document.getElementById("nycGameOverOverlay");
        const nycPlayAgainBtn = document.getElementById("nycPlayAgainBtn");
        const nycGameOverNextBtn = document.getElementById("nycGameOverNextBtn");
        const nycCouple = document.querySelector(".nycCouple");
        const nycStartSign = document.getElementById("nycStartSign");
        const nycStartBtn = document.getElementById("nycStartBtn");
        if (nycWalkBubble != null && nycWalkOkBtn != null) {
            const nycPromptDelayMs = nycArrivalFromWin ? 0 : 900;
            nycPromptTimer = setTimeout(() => {
                if (state.screen !== "nycRoom") return;
                nycWalkBubble.hidden = false;
                nycWalkOkBtn.hidden = false;
                nycPromptTimer = null;
            }, nycPromptDelayMs);

            nycWalkOkBtn.onclick = () => {
                nycWalkBubble.hidden = true;
                nycWalkOkBtn.hidden = true;
                if (nycArrivalFromWin) {
                    go("nycDinner");
                    return;
                }
                if (nycCouple != null) nycCouple.hidden = true;
                if (nycStartSign != null) nycStartSign.hidden = false;
                if (nycStartBtn != null) nycStartBtn.hidden = false;
            };
        }
        if (nycStartBtn != null) {
            const startNycGameLoop = () => {
                let nycAvoidedCount = 0;
                let nycWinReached = false;
                if (nycAvoidHud != null) nycAvoidHud.hidden = false;
                if (nycAvoidCount != null) nycAvoidCount.textContent = "0";
                if (nycWinOverlay != null) nycWinOverlay.hidden = true;
                if (nycGameOverOverlay != null) nycGameOverOverlay.hidden = true;
                if (nycFollowTeardown != null) {
                    nycFollowTeardown();
                    nycFollowTeardown = null;
                }
                if (nycObstacleTeardown != null) {
                    nycObstacleTeardown();
                    nycObstacleTeardown = null;
                }
                if (nycCollisionTeardown != null) {
                    nycCollisionTeardown();
                    nycCollisionTeardown = null;
                }

                if (nycRoomStage != null && nycCouple != null) {
                    nycCouple.classList.remove("hitFlip");
                    nycCouple.style.transform = "";
                    nycCouple.hidden = false;
                    nycFollowTeardown = startNycCoupleFollow(nycRoomStage, nycCouple);
                }
                if (nycObstacleLayer != null) {
                    nycObstacleLayer.hidden = false;
                    nycObstacleTeardown = startNycObstacleSpawner(nycObstacleLayer, () => {
                        if (nycWinReached) return;
                        nycAvoidedCount += 1;
                        if (nycAvoidCount != null) nycAvoidCount.textContent = `${Math.min(22, nycAvoidedCount)}`;
                        if (nycAvoidedCount < 22) return;
                        nycWinReached = true;
                        if (nycFollowTeardown != null) {
                            nycFollowTeardown();
                            nycFollowTeardown = null;
                        }
                        if (nycObstacleTeardown != null) {
                            nycObstacleTeardown();
                            nycObstacleTeardown = null;
                        }
                        if (nycCollisionTeardown != null) {
                            nycCollisionTeardown();
                            nycCollisionTeardown = null;
                        }
                        if (nycAvoidHud != null) nycAvoidHud.hidden = true;
                        if (nycWinOverlay != null) nycWinOverlay.hidden = false;
                    });
                }
                if (nycRoomStage != null && nycCouple != null && nycObstacleLayer != null) {
                    nycCollisionTeardown = startNycCollisionWatch(
                        nycRoomStage,
                        nycCouple,
                        nycObstacleLayer,
                        (hitObstacle) => {
                            if (hitObstacle != null) hitObstacle.dataset.hit = "1";
                            if (nycFollowTeardown != null) {
                                nycFollowTeardown();
                                nycFollowTeardown = null;
                            }
                            if (nycObstacleTeardown != null) {
                                nycObstacleTeardown();
                                nycObstacleTeardown = null;
                            }
                            if (nycCollisionTeardown != null) {
                                nycCollisionTeardown();
                                nycCollisionTeardown = null;
                            }
                            if (nycAvoidHud != null) nycAvoidHud.hidden = true;
                            if (nycCouple != null) {
                                nycCouple.classList.remove("hitFlip");
                                void nycCouple.offsetWidth;
                                nycCouple.classList.add("hitFlip");
                            }
                            const showGameOver = () => {
                                window.setTimeout(() => {
                                    if (state.screen !== "nycRoom") return;
                                    if (nycGameOverOverlay != null) nycGameOverOverlay.hidden = false;
                                }, 1000);
                            };
                            if (nycCouple != null) {
                                nycCouple.addEventListener("animationend", showGameOver, { once: true });
                            } else {
                                showGameOver();
                            }
                        }
                    );
                }
            };

            nycStartBtn.onclick = () => {
                if (nycStartBtn.dataset.started === "1") return;
                nycStartBtn.dataset.started = "1";
                if (nycStartSign != null) nycStartSign.hidden = true;
                nycStartBtn.hidden = true;
                if (nycCouple != null) nycCouple.hidden = false;
                if (nycRoomStage != null) nycRoomStage.classList.add("gameStarted");
                if (nycGameBgVideo != null) {
                    nycGameBgVideo.hidden = false;
                    nycGameBgVideo.currentTime = 0;
                    nycGameBgVideo.play().catch(() => { });
                }
                startNycGameLoop();
            };

            if (nycPlayAgainBtn != null) {
                nycPlayAgainBtn.onclick = () => startNycGameLoop();
            }
            if (nycWinPlayAgainBtn != null) {
                nycWinPlayAgainBtn.onclick = () => startNycGameLoop();
            }
            if (nycWinBackBtn != null) {
                nycWinBackBtn.onclick = () => go("nycDinner");
            }
            if (nycGameOverNextBtn != null) {
                nycGameOverNextBtn.onclick = () => go("nycDinner");
            }
        }
        return;
    }

    if (state.screen === "nycDinner") {
        app.innerHTML = screenNycDinner();
        mountHomeButton();
        const nycDinnerStage = document.getElementById("nycDinnerStage");
        const nycDinnerChatLeft = document.getElementById("nycDinnerChatLeft");
        const nycDinnerChatRight = document.getElementById("nycDinnerChatRight");
        const nycDinnerChatLeftImg = document.getElementById("nycDinnerChatLeftImg");
        const nycDinnerChatRightImg = document.getElementById("nycDinnerChatRightImg");
        const nycDinnerOkBtn = document.getElementById("nycDinnerOkBtn");
        const nycDinnerGameIntro = document.getElementById("nycDinnerGameIntro");
        const nycDinnerStartBtn = document.getElementById("nycDinnerStartBtn");
        const nycDinnerRunner = document.getElementById("nycDinnerRunner");
        const nycDinnerRunnerScore = document.getElementById("nycDinnerRunnerScore");
        const nycDinnerRunnerBestScore = document.getElementById("nycDinnerRunnerBestScore");
        const nycDinnerRunnerPlayer = document.getElementById("nycDinnerRunnerPlayer");
        const nycDinnerRunnerObstacleLayer = document.getElementById("nycDinnerRunnerObstacleLayer");
        const nycDinnerRunnerGameOver = document.getElementById("nycDinnerRunnerGameOver");
        const nycDinnerRunnerRestartBtn = document.getElementById("nycDinnerRunnerRestartBtn");
        const nycDinnerRunnerNextBtn = document.getElementById("nycDinnerRunnerNextBtn");
        if (
            nycDinnerStage != null
            &&
            nycDinnerChatLeft != null
            && nycDinnerChatRight != null
            && nycDinnerChatLeftImg != null
            && nycDinnerChatRightImg != null
            && nycDinnerOkBtn != null
            && nycDinnerGameIntro != null
            && nycDinnerStartBtn != null
            && nycDinnerRunner != null
            && nycDinnerRunnerScore != null
            && nycDinnerRunnerBestScore != null
            && nycDinnerRunnerObstacleLayer != null
            && nycDinnerRunnerPlayer != null
            && nycDinnerRunnerGameOver != null
            && nycDinnerRunnerRestartBtn != null
            && nycDinnerRunnerNextBtn != null
        ) {
            nycDinnerRunnerPlayer.onerror = () => {
                const fallbackSrc = nycDinnerRunnerPlayer.dataset.fallbackSrc;
                if (fallbackSrc != null && nycDinnerRunnerPlayer.src.indexOf(fallbackSrc) === -1) {
                    nycDinnerRunnerPlayer.src = fallbackSrc;
                }
            };
            nycDinnerRunnerNextBtn.onclick = () => {
                go("nycRoom");
            };

            const dinnerLines = [
                { side: "right", img: "assets/pixel-speech-bubble.png" },
                { side: "left", img: "assets/second speech bubble.png" },
                { side: "right", img: "assets/pixel-speech-bubble (1).png" },
                { side: "left", img: "assets/pixel-speech-bubble (7).png" },
                { side: "right", img: "assets/pixel-speech-bubble (2).png" },
                { side: "left", img: "assets/pixel-speech-bubble (8).png" },
                { side: "right", img: "assets/pixel-speech-bubble (3).png" },
                { side: "left", img: "assets/pixel-speech-bubble (9).png" },
                { side: "right", img: "assets/pixel-speech-bubble (4).png" },
                { side: "left", img: "assets/pixel-speech-bubble (10).png" }
            ];
            let dinnerLineIndex = 0;

            const renderDinnerLine = () => {
                const line = dinnerLines[dinnerLineIndex];
                if (line.side === "left") {
                    nycDinnerChatLeftImg.src = line.img;
                    nycDinnerChatRight.hidden = true;
                    nycDinnerChatLeft.hidden = false;
                } else {
                    nycDinnerChatRightImg.src = line.img;
                    nycDinnerChatLeft.hidden = true;
                    nycDinnerChatRight.hidden = false;
                }
            };

            renderDinnerLine();
            nycDinnerOkBtn.onclick = () => {
                if (dinnerLineIndex >= dinnerLines.length - 1) {
                    nycDinnerChatLeft.hidden = true;
                    nycDinnerChatRight.hidden = true;
                    nycDinnerOkBtn.hidden = true;
                    nycDinnerStage.classList.add("gameIntroReady");
                    nycDinnerGameIntro.hidden = false;
                    return;
                }
                dinnerLineIndex = (dinnerLineIndex + 1) % dinnerLines.length;
                renderDinnerLine();
            };

            nycDinnerStartBtn.onclick = () => {
                nycDinnerGameIntro.hidden = true;
                nycDinnerRunner.hidden = false;
                if (nycDinnerRunnerTeardown != null) {
                    nycDinnerRunnerTeardown();
                    nycDinnerRunnerTeardown = null;
                }
                nycDinnerRunnerTeardown = startNycDinnerRunnerGame({
                    stage: nycDinnerRunner,
                    player: nycDinnerRunnerPlayer,
                    obstacleLayer: nycDinnerRunnerObstacleLayer,
                    scoreEl: nycDinnerRunnerScore,
                    bestScoreEl: nycDinnerRunnerBestScore,
                    gameOverOverlay: nycDinnerRunnerGameOver,
                    restartBtn: nycDinnerRunnerRestartBtn
                });
            };
        }
        return;
    }

    if (state.screen === "shelf") {
        app.innerHTML = screenShelf();
        const shelfHeartBtn = document.getElementById("shelfHeartBtn");
        if (shelfHeartBtn != null) shelfHeartBtn.onclick = () => go("note");
        return;
    }

    if (state.screen === "note") {
        app.innerHTML = screenNote();
        const backRoomBtn = document.getElementById("backRoomBtn");
        if (backRoomBtn != null) {
            backRoomBtn.onclick = () => {
                state.mapIntroDone = true;
                save();
                go("map");
            };
        }
        return;
    }

    if (state.screen === "computer") {
        app.innerHTML = screenComputer();
        const computerFrame = document.querySelector(".computerFrame");
        const computerHeartBtn = document.getElementById("computerHeartBtn");
        const loveBugCrawler = document.getElementById("loveBugCrawler");
        const catchStartOverlay = document.getElementById("catchStartOverlay");
        const huntStartBtn = document.getElementById("huntStartBtn");
        const escapeSignOverlay = document.getElementById("escapeSignOverlay");
        const escapeOkBtn = document.getElementById("escapeOkBtn");
        const escapeErrorHotspot = document.getElementById("escapeErrorHotspot");
        const nycSignOverlay = document.getElementById("nycSignOverlay");
        const nycGoHotspot = document.getElementById("nycGoHotspot");
        const nycErrorHotspot = document.getElementById("nycErrorHotspot");
        const loveBugPopup = document.getElementById("loveBugPopup");
        const loveBugNextBtn = document.getElementById("loveBugNextBtn");
        const loveBugOkBtn = document.getElementById("loveBugOkBtn");
        const loveBugStep1 = document.getElementById("loveBugStep1");
        const loveBugStep2 = document.getElementById("loveBugStep2");
        let crawlRoundId = 0;
        let huntActive = false;

        function startFranticLoveBugCrawl(roundId) {
            if (computerFrame == null || loveBugCrawler == null) return;
            if (loveBugCrawler.dataset.crawling === "1") return;

            loveBugCrawler.hidden = false;
            loveBugCrawler.style.pointerEvents = "auto";
            loveBugCrawler.dataset.crawling = "1";

            let maxX = Math.max(0, computerFrame.clientWidth - loveBugCrawler.offsetWidth);
            let maxY = Math.max(0, computerFrame.clientHeight - loveBugCrawler.offsetHeight);
            let x = maxX * 0.5;
            let y = maxY * 0.5;
            let vx = (Math.random() < 0.5 ? -1 : 1) * (250 + (Math.random() * 140));
            let vy = (Math.random() < 0.5 ? -1 : 1) * (250 + (Math.random() * 140));
            let lastTime = performance.now();

            function frame(now) {
                if (roundId !== crawlRoundId || !huntActive || state.screen !== "computer" || !loveBugCrawler.isConnected) {
                    loveBugCrawler.dataset.crawling = "0";
                    return;
                }

                const dt = Math.min(0.035, (now - lastTime) / 1000);
                lastTime = now;

                // Keep movement chaotic but bounded to the frame.
                vx += (Math.random() - 0.5) * 900 * dt;
                vy += (Math.random() - 0.5) * 900 * dt;

                const speed = Math.hypot(vx, vy) || 1;
                const minSpeed = 210;
                const maxSpeed = 500;
                const clampedSpeed = Math.max(minSpeed, Math.min(maxSpeed, speed));
                vx = (vx / speed) * clampedSpeed;
                vy = (vy / speed) * clampedSpeed;

                x += vx * dt;
                y += vy * dt;

                maxX = Math.max(0, computerFrame.clientWidth - loveBugCrawler.offsetWidth);
                maxY = Math.max(0, computerFrame.clientHeight - loveBugCrawler.offsetHeight);

                if (x < 0) {
                    x = 0;
                    vx = Math.abs(vx);
                } else if (x > maxX) {
                    x = maxX;
                    vx = -Math.abs(vx);
                }

                if (y < 0) {
                    y = 0;
                    vy = Math.abs(vy);
                } else if (y > maxY) {
                    y = maxY;
                    vy = -Math.abs(vy);
                }

                const tilt = Math.max(-26, Math.min(26, vx * 0.03));
                loveBugCrawler.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`;
                requestAnimationFrame(frame);
            }

            requestAnimationFrame(frame);
        }

        function stopCrawlAndHideBug() {
            crawlRoundId += 1;
            huntActive = false;
            if (loveBugCrawler != null) {
                loveBugCrawler.hidden = true;
                loveBugCrawler.style.pointerEvents = "none";
                loveBugCrawler.dataset.crawling = "0";
            }
        }

        if (computerHeartBtn != null && loveBugPopup != null) {
            computerHeartBtn.onclick = () => {
                stopCrawlAndHideBug();
                loveBugPopup.hidden = false;
                if (loveBugStep1 != null) loveBugStep1.hidden = false;
                if (loveBugStep2 != null) loveBugStep2.hidden = true;
                if (catchStartOverlay != null) catchStartOverlay.hidden = true;
                if (escapeSignOverlay != null) escapeSignOverlay.hidden = true;
                if (nycSignOverlay != null) nycSignOverlay.hidden = true;
            };
        }
        if (loveBugNextBtn != null && loveBugStep1 != null && loveBugStep2 != null) {
            loveBugNextBtn.onclick = () => {
                loveBugStep1.hidden = true;
                loveBugStep2.hidden = false;
            };
        }
        if (loveBugOkBtn != null && loveBugPopup != null) {
            loveBugOkBtn.onclick = () => {
                loveBugPopup.hidden = true;
                if (catchStartOverlay != null) catchStartOverlay.hidden = false;
            };
        }
        if (huntStartBtn != null && catchStartOverlay != null) {
            huntStartBtn.onclick = () => {
                catchStartOverlay.hidden = true;
                huntActive = true;
                crawlRoundId += 1;
                startFranticLoveBugCrawl(crawlRoundId);
            };
        }
        if (loveBugCrawler != null) {
            loveBugCrawler.onclick = () => {
                if (!huntActive) return;
                stopCrawlAndHideBug();
                if (escapeSignOverlay != null) escapeSignOverlay.hidden = false;
            };
        }
        if (escapeOkBtn != null && escapeSignOverlay != null) {
            escapeOkBtn.onclick = () => {
                escapeSignOverlay.hidden = true;
                if (nycSignOverlay != null) nycSignOverlay.hidden = false;
            };
        }
        if (escapeErrorHotspot != null) {
            escapeErrorHotspot.onclick = () => showErrorOverlay();
        }
        if (nycGoHotspot != null && nycSignOverlay != null) {
            nycGoHotspot.onclick = () => {
                nycSignOverlay.hidden = true;
                state.mapPostComputerIntroPending = true;
                save();
                go("map");
            };
        }
        if (nycErrorHotspot != null) {
            nycErrorHotspot.onclick = () => showErrorOverlay();
        }
        return;
    }

    go("home");
}

mountClickHearts();
render();
