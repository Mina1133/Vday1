const app = document.getElementById("app");

const STORAGE_KEY = "valentine_game_save_v11_story_map";
const DINNER_TOP_SCORE_KEY = "valentine_game_nyc_dinner_top_score_v1";
const MINT_TOP_SCORE_KEY = "valentine_game_mint_top_score_v1";

let mapControlTeardown = null;
let bahamasControlTeardown = null;
let clickHeartsBound = false;
let nycPromptTimer = null;
let nycFollowTeardown = null;
let nycObstacleTeardown = null;
let nycCollisionTeardown = null;
let nycDinnerRunnerTeardown = null;
let mintGameTeardown = null;
let kissRedTeardown = null;
let kissRedOfferTimer = null;
let nycReturnFromWin = false;
let nycFromDinnerNext = false;
let globalMapMenuBindingReady = false;
let headerLockBindingReady = false;
const PURPLE_SLIDES = [
    "assets/img4.jpg",
    "assets/img15.jpg",
    "assets/img1.jpg",
    "assets/img2.jpg",
    "assets/img3.jpg",
    "assets/img5.jpg",
    "assets/img6.jpg",
    "assets/img7.jpg",
    "assets/img8.jpg",
    "assets/img9.jpg",
    "assets/img10.jpg",
    "assets/img11.jpg",
    "assets/img12.jpg",
    "assets/img13.jpg",
    "assets/img14.jpg",
    "assets/vid1.mp4"
];
const MAGENTA_TEXT_STEPS = [
    "NOW THAT WE ARE HOME YOU KNOW WHAT SOUNDS REALLY GOOD?",
    "WHAT?",
    "SHANGHAI DUI"
];
const MAGENTA_FIRST_BUBBLE_IMAGE = "assets/rlly gopod.png";
const MAGENTA_SECOND_BUBBLE_IMAGE = "assets/what.png";
const MAGENTA_THIRD_BUBBLE_IMAGE = "assets/sh dui.png";

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

function loadMintTopScore() {
    const raw = localStorage.getItem(MINT_TOP_SCORE_KEY);
    const parsed = Number.parseInt(raw ?? "0", 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
}

function saveMintTopScore(score) {
    const safe = Math.max(0, Math.floor(Number(score) || 0));
    localStorage.setItem(MINT_TOP_SCORE_KEY, String(safe));
}

function defaultState() {
    return {
        screen: "home", // home | customize | map | shelf | note | computer | planeClip | nycRoom | nycDinner | nycAfterDinner | afterDinnerHall | memoriesPink | memoriesBlue | bahamasHotel | yellowScreen | orangeScreen | violetScreen | blueScreen | greenScreen | kissRedScreen | kissPinkScreen | kissGreyScreen | capcutScreen | creditsScreen | redScreen | blackScreen | brownScreen | greyScreen | silverScreen | purpleScreen | magentaScreen | goldenScreen | mintRoom
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
    if (screen !== "bahamasHotel" && bahamasControlTeardown != null) {
        bahamasControlTeardown();
        bahamasControlTeardown = null;
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
    if (screen !== "mintRoom" && mintGameTeardown != null) {
        mintGameTeardown();
        mintGameTeardown = null;
    }
    if (screen !== "kissRedScreen" && kissRedTeardown != null) {
        kissRedTeardown();
        kissRedTeardown = null;
    }
    if (screen !== "kissRedScreen" && kissRedOfferTimer != null) {
        clearTimeout(kissRedOfferTimer);
        kissRedOfferTimer = null;
    }
    state.screen = screen;
    if (screen !== "nycRoom") {
        nycFromDinnerNext = false;
    }
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
    spawnTimer = setInterval(spawnObstacle, 900);

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
        thrower,
        obstacleLayer,
        scoreEl,
        currentScoreEl,
        bestScoreEl,
        gameOverOverlay,
        restartBtn
    } = config;
    if (
        stage == null
        || player == null
        || obstacleLayer == null
        || scoreEl == null
        || currentScoreEl == null
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
    const jumpVelocity = -1240;
    const playerBaseBottom = 24;
    const playerHeightPx = 320;
    const baseRunSpeed = 520;
    const runSpeedGain = 54;
    const maxRunSpeed = 1460;

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
        const steps = Math.floor(elapsed / 0.8);
        const nextDelay = Math.max(80, 320 - (steps * 85));
        spawnTimeout = window.setTimeout(() => {
            spawnTimeout = null;
            spawnObstacle();
        }, nextDelay);
    };

    const spawnObstacle = (startX = null, sizeScale = 1) => {
        if (!running || gameOver || !obstacleLayer.isConnected) return;
        if (obstacles.size > 1) {
            scheduleNextSpawn();
            return;
        }

        const obstacle = document.createElement("div");
        obstacle.className = "nycDinnerRunnerObstacle";
        const variant = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        obstacle.classList.add(variant);
        const laneBottom = 24 + (Math.random() * 16);
        const baseSize = 90 + (Math.random() * 56);
        const size = Math.max(84, Math.min(154, baseSize * sizeScale));
        let spawnX = startX;
        if (spawnX == null) {
            if (thrower != null && thrower.isConnected) {
                const stageRect = stage.getBoundingClientRect();
                const throwerRect = thrower.getBoundingClientRect();
                const suggestedX = (throwerRect.left - stageRect.left) - (size + 22 + (Math.random() * 34));
                const minSpawnX = stage.clientWidth * 0.46;
                spawnX = Math.max(minSpawnX, suggestedX);
            } else {
                spawnX = stage.clientWidth + 130 + (Math.random() * 70);
            }
        }
        obstacle.dataset.x = `${spawnX}`;
        obstacle.style.left = `${spawnX}px`;
        obstacle.style.bottom = `${laneBottom}px`;
        obstacle.style.width = `${size.toFixed(1)}px`;
        obstacle.style.height = `${size.toFixed(1)}px`;
        obstacleLayer.appendChild(obstacle);
        obstacles.add(obstacle);
        scheduleNextSpawn();
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
        currentScoreEl.textContent = `Current Score: ${finalScore}`;
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
    currentScoreEl.textContent = "Current Score: 0";
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
            heart.textContent = "\u2665";

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
        <button type="button" class="btn secondary" id="gameMapBtn" data-open-map-menu="1" onclick="window.__openGameMapMenu && window.__openGameMapMenu()" aria-label="Open game map">Map</button>
        <button type="button" class="btn secondary" id="homeBtn">Back to Start</button>
      </div>
    </div>
  `;
}

function mountHomeButton() {
    const homeBtn = document.getElementById("homeBtn");
    if (homeBtn != null) {
        homeBtn.onclick = () => go("home");
    }
    const gameMapBtn = document.getElementById("gameMapBtn");
    if (gameMapBtn != null) {
        gameMapBtn.onpointerdown = (e) => {
            e.preventDefault();
            showGameMapMenu();
        };
        gameMapBtn.onclick = () => showGameMapMenu();
    }
    applyLockedHeaderPosition();
}

function applyLockedHeaderPosition() {
    const header = document.querySelector("#app .header");
    if (header == null) return;
    const sceneWidth = 1536;
    const sceneHeight = 864;
    const scale = Math.min(window.innerWidth / sceneWidth, window.innerHeight / sceneHeight);
    const offsetX = Math.max(0, (window.innerWidth - (sceneWidth * scale)) / 2);
    const offsetY = Math.max(0, (window.innerHeight - (sceneHeight * scale)) / 2);

    header.style.position = "fixed";
    header.style.left = "auto";
    header.style.right = `${offsetX + 705}px`;
    header.style.top = `${offsetY + 405}px`;
    header.style.width = "auto";
    header.style.margin = "0";
    header.style.zIndex = "9800";
    header.style.display = "block";
    header.style.pointerEvents = "auto";

    const headerActions = header.querySelector(".headerActions");
    if (headerActions != null) {
        headerActions.style.marginLeft = "0";
        headerActions.style.pointerEvents = "auto";
    }
}

function ensureHeaderLockBinding() {
    if (headerLockBindingReady) return;
    headerLockBindingReady = true;
    window.addEventListener("resize", applyLockedHeaderPosition);
}

function showGameMapMenu() {
    const existing = document.getElementById("gameMapOverlay");
    if (existing != null) {
        existing.remove();
    }

    const destinations = [
        { screen: "map", label: "Map Room", hint: "Main room hub" },
        { screen: "creditsScreen", label: "Credits", hint: "Open the credits and gift scene" },
        { screen: "bahamasHotel", label: "Hotel", hint: "Go to hotel background scene" },
        { screen: "computer", label: "Computer Game", hint: "Open love bug hunt room" },
        { screen: "nycRoom", label: "NYC Walk Game", hint: "Dodge obstacles scene" },
        { screen: "nycDinner", label: "Restaurant Jump Game", hint: "Runner/jump restaurant game" },
        { screen: "mintRoom", label: "Basketball Game", hint: "Catch the falling basketballs" },
        { screen: "greenScreen", label: "Disney Game", hint: "Disney conversation and love bug game" },
        { screen: "violetScreen", label: "Kiss Cam", hint: "Kiss cam arena screen" },
        { screen: "afterDinnerHall", label: "NYC Memories", hint: "Romantic hallway memory scene" },
        { screen: "brownScreen", label: "sea", hint: "Sea ending screen" }
    ];

    const overlay = document.createElement("div");
    overlay.className = "gameMapOverlay";
    overlay.id = "gameMapOverlay";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "2147483646";
    overlay.style.display = "grid";
    overlay.style.placeItems = "center";
    overlay.style.padding = "18px";
    overlay.style.background = "rgba(0, 0, 0, 0.58)";
    overlay.innerHTML = `
    <div class="gameMapModal" role="dialog" aria-modal="true" aria-label="Game map menu">
      <div class="gameMapTitle">Choose a Game Room</div>
      <div class="gameMapGrid">
        ${destinations.map((dest) => `
          <button class="gameMapItemBtn" data-screen="${dest.screen}">
            <span class="gameMapItemLabel">${dest.label}</span>
            <span class="gameMapItemHint">${dest.hint}</span>
          </button>
        `).join("")}
      </div>
      <button class="gameMapCloseBtn" id="gameMapCloseBtn" aria-label="Close game map">Close</button>
    </div>
  `;

    const closeMenu = () => {
        if (overlay.isConnected) overlay.remove();
    };

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeMenu();
    });

    document.body.appendChild(overlay);

    const modal = overlay.querySelector(".gameMapModal");
    if (modal != null) {
        modal.style.width = "min(860px, 96vw)";
        modal.style.maxHeight = "min(82dvh, 760px)";
        modal.style.overflow = "auto";
    }

    const closeBtn = overlay.querySelector("#gameMapCloseBtn");
    if (closeBtn != null) closeBtn.onclick = closeMenu;

    overlay.querySelectorAll(".gameMapItemBtn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.screen;
            closeMenu();
            if (typeof target === "string" && target.length > 0) {
                go(target);
            }
        });
    });
}

function mountGlobalMapButton() {
    let floatingMapBtn = document.getElementById("floatingMapBtn");
    if (floatingMapBtn == null) {
        floatingMapBtn = document.createElement("button");
        floatingMapBtn.id = "floatingMapBtn";
        floatingMapBtn.className = "floatingMapBtn";
        floatingMapBtn.setAttribute("aria-label", "Open game map");
        floatingMapBtn.textContent = "Map";
        document.body.appendChild(floatingMapBtn);
    }
    floatingMapBtn.onpointerdown = (e) => {
        e.preventDefault();
        showGameMapMenu();
    };
    floatingMapBtn.onclick = () => showGameMapMenu();
}

window.__openGameMapMenu = showGameMapMenu;

function ensureGlobalMapMenuBinding() {
    if (globalMapMenuBindingReady) return;
    globalMapMenuBindingReady = true;
    const onMapTrigger = (e) => {
        const target = e.target;
        if (!(target instanceof Element)) return;
        const mapTrigger = target.closest('[data-open-map-menu="1"], #floatingMapBtn');
        if (mapTrigger == null) return;
        showGameMapMenu();
    };
    document.addEventListener("pointerdown", onMapTrigger, true);
    document.addEventListener("click", onMapTrigger, true);
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

function screenNycRoom(useHungryPrompt = false, usePostDinnerPrompt = false) {
    let nycBubbleSrc = useHungryPrompt ? "assets/im hungry text.png" : "assets/lets go for a walk text.png";
    let nycBubbleAlt = useHungryPrompt
        ? "baby im hungry can we eat now? Theres a restaurant i want to go to"
        : "Baby lets go for a walk first";
    let nycBubbleFallbackSrc = useHungryPrompt
        ? "assets/im hungry text.png"
        : "assets/lets go for a walk text.png";
    if (usePostDinnerPrompt) {
        nycBubbleSrc = "assets/aftr res 1.png";
        nycBubbleAlt = "Seems the love bug got away again :(";
        nycBubbleFallbackSrc = "assets/aftr res 1.png";
    }
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
        <img
          class="nycWinSignImage"
          id="nycWinSignImage"
          src="assets/walk win sign.png"
          data-fallback-src="assets/protect congrats.png"
          alt="Walk game win sign"
        >
        <div class="nycOverlayBtnRow">
          <button class="nycWinPlayAgainBtn" id="nycWinPlayAgainBtn">Play Again</button>
          <button class="nycWinBackBtn" id="nycWinBackBtn">Next</button>
        </div>
      </div>
      <div class="nycGameOverOverlay" id="nycGameOverOverlay" hidden>
        <div class="nycGameOverSign">&#19981;&#20445;&#25252;&#25105;</div>
        <div class="nycOverlayBtnRow">
          <button class="nycPlayAgainBtn" id="nycPlayAgainBtn">Try Again</button>
        </div>
      </div>
      <img class="nycCouple" src="assets/ccwithme.png" alt="Couple">
      ${usePostDinnerPrompt ? `
      <div class="nycPostDinnerSummary" id="nycPostDinnerSummary">
        We havent caught the love bug yet but we got very close and most importantly we made many memories along the way
      </div>
      ` : ""}
      <div class="nycWalkBubble" id="nycWalkBubble" hidden>
        <img src="${nycBubbleSrc}" data-fallback-src="${nycBubbleFallbackSrc}" alt="${nycBubbleAlt}">
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
      <button class="heartNextBtn nycDinnerOkBtn" id="nycDinnerOkBtn" aria-label="Next">Next</button>
      <div class="nycDinnerGameIntro" id="nycDinnerGameIntro" hidden>
        <img class="nycDinnerGameSign" src="assets/restaurant_sign_transparent.png" alt="Restaurant game sign">
        <button class="nycDinnerStartBtn" id="nycDinnerStartBtn" aria-label="Start">JUMP</button>
      </div>
      <div class="nycDinnerRunner" id="nycDinnerRunner" hidden>
        <div class="nycDinnerRunnerHud">Score: <span id="nycDinnerRunnerScore">0</span></div>
        <div class="nycDinnerRunnerObstacleLayer" id="nycDinnerRunnerObstacleLayer"></div>
        <img
          class="nycDinnerRunnerThrower"
          id="nycDinnerRunnerThrower"
          src="assets/throw plates.png"
          data-fallback-src="assets/love bug.png"
          alt="Throwing character"
        >
        <img class="nycDinnerRunnerPlayer" id="nycDinnerRunnerPlayer" src="assets/restaurant-runner.png" data-fallback-src="assets/ccalone.png" alt="Runner character">
        <div class="nycDinnerRunnerGameOver" id="nycDinnerRunnerGameOver" hidden>
          <div class="nycDinnerRunnerGameOverText">Game Over</div>
          <div class="nycDinnerRunnerScoreCompare">
            <div class="nycDinnerRunnerCurrentScore" id="nycDinnerRunnerCurrentScore">Current Score: 0</div>
            <div class="nycDinnerRunnerBestScore" id="nycDinnerRunnerBestScore">Top Score: 0</div>
          </div>
          <div class="nycDinnerRunnerBtnRow">
            <button class="nycDinnerRunnerRestartBtn" id="nycDinnerRunnerRestartBtn">Play Again</button>
            <button class="nycDinnerRunnerNextBtn" id="nycDinnerRunnerNextBtn">Next</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function screenNycAfterDinner() {
    return `
    ${headerTitle()}
    <div class="nycAfterDinnerStage" id="nycAfterDinnerStage" aria-label="NYC post dinner view">
      <img
        class="nycAfterDinnerBubble"
        id="nycAfterDinnerBubble"
        src="assets/after-restaurant-bubble.png"
        data-fallback-src="assets/aftr res 1.png"
        data-bubble-step="1"
        alt="Seems the love bug got away again"
      >
      <img
        class="nycAfterDinnerCouple"
        id="nycAfterDinnerCouple"
        src="assets/after-restaurant-couple.png"
        data-fallback-src="assets/ccwithme.png"
        alt="Couple in NYC after dinner"
      >
      <button class="heartNextBtn nycAfterDinnerNextBtn" id="nycAfterDinnerNextBtn" aria-label="Next">Next</button>
      <button class="nycAfterDinnerFinalBtn" id="nycAfterDinnerFinalBtn" aria-label="Continue" hidden></button>
    </div>
  `;
}

function screenAfterDinnerHall() {
    return `
    ${headerTitle()}
    <div class="afterDinnerHallStage" id="afterDinnerHallStage" aria-label="Hallway scene">
      <img
        class="afterDinnerHallBg"
        id="afterDinnerHallBg"
        src="assets/lug trav.jpeg"
        data-fallback-src="assets/after-dinner-hallway.png"
        alt="Romantic hallway scene"
      >
      <div class="afterDinnerHallCaption">
        The love bug is still out there but we made so many wonderful memories
      </div>
      <button class="afterDinnerHallMemoriesBtn" id="afterDinnerHallMemoriesBtn" aria-label="Look at memories">Look at memories</button>
    </div>
  `;
}

function screenMemoriesPink() {
    return `
    ${headerTitle()}
    <div class="memoriesPinkStage" id="memoriesPinkStage" aria-label="Memories video screen">
      <video class="memoriesPinkVideo" autoplay muted loop playsinline>
        <source src="assets/nyc memories.mp4" type="video/mp4">
      </video>
      <button class="memoriesFinishBtn" id="memoriesFinishBtn" aria-label="Finished Looking"></button>
    </div>
  `;
}

function screenMemoriesBlue() {
    return `
    ${headerTitle()}
    <div class="memoriesBlueStage" id="memoriesBlueStage" aria-label="Blue ending screen">
      <div class="memoriesBlueCaption">The next adventure awaits!</div>
      <button class="heartNextBtn memoriesBlueNextBtn" id="memoriesBlueNextBtn" aria-label="Next">Next</button>
    </div>
  `;
}

function screenBahamasHotel() {
    const hotelCharacterSrc = state.characterMode === "alone"
        ? "assets/ccalone.png"
        : "assets/ccwithme.png";
    return `
    ${headerTitle()}
    <div class="bahamasHotelStage" id="bahamasHotelStage" aria-label="Bahamas hotel scene">
      <img
        class="bahamasHotelCharacters"
        id="bahamasHotelCharacters"
        src="${hotelCharacterSrc}"
        data-fallback-src="assets/ccwithme.png"
        alt="Characters at the hotel"
      >
      <div class="bahamasHotelBubble" id="bahamasHotelBubble" aria-label="Hotel speech bubble">
        <img class="bahamasHotelBubbleImg" id="bahamasHotelBubbleImg" src="assets/look where.png" alt="We arrived! Where should we look first?">
      </div>
      <button class="heartNextBtn bahamasBubbleNextBtn" id="bahamasBubbleNextBtn" aria-label="Next speech bubble">Next</button>
      <button class="bahamasConversationEndBtn" id="bahamasConversationEndBtn" aria-label="End conversation" hidden></button>
      <button class="bahamasHotelNextBtn" id="bahamasHotelNextBtn" aria-label="Water park this way" disabled hidden>Water park this way</button>
    </div>
  `;
}

function screenYellowScreen() {
    return `
    ${headerTitle()}
    <div class="yellowScreenStage" id="yellowScreenStage" aria-label="Yellow ending screen">
      <img class="yellowFastPassObject" src="assets/floating.png" alt="" aria-hidden="true">
      <img class="yellowGameLogo" src="assets/picture sign.png" alt="Take a Picture Game">
      <button class="yellowStartGameBtn" id="yellowStartGameBtn" aria-label="Take Picture">Take Picture</button>
      <button class="yellowStopObjectBtn" id="yellowStopObjectBtn" aria-label="Stop moving object"></button>
      <img class="yellowGoodSign" id="yellowGoodSign" src="assets/perfect.png" alt="Perfect picture" hidden>
      <button class="yellowNextBtn" id="yellowNextBtn" aria-label="Next" hidden>Next</button>
      <button class="yellowPlayAgainBtn" id="yellowPlayAgainBtn" aria-label="Play Again" hidden>Play Again</button>
    </div>
  `;
}

function screenOrangeScreen() {
    return `
    ${headerTitle()}
    <div class="orangeScreenStage" id="orangeScreenStage" aria-label="Orange screen">
      <img class="orangeKissCamSign" src="assets/kiss cam.png" alt="Kiss cam message">
      <button class="orangeToPurpleBtn" id="orangeToPurpleBtn" aria-label="what thing?">what thing?</button>
    </div>
  `;
}

function screenVioletScreen() {
    return `
    ${headerTitle()}
    <div class="violetScreenStage" id="violetScreenStage" aria-label="Violet screen">
      <video class="violetKissVideo" autoplay muted loop playsinline>
        <source src="assets/kiss vid.mp4" type="video/mp4">
      </video>
      <button class="violetToPurpleBtn" id="violetToPurpleBtn" aria-label="Next">Next</button>
    </div>
  `;
}

function screenBlueScreen() {
    return `
    ${headerTitle()}
    <div class="blueScreenStage" id="blueScreenStage" aria-label="Blue screen">
      <img class="bluePromptBubble" id="bluePromptBubble" src="assets/wantgo.png" alt="Baby I know we have been doing but there is another place I want to go">
      <button class="heartNextBtn blueToGreenBtn" id="blueToGreenBtn" aria-label="Next">Next</button>
      <button class="blueEndConvoBtn" id="blueEndConvoBtn" aria-label="End conversation" hidden>
        <img src="assets/好的宝宝.png" alt="End conversation">
      </button>
    </div>
  `;
}

function screenGreenScreen() {
    return `
    ${headerTitle()}
    <div class="greenScreenStage" id="greenScreenStage" aria-label="Green screen">
      <img class="greenPromptBubble" id="greenPromptBubble" src="assets/distracted.png" alt="Baby we got distracted and forgot about the love bug">
      <button class="heartNextBtn greenToDisneyBtn" id="greenToDisneyBtn" aria-label="Next">Next</button>
    </div>
  `;
}

function screenKissRedScreen() {
    return `
    ${headerTitle()}
    <div class="kissRedScreenStage" id="kissRedScreenStage" aria-label="Red kiss cam screen">
      <img class="kissRedPromptBubble" id="kissRedPromptBubble" src="assets/couch 1.png" alt="Finally time to rest" hidden>
      <img class="kissRedFindBugSign" id="kissRedFindBugSign" src="assets/findbug.png" alt="Find the bug sign">
      <img class="kissRedHiddenBug" id="kissRedHiddenBug" src="assets/love bug.png" alt="Hidden love bug" hidden>
      <img class="kissRedFoundSign" id="kissRedFoundSign" src="assets/found.png" alt="Found the love bug" hidden>
      <button class="kissRedToPurpleBtn" id="kissRedToPurpleBtn" aria-label="Start">Start</button>
      <div class="kissRedChoiceRow" id="kissRedChoiceRow" hidden>
        <button class="kissRedChoiceBtn" id="kissRedPlayAgainBtn" aria-label="Play Again">Play Again</button>
        <button class="kissRedChoiceBtn" id="kissRedNextBtn" aria-label="Next">Next</button>
      </div>
      <div class="kissRedTimeoutRow" id="kissRedTimeoutRow" hidden>
        <button class="kissRedChoiceBtn" id="kissRedGiveUpBtn" aria-label="Give up">Give up</button>
      </div>
    </div>
  `;
}

function startKissRedClickGame(stage, bugEl, winEl = null, onWin = null) {
    if (stage == null || bugEl == null) return null;

    let running = true;
    let won = false;

    const placeBug = () => {
        const stageWidth = stage.clientWidth || 980;
        const stageHeight = stage.clientHeight || 740;
        const bugSize = Math.max(10, Math.min(20, Math.round(stageWidth * 0.015)));
        const left = Math.max(18, Math.random() * Math.max(18, stageWidth - bugSize - 18));
        const topMin = Math.max(stageHeight * 0.5, 90);
        const topMax = Math.max(topMin + 10, stageHeight - bugSize - 40);
        const top = topMin + (Math.random() * (topMax - topMin));
        bugEl.style.width = `${bugSize}px`;
        bugEl.style.left = `${left}px`;
        bugEl.style.top = `${top}px`;
    };

    const onBugClick = () => {
        if (!running || won) return;
        won = true;
        if (winEl != null) winEl.hidden = false;
        if (typeof onWin === "function") onWin();
    };

    if (winEl != null) winEl.hidden = true;
    bugEl.hidden = false;
    placeBug();
    bugEl.addEventListener("click", onBugClick);

    return () => {
        if (!running) return;
        running = false;
        bugEl.removeEventListener("click", onBugClick);
    };
}

function screenRedScreen() {
    const redCharacterSrc = state.characterMode === "alone"
        ? "assets/ccalone.png"
        : "assets/ccwithme.png";
    return `
    ${headerTitle()}
    <div class="redScreenStage" id="redScreenStage" aria-label="Red screen">
      <img
        class="redScreenCharacter"
        id="redScreenCharacter"
        src="${redCharacterSrc}"
        data-fallback-src="assets/ccwithme.png"
        alt="Characters at the hotel"
      >
      <div class="redThoughtBubble" id="redThoughtBubble" aria-label="Thought bubble">
        <img class="redThoughtBubbleImg" id="redThoughtBubbleImg" src="assets/Happy day.png" alt="What a happy day!">
      </div>
      <button class="heartNextBtn redThoughtNextBtn" id="redThoughtNextBtn" aria-label="Next thought bubble">Next</button>
      <button class="redFinalImageBtn" id="redFinalImageBtn" aria-label="Continue" hidden>
        <img src="assets/好的宝宝.png" alt="Continue">
      </button>
    </div>
  `;
}

function screenKissPinkScreen() {
    return `
    ${headerTitle()}
    <div class="kissPinkScreenStage" id="kissPinkScreenStage" aria-label="Pink celebration screen">
      <img class="kissPinkBubbleImg" id="kissPinkBubbleImg" src="assets/cought.png" alt="We finally caught the love bug">
      <button class="heartNextBtn kissPinkToPurpleBtn" id="kissPinkToPurpleBtn" aria-label="Next">Next</button>
      <button class="kissPinkEndBtn" id="kissPinkEndBtn" aria-label="End conversation" hidden>
        <img src="assets/好的宝宝.png" alt="End conversation">
      </button>
    </div>
  `;
}

function screenKissGreyScreen() {
    return `
    ${headerTitle()}
    <div class="kissGreyScreenStage" id="kissGreyScreenStage" aria-label="Grey screen">
      <div class="kissGreyCenterBox" id="kissGreyCenterBox" aria-hidden="true"></div>
      <img class="kissGreyStartMovieImg" id="kissGreyStartMovieImg" src="assets/startmovie.png" alt="Start movie" hidden>
      <button class="kissGreyStartMovieBtn" id="kissGreyStartMovieBtn" aria-label="Start movie" hidden>
        <img class="kissGreyStartMovieBtnImg" src="assets/startmv.png" alt="Start movie">
      </button>
      <img class="kissGreyBubbleImg first" id="kissGreyBubbleImg" src="assets/couch 1.png" alt="Finally time to rest">
      <img class="kissGreyQuestionImg" id="kissGreyQuestionText" src="assets/missing.png" alt="who is missing?" hidden>
      <div class="kissGreyAnswerBox" id="kissGreyAnswerBox" hidden>
        <input
          class="kissGreyAnswerInput"
          id="kissGreyAnswerInput"
          type="text"
          autocomplete="off"
          spellcheck="false"
          placeholder="type answer"
          aria-label="Type who is missing"
        >
        <div class="kissGreyAnswerError" id="kissGreyAnswerError" hidden>try again</div>
      </div>
      <div class="kissGreyKiwiPickup" id="kissGreyKiwiPickup" hidden>
        <img class="kissGreyKiwiImg" id="kissGreyKiwiImg" src="assets/kiwi.png" alt="Kiwi revealed">
        <button class="kissGreyTakeBtn" id="kissGreyTakeBtn" aria-label="Take kiwi">take</button>
      </div>
      <button class="heartNextBtn kissGreyNextBtn" id="kissGreyNextBtn" aria-label="Next">Next</button>
    </div>
  `;
}

function screenCapcutScreen() {
    return `
    ${headerTitle()}
    <div class="brownScreenStage" id="capcutScreenStage" aria-label="CapCut movie screen">
      <video class="brownScreenVideo" id="capcutScreenVideo" autoplay controls playsinline>
        <source src="assets/capcut.mp4" type="video/mp4">
      </video>
    </div>
  `;
}

function screenCreditsScreen() {
    return `
    ${headerTitle()}
    <div class="blackScreenStage" id="creditsScreenStage" aria-label="Credits screen">
      <div class="creditsBody">
        <p>In such a short time, we’ve already made so many memories. The love bug showed up early… and now that it bit me, love will never disappear.</p>
        <p>It won’t fade when things get busy. It won’t vanish when days get hard. It stays. It grows. It lives in the little moments and the big ones—in the laughter, the quiet, and that feeling of being close to you that makes everything softer.</p>
        <p>So yeah—short time, so many memories… and so many more to come. Because now that the love bug got me, this love isn’t going anywhere. Not with you. Not ever.</p>
        <p>And there is one more gift waiting for you.</p>
      </div>
      <button class="creditsContinueBtn" id="creditsContinueBtn" aria-label="Open gift"></button>
      <div class="creditsGiftLabel" aria-hidden="true">open gift</div>
    </div>
  `;
}

function screenBlackScreen() {
    return `
    ${headerTitle()}
    <div class="blackScreenStage" id="blackScreenStage" aria-label="Black screen">
      <img
        class="blackScreenEndingImg"
        src="assets/sleep.png"
        data-fallback-src="assets/好的宝宝.png"
        alt="Ending image"
      >
      <div class="blackTomorrowHint">take a rest if you need to baby</div>
      <button class="blackTomorrowBtn" id="blackTomorrowBtn" aria-label="Tomorrow">Tomorrow</button>
    </div>
  `;
}

function screenBrownScreen() {
    return `
    ${headerTitle()}
    <div class="brownScreenStage" id="brownScreenStage" aria-label="Sea screen">
      <video class="brownScreenVideo" id="brownScreenVideo" autoplay muted playsinline>
        <source src="assets/sea video.mp4" type="video/mp4">
      </video>
    </div>
  `;
}

function screenGreyScreen() {
    const greyCharacterSrc = state.characterMode === "alone"
        ? "assets/ccalone.png"
        : "assets/ccwithme.png";
    return `
    ${headerTitle()}
    <div class="greyScreenStage" id="greyScreenStage" aria-label="Hotel screen">
      <img
        class="greyScreenCharacter"
        id="greyScreenCharacter"
        src="${greyCharacterSrc}"
        data-fallback-src="assets/ccwithme.png"
        alt="Characters at the hotel"
      >
      <img class="greyBugOutImg" src="assets/bug out.png" alt="Bug out scene">
      <button class="greyPurpleBtn" id="greyPurpleBtn" aria-label="Continue to purple screen">
        <img src="assets/好的宝宝.png" alt="Continue">
      </button>
    </div>
  `;
}

function screenPurpleScreen() {
    const firstSlide = PURPLE_SLIDES[0] ?? "assets/park.jpeg";
    return `
    ${headerTitle()}
    <div class="purpleScreenStage" id="purpleScreenStage" aria-label="Purple screen slideshow">
      <img class="purpleSlideImg" id="purpleSlideImg" src="${firstSlide}" alt="Memory picture">
      <video class="purpleSlideVideo" id="purpleSlideVideo" playsinline controls hidden></video>
      <button class="purpleSlidePrevBtn" id="purpleSlidePrevBtn" aria-label="Previous picture">&lt;</button>
      <button class="purpleSlideNextBtn" id="purpleSlideNextBtn" aria-label="Next picture">&gt;</button>
      <button class="purpleFinishBtn" id="purpleFinishBtn" aria-label="Finished">Finished</button>
    </div>
  `;
}

function screenSilverScreen() {
    return `
    ${headerTitle()}
    <div class="silverScreenStage" id="silverScreenStage" aria-label="Silver screen">
      <img class="silverScreenMemoryImg" src="assets/membaha.png" alt="We made so many memories!">
      <button class="silverToPurpleBtn" id="silverToPurpleBtn" aria-label="take a look">take a look</button>
    </div>
  `;
}

function screenMagentaScreen() {
    return `
    ${headerTitle()}
    <div class="magentaScreenStage" id="magentaScreenStage" aria-label="Magenta screen">
      <div class="magentaTextBubble" id="magentaTextBubble">NOW THAT WE ARE HOME YOU KNOW WHAT SOUNDS REALLY GOOD?</div>
      <button class="heartNextBtn magentaNextBtn" id="magentaNextBtn" aria-label="Next">Next</button>
      <button class="magentaEndBtn" id="magentaEndBtn" aria-label="End conversation" hidden>
        <img src="assets/好的宝宝.png" alt="End conversation">
      </button>
    </div>
  `;
}

function screenGoldenScreen() {
    return `
    ${headerTitle()}
    <div class="goldenScreenStage" id="goldenScreenStage" aria-label="Golden screen">
      <img class="goldenSpeechBubble" src="assets/sht.png" alt="Baby I really want to see you shoot some basketballs">
      <button class="goldenLavenderBtn" id="goldenLavenderBtn" aria-label="Go to mint room">
        <img src="assets/好的宝宝.png" alt="Continue">
      </button>
    </div>
  `;
}

function screenMintRoom() {
    return `
    ${headerTitle()}
    <div class="mintRoomStage" id="mintRoomStage" aria-label="Mint color room">
      <div class="mintFallingLayer" id="mintFallingLayer" aria-hidden="true"></div>
      <div class="mintScoreHud" id="mintScoreHud" aria-label="Objects caught" hidden>Caught: 0</div>
      <div class="mintLivesHud" id="mintLivesHud" aria-label="Lives remaining" hidden>
        <span class="mintLifeHeart" aria-hidden="true">♥</span>
        <span class="mintLifeHeart" aria-hidden="true">♥</span>
        <span class="mintLifeHeart" aria-hidden="true">♥</span>
      </div>
      <img
        class="mintHoop"
        id="mintHoop"
        src="assets/vbasketball hoop.png"
        data-fallback-src="assets/basketball-hoops.webp"
        alt="Basketball hoop"
        hidden
      >
      <img class="mintGameSign" id="mintGameSign" src="assets/bsk gm.png" alt="Basketball game sign">
      <div class="mintGameOverSign" id="mintGameOverSign" hidden>Game Over</div>
      <button class="mintGameStartBtn" id="mintGameStartBtn" aria-label="Start basketball game">Start</button>
      <button class="mintGameNextBtn" id="mintGameNextBtn" aria-label="Go to lily colors screen" hidden>Next</button>
    </div>
  `;
}

function startMintFallingGame(stage, layer, hoop, onGameOver = null, onMiss = null, onCatch = null) {
    if (stage == null || layer == null || hoop == null) return null;

    let running = true;
    let frameId = 0;
    let spawnTimer = null;
    let speedTimer = null;
    let lastTs = 0;
    let missedCount = 0;
    let caughtCount = 0;
    const maxMisses = 3;
    let cleanedUp = false;

    let spawnIntervalMs = 420;
    let fallSpeedMultiplier = 1.25;
    const minSpawnIntervalMs = 95;
    const objects = [];
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    let hoopCenterX = stage.clientWidth * 0.5;

    const updateHoopX = () => {
        const hoopWidth = hoop.offsetWidth || 240;
        const maxLeft = Math.max(0, stage.clientWidth - hoopWidth);
        const left = clamp(hoopCenterX - (hoopWidth * 0.5), 0, maxLeft);
        hoop.style.left = `${left}px`;
    };

    const moveHoopToClientX = (clientX) => {
        const rect = stage.getBoundingClientRect();
        hoopCenterX = clamp(clientX - rect.left, 0, rect.width);
        updateHoopX();
    };

    const onPointerMove = (e) => moveHoopToClientX(e.clientX);
    const onTouchMove = (e) => {
        if (e.touches.length < 1) return;
        moveHoopToClientX(e.touches[0].clientX);
    };
    const onKeyDown = (e) => {
        if (e.key === "ArrowLeft") {
            hoopCenterX -= 42;
            updateHoopX();
        } else if (e.key === "ArrowRight") {
            hoopCenterX += 42;
            updateHoopX();
        }
    };
    const onResize = () => updateHoopX();

    const spawnObject = () => {
        if (!running || !layer.isConnected) return;
        if (objects.length > 0) return;

        const obj = document.createElement("div");
        obj.className = "mintFallingObject";
        const size = 86 + Math.random() * 64;
        const absoluteMaxX = Math.max(0, stage.clientWidth - size);
        const sideInset = Math.min(absoluteMaxX * 0.35, 120);
        const minX = Math.min(sideInset, absoluteMaxX);
        const maxX = Math.max(minX, absoluteMaxX - sideInset);
        const x = minX + (Math.random() * (maxX - minX));
        const y = -(size + 8);
        const vy = 220 + Math.random() * 170;

        obj.style.width = `${size}px`;
        obj.style.height = `${size}px`;
        obj.style.left = `${x}px`;
        obj.style.top = `${y}px`;
        layer.appendChild(obj);
        objects.push({ el: obj, x, y, vy, size });
    };

    const scheduleSpawn = () => {
        if (!running) return;
        spawnTimer = window.setTimeout(() => {
            spawnTimer = null;
            if (objects.length === 0) spawnObject();
            scheduleSpawn();
        }, spawnIntervalMs);
    };

    const speedUp = () => {
        spawnIntervalMs = Math.max(minSpawnIntervalMs, spawnIntervalMs - 42);
        fallSpeedMultiplier = Math.min(3.8, fallSpeedMultiplier + 0.11);
    };

    const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (spawnTimer != null) {
            clearTimeout(spawnTimer);
            spawnTimer = null;
        }
        if (speedTimer != null) {
            clearInterval(speedTimer);
            speedTimer = null;
        }
        cancelAnimationFrame(frameId);
        for (const obj of objects) {
            if (obj.el.isConnected) obj.el.remove();
        }
        objects.length = 0;
        stage.removeEventListener("pointermove", onPointerMove);
        stage.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("resize", onResize);
    };

    const endAsGameOver = () => {
        if (!running) return;
        running = false;
        cleanup();
        if (typeof onGameOver === "function") {
            onGameOver({
                missedCount,
                maxMisses,
                caughtCount
            });
        }
    };

    const frame = (ts) => {
        if (!running) return;
        if (lastTs === 0) lastTs = ts;
        const dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;
        const maxY = stage.clientHeight + 60;
        const hoopLeft = hoop.offsetLeft;
        const hoopTop = hoop.offsetTop;
        const hoopWidth = hoop.offsetWidth;
        const hoopHeight = hoop.offsetHeight;
        const catchLeft = hoopLeft + (hoopWidth * 0.26);
        const catchRight = hoopLeft + (hoopWidth * 0.74);
        const catchTop = hoopTop + (hoopHeight * 0.14);
        const catchBottom = hoopTop + (hoopHeight * 0.43);

        for (let i = objects.length - 1; i >= 0; i -= 1) {
            const obj = objects[i];
            obj.y += obj.vy * fallSpeedMultiplier * dt;
            const centerX = obj.x + (obj.size * 0.5);
            const centerY = obj.y + (obj.size * 0.5);
            const isCaught = centerX >= catchLeft
                && centerX <= catchRight
                && centerY >= catchTop
                && centerY <= catchBottom;
            if (isCaught) {
                if (obj.el.isConnected) obj.el.remove();
                objects.splice(i, 1);
                caughtCount += 1;
                if (typeof onCatch === "function") onCatch(caughtCount);
                continue;
            }
            if (obj.y > maxY) {
                if (obj.el.isConnected) obj.el.remove();
                objects.splice(i, 1);
                missedCount += 1;
                if (typeof onMiss === "function") onMiss(missedCount, maxMisses);
                if (missedCount >= maxMisses) {
                    endAsGameOver();
                    return;
                }
                continue;
            }
            obj.el.style.top = `${obj.y}px`;
        }

        frameId = requestAnimationFrame(frame);
    };

    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    updateHoopX();
    scheduleSpawn();
    speedTimer = window.setInterval(speedUp, 500);
    frameId = requestAnimationFrame(frame);

    return () => {
        running = false;
        cleanup();
    };
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
          background:transparent url('assets/%E5%A5%BD%E7%9A%84%E5%AE%9D%E5%AE%9D.png') center center no-repeat;
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
      <div class="noteMessage">I made this game<br>for you my love!<br>Now lets go explore!<br>&hearts;</div>
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
      <button class="backRoomBtn" id="backRoomBtn">Back to Room</button>
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
    const hotelBtn = document.getElementById("hotelBtn");
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

    function inHotelZone() {
        const cx = pos.x + (char.offsetWidth * 0.5);
        const cy = pos.y + (char.offsetHeight * 0.72);
        const zone = {
            left: stage.clientWidth * 0.58,
            right: stage.clientWidth * 0.82,
            top: stage.clientHeight * 0.08,
            bottom: stage.clientHeight * 0.42
        };
        return cx >= zone.left && cx <= zone.right && cy >= zone.top && cy <= zone.bottom;
    }

    function updateHotelPrompt() {
        if (hotelBtn == null) return;
        hotelBtn.classList.add("show");
    }

    function draw() {
        char.style.left = pos.x + "px";
        char.style.top = pos.y + "px";
        updateIntroBubblePosition();
        updateShelfPrompt();
        updateComputerPrompt();
        updateHotelPrompt();
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
        if (hotelBtn != null) hotelBtn.onclick = null;
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

    if (hotelBtn != null) {
        hotelBtn.onclick = () => {
            persistMapPose(true);
            go("bahamasHotel");
        };
    }

    requestAnimationFrame(frame);
    mapControlTeardown = teardown;
}

function startBahamasCharacterControl(stage, char, canMove = null) {
    if (stage == null || char == null) return null;

    const keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    const speed = 320;
    let running = true;
    let frameId = 0;
    let lastTime = performance.now();

    const computed = window.getComputedStyle(char);
    let x = Number.parseFloat(computed.left);
    let bottom = Number.parseFloat(computed.bottom);
    if (!Number.isFinite(x)) x = stage.clientWidth * 0.24;
    if (!Number.isFinite(bottom)) bottom = 12;

    function clamp() {
        const halfWidth = char.offsetWidth * 0.5;
        const maxBottom = Math.max(0, stage.clientHeight - char.offsetHeight);
        x = Math.max(halfWidth, Math.min(stage.clientWidth - halfWidth, x));
        bottom = Math.max(0, Math.min(maxBottom, bottom));
    }

    function draw() {
        char.style.left = `${x}px`;
        char.style.bottom = `${bottom}px`;
    }

    function onKeyDown(e) {
        if (!Object.prototype.hasOwnProperty.call(keys, e.key)) return;
        e.preventDefault();
        keys[e.key] = true;
    }

    function onKeyUp(e) {
        if (!Object.prototype.hasOwnProperty.call(keys, e.key)) return;
        keys[e.key] = false;
    }

    function onResize() {
        clamp();
        draw();
    }

    function frame(now) {
        if (!running) return;
        if (state.screen !== "bahamasHotel") return;

        if (typeof canMove === "function" && canMove() !== true) {
            frameId = requestAnimationFrame(frame);
            return;
        }

        const dt = Math.min(0.03, (now - lastTime) / 1000);
        lastTime = now;
        let dx = 0;
        let dy = 0;
        if (keys.ArrowLeft) dx -= 1;
        if (keys.ArrowRight) dx += 1;
        if (keys.ArrowUp) dy += 1;
        if (keys.ArrowDown) dy -= 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.hypot(dx, dy) || 1;
            x += (dx / length) * speed * dt;
            bottom += (dy / length) * speed * dt;
            clamp();
            draw();
            const rightEdgeX = x + (char.offsetWidth * 0.5);
            if (rightEdgeX >= stage.clientWidth - 2) {
                go("yellowScreen");
                return;
            }
        }
        frameId = requestAnimationFrame(frame);
    }

    clamp();
    draw();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);
    frameId = requestAnimationFrame(frame);

    return () => {
        if (!running) return;
        running = false;
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("resize", onResize);
    };
}

function render() {
    ensureGlobalMapMenuBinding();
    ensureHeaderLockBinding();
    mountGlobalMapButton();
    app.classList.toggle("openingMode", state.screen === "home");
    app.classList.toggle("customizeMode", state.screen === "customize");
    app.classList.toggle("mapMode", state.screen === "map");
    app.classList.toggle("shelfMode", state.screen === "shelf");
    app.classList.toggle("noteMode", state.screen === "note");
    app.classList.toggle("computerMode", state.screen === "computer");
    app.classList.toggle("planeClipMode", state.screen === "planeClip");
    app.classList.toggle("nycRoomMode", state.screen === "nycRoom");
    app.classList.toggle("nycDinnerMode", state.screen === "nycDinner");
    app.classList.toggle("nycAfterDinnerMode", state.screen === "nycAfterDinner");
    app.classList.toggle("afterDinnerHallMode", state.screen === "afterDinnerHall");
    app.classList.toggle("memoriesPinkMode", state.screen === "memoriesPink");
    app.classList.toggle("memoriesBlueMode", state.screen === "memoriesBlue");
    app.classList.toggle("bahamasHotelMode", state.screen === "bahamasHotel");
    app.classList.toggle("yellowScreenMode", state.screen === "yellowScreen");
    app.classList.toggle("orangeScreenMode", state.screen === "orangeScreen");
    app.classList.toggle("violetScreenMode", state.screen === "violetScreen");
    app.classList.toggle("blueScreenMode", state.screen === "blueScreen");
    app.classList.toggle("greenScreenMode", state.screen === "greenScreen");
    app.classList.toggle("kissRedScreenMode", state.screen === "kissRedScreen");
    app.classList.toggle("kissPinkScreenMode", state.screen === "kissPinkScreen");
    app.classList.toggle("kissGreyScreenMode", state.screen === "kissGreyScreen");
    app.classList.toggle("redScreenMode", state.screen === "redScreen");
    app.classList.toggle("blackScreenMode", state.screen === "blackScreen" || state.screen === "creditsScreen");
    app.classList.toggle("brownScreenMode", state.screen === "brownScreen" || state.screen === "capcutScreen");
    app.classList.toggle("greyScreenMode", state.screen === "greyScreen");
    app.classList.toggle("silverScreenMode", state.screen === "silverScreen");
    app.classList.toggle("purpleScreenMode", state.screen === "purpleScreen");
    app.classList.toggle("magentaScreenMode", state.screen === "magentaScreen");
    app.classList.toggle("goldenScreenMode", state.screen === "goldenScreen");
    app.classList.toggle("mintRoomMode", state.screen === "mintRoom");

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
        const nycPostDinnerPrompt = nycFromDinnerNext === true;
        app.innerHTML = screenNycRoom(nycArrivalFromWin, nycPostDinnerPrompt);
        nycReturnFromWin = false;
        mountHomeButton();
        const homeBtn = document.getElementById("homeBtn");
        if (nycFromDinnerNext && homeBtn != null) {
            homeBtn.textContent = "Next";
            homeBtn.setAttribute("aria-label", "Next");
            homeBtn.classList.remove("secondary");
            homeBtn.classList.add("heartNextBtn");
            homeBtn.onclick = () => go("nycDinner");
        }
        const nycWalkBubble = document.getElementById("nycWalkBubble");
        const nycWalkOkBtn = document.getElementById("nycWalkOkBtn");
        const nycWalkBubbleImg = nycWalkBubble?.querySelector("img");
        if (nycWalkBubbleImg != null) {
            nycWalkBubbleImg.onerror = () => {
                const fallbackSrc = nycWalkBubbleImg.dataset.fallbackSrc;
                if (fallbackSrc != null && nycWalkBubbleImg.src.indexOf(fallbackSrc) === -1) {
                    nycWalkBubbleImg.src = fallbackSrc;
                }
            };
        }
        const nycRoomStage = document.getElementById("nycRoomStage");
        const nycGameBgVideo = document.getElementById("nycGameBgVideo");
        const nycAvoidHud = document.getElementById("nycAvoidHud");
        const nycAvoidCount = document.getElementById("nycAvoidCount");
        const nycObstacleLayer = document.getElementById("nycObstacleLayer");
        const nycWinOverlay = document.getElementById("nycWinOverlay");
        const nycWinSignImage = document.getElementById("nycWinSignImage");
        const nycWinPlayAgainBtn = document.getElementById("nycWinPlayAgainBtn");
        const nycWinBackBtn = document.getElementById("nycWinBackBtn");
        const nycGameOverOverlay = document.getElementById("nycGameOverOverlay");
        const nycPlayAgainBtn = document.getElementById("nycPlayAgainBtn");
        const nycCouple = document.querySelector(".nycCouple");
        const nycStartSign = document.getElementById("nycStartSign");
        const nycStartBtn = document.getElementById("nycStartBtn");
        if (nycWinSignImage != null) {
            nycWinSignImage.onerror = () => {
                const fallbackSrc = nycWinSignImage.dataset.fallbackSrc;
                if (fallbackSrc != null && nycWinSignImage.src.indexOf(fallbackSrc) === -1) {
                    nycWinSignImage.src = fallbackSrc;
                }
            };
        }
        if (nycPostDinnerPrompt) {
            if (nycStartSign != null) nycStartSign.hidden = true;
            if (nycStartBtn != null) nycStartBtn.hidden = true;
            if (nycWalkBubble != null) nycWalkBubble.hidden = false;
            if (nycWalkOkBtn != null) {
                nycWalkOkBtn.hidden = false;
                nycWalkOkBtn.setAttribute("aria-label", "Next");
                nycWalkOkBtn.classList.remove("postDinnerFinal");
            }
            if (nycWalkBubbleImg != null && nycWalkOkBtn != null) {
                const postDinnerBubbleTwoSrc = "assets/tickets text.png";
                const postDinnerBubbleThreeSrc = "assets/lets go bahamas text.png";
                let postDinnerStep = 0;
                nycWalkOkBtn.onclick = () => {
                    if (postDinnerStep === 0) {
                        postDinnerStep = 1;
                        nycWalkBubbleImg.src = postDinnerBubbleTwoSrc;
                        nycWalkBubbleImg.dataset.fallbackSrc = postDinnerBubbleTwoSrc;
                        nycWalkBubbleImg.alt = "But I saw it had tickets for the Bahamas in its hand.";
                        return;
                    }
                    if (postDinnerStep === 1) {
                        postDinnerStep = 2;
                        nycWalkBubbleImg.src = postDinnerBubbleThreeSrc;
                        nycWalkBubbleImg.dataset.fallbackSrc = postDinnerBubbleThreeSrc;
                        nycWalkBubbleImg.alt = "Maybe we should head there too?";
                        nycWalkOkBtn.classList.add("postDinnerFinal");
                        return;
                    }
                    nycWalkBubble.hidden = true;
                    nycWalkOkBtn.hidden = true;
                    nycWalkOkBtn.classList.remove("postDinnerFinal");
                };
            }
            return;
        }
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
                        if (nycWinPlayAgainBtn != null) nycWinPlayAgainBtn.hidden = false;
                        if (nycWinBackBtn != null) nycWinBackBtn.hidden = false;
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
                nycWinBackBtn.onclick = () => {
                    nycReturnFromWin = true;
                    go("nycRoom");
                };
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
        const nycDinnerRunnerCurrentScore = document.getElementById("nycDinnerRunnerCurrentScore");
        const nycDinnerRunnerBestScore = document.getElementById("nycDinnerRunnerBestScore");
        const nycDinnerRunnerPlayer = document.getElementById("nycDinnerRunnerPlayer");
        const nycDinnerRunnerThrower = document.getElementById("nycDinnerRunnerThrower");
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
            && nycDinnerRunnerCurrentScore != null
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
            if (nycDinnerRunnerThrower != null) {
                nycDinnerRunnerThrower.onerror = () => {
                    const fallbackSrc = nycDinnerRunnerThrower.dataset.fallbackSrc;
                    if (fallbackSrc != null && nycDinnerRunnerThrower.src.indexOf(fallbackSrc) === -1) {
                        nycDinnerRunnerThrower.src = fallbackSrc;
                    }
                };
            }
            nycDinnerRunnerNextBtn.onclick = () => {
                nycFromDinnerNext = false;
                go("nycAfterDinner");
            };

            const dinnerLines = [
                { side: "right", img: "assets/pixel-speech-bubble.png", small: true },
                {
                    side: "left",
                    img: "assets/pixel-speech-bubble (1).png",
                    small: true
                },
                {
                    side: "right",
                    img: "assets/third speech bubble.png",
                    fallbackImg: "assets/pixel-speech-bubble (2).png"
                },
                { side: "left", img: "assets/pixel-speech-bubble (3).png", small: true, scale: 1.02, top: "41%" },
                { side: "right", img: "assets/pixel-speech-bubble (4).png", top: "48%" },
                { side: "left", img: "assets/pixel-speech-bubble (5).png", small: true, scale: 0.93, top: "40%" },
                { side: "right", img: "assets/pixel-speech-bubble (6).png", scale: 1.12, top: "50%" },
                { side: "left", img: "assets/pixel-speech-bubble (7).png", small: true, scale: 1.04, top: "44%" },
                { side: "right", img: "assets/pixel-speech-bubble (8).png", small: true },
                { side: "right", img: "assets/pixel-speech-bubble (9).png" },
                { side: "left", img: "assets/pixel-speech-bubble (10).png", small: true }
            ];
            let dinnerLineIndex = 0;

            const renderDinnerLine = () => {
                const line = dinnerLines[dinnerLineIndex];
                nycDinnerChatLeft.style.setProperty("--dinner-bubble-scale", "1");
                nycDinnerChatRight.style.setProperty("--dinner-bubble-scale", "1");
                nycDinnerChatLeft.style.top = "";
                nycDinnerChatRight.style.top = "";
                const bubbleScale = line.scale ?? (line.small ? 0.88 : 1);
                const applyWithFallback = (imgEl) => {
                    imgEl.onerror = null;
                    imgEl.src = line.img;
                    if (line.fallbackImg != null) {
                        imgEl.onerror = () => {
                            imgEl.onerror = null;
                            imgEl.src = line.fallbackImg;
                        };
                    }
                };
                if (line.side === "left") {
                    applyWithFallback(nycDinnerChatLeftImg);
                    nycDinnerChatLeft.style.setProperty("--dinner-bubble-scale", `${bubbleScale}`);
                    if (line.top != null) nycDinnerChatLeft.style.top = line.top;
                    nycDinnerChatRight.hidden = true;
                    nycDinnerChatLeft.hidden = false;
                } else {
                    applyWithFallback(nycDinnerChatRightImg);
                    nycDinnerChatRight.style.setProperty("--dinner-bubble-scale", `${bubbleScale}`);
                    if (line.top != null) nycDinnerChatRight.style.top = line.top;
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
                    thrower: nycDinnerRunnerThrower,
                    obstacleLayer: nycDinnerRunnerObstacleLayer,
                    scoreEl: nycDinnerRunnerScore,
                    currentScoreEl: nycDinnerRunnerCurrentScore,
                    bestScoreEl: nycDinnerRunnerBestScore,
                    gameOverOverlay: nycDinnerRunnerGameOver,
                    restartBtn: nycDinnerRunnerRestartBtn
                });
            };
        }
        return;
    }

    if (state.screen === "nycAfterDinner") {
        app.innerHTML = screenNycAfterDinner();
        mountHomeButton();
        const nycAfterDinnerBubble = document.getElementById("nycAfterDinnerBubble");
        const nycAfterDinnerNextBtn = document.getElementById("nycAfterDinnerNextBtn");
        const nycAfterDinnerFinalBtn = document.getElementById("nycAfterDinnerFinalBtn");
        let nycAfterDinnerStep = 0;
        if (nycAfterDinnerFinalBtn != null) {
            nycAfterDinnerFinalBtn.onclick = () => go("afterDinnerHall");
        }
        const nycAfterDinnerFinalBtnImg = new Image();
        nycAfterDinnerFinalBtnImg.onerror = () => {
            if (nycAfterDinnerFinalBtn != null) {
                nycAfterDinnerFinalBtn.style.backgroundImage = "url('assets/好的宝宝.png')";
            }
        };
        nycAfterDinnerFinalBtnImg.src = "assets/after-restaurant-final-btn.png";
        if (nycAfterDinnerNextBtn != null) {
            nycAfterDinnerNextBtn.onclick = () => {
                if (nycAfterDinnerStep === 0 && nycAfterDinnerBubble != null) {
                    nycAfterDinnerStep = 1;
                    nycAfterDinnerBubble.src = "assets/after-restaurant-bubble-2.png";
                    nycAfterDinnerBubble.dataset.fallbackSrc = "assets/tickets text.png";
                    nycAfterDinnerBubble.dataset.bubbleStep = "2";
                    nycAfterDinnerBubble.alt = "But I saw it had tickets for the Bahamas in its hand.";
                    return;
                }
                if (nycAfterDinnerStep === 1 && nycAfterDinnerBubble != null) {
                    nycAfterDinnerStep = 2;
                    nycAfterDinnerBubble.src = "assets/after-restaurant-bubble-3.png";
                    nycAfterDinnerBubble.dataset.fallbackSrc = "assets/lets go bahamas text.png";
                    nycAfterDinnerBubble.dataset.bubbleStep = "3";
                    nycAfterDinnerBubble.alt = "Maybe we should head there too?";
                    nycAfterDinnerNextBtn.hidden = true;
                    if (nycAfterDinnerFinalBtn != null) nycAfterDinnerFinalBtn.hidden = false;
                    return;
                }
                go("afterDinnerHall");
            };
        }
        if (nycAfterDinnerBubble != null) {
            nycAfterDinnerBubble.onerror = () => {
                const fallbackSrc = nycAfterDinnerBubble.dataset.fallbackSrc;
                if (fallbackSrc != null && nycAfterDinnerBubble.src.indexOf(fallbackSrc) === -1) {
                    nycAfterDinnerBubble.src = fallbackSrc;
                }
            };
        }
        const nycAfterDinnerCouple = document.getElementById("nycAfterDinnerCouple");
        if (nycAfterDinnerCouple != null) {
            nycAfterDinnerCouple.onerror = () => {
                const fallbackSrc = nycAfterDinnerCouple.dataset.fallbackSrc;
                if (fallbackSrc != null && nycAfterDinnerCouple.src.indexOf(fallbackSrc) === -1) {
                    nycAfterDinnerCouple.src = fallbackSrc;
                }
            };
        }
        return;
    }

    if (state.screen === "afterDinnerHall") {
        app.innerHTML = screenAfterDinnerHall();
        mountHomeButton();
        const afterDinnerHallMemoriesBtn = document.getElementById("afterDinnerHallMemoriesBtn");
        if (afterDinnerHallMemoriesBtn != null) {
            afterDinnerHallMemoriesBtn.onclick = () => go("memoriesPink");
        }
        const afterDinnerHallBg = document.getElementById("afterDinnerHallBg");
        if (afterDinnerHallBg != null) {
            afterDinnerHallBg.onerror = () => {
                const fallbackSrc = afterDinnerHallBg.dataset.fallbackSrc;
                if (fallbackSrc != null && afterDinnerHallBg.src.indexOf(fallbackSrc) === -1) {
                    afterDinnerHallBg.src = fallbackSrc;
                }
            };
        }
        return;
    }

    if (state.screen === "memoriesPink") {
        app.innerHTML = screenMemoriesPink();
        mountHomeButton();
        const memoriesPinkVideo = document.querySelector(".memoriesPinkVideo");
        if (memoriesPinkVideo != null) {
            memoriesPinkVideo.muted = true;
            const playPromise = memoriesPinkVideo.play();
            if (playPromise != null && typeof playPromise.catch === "function") {
                playPromise.catch(() => {
                    memoriesPinkVideo.controls = true;
                });
            }
        }
        const memoriesFinishBtn = document.getElementById("memoriesFinishBtn");
        if (memoriesFinishBtn != null) memoriesFinishBtn.onclick = () => go("memoriesBlue");
        return;
    }

    if (state.screen === "memoriesBlue") {
        app.innerHTML = screenMemoriesBlue();
        mountHomeButton();
        const memoriesBlueNextBtn = document.getElementById("memoriesBlueNextBtn");
        if (memoriesBlueNextBtn != null) memoriesBlueNextBtn.onclick = () => go("bahamasHotel");
        return;
    }

    if (state.screen === "bahamasHotel") {
        app.innerHTML = screenBahamasHotel();
        mountHomeButton();
        const bahamasHotelBubble = document.getElementById("bahamasHotelBubble");
        const bahamasHotelCharacters = document.getElementById("bahamasHotelCharacters");
        const bahamasHotelBubbleImg = document.getElementById("bahamasHotelBubbleImg");
        const bahamasBubbleNextBtn = document.getElementById("bahamasBubbleNextBtn");
        const bahamasConversationEndBtn = document.getElementById("bahamasConversationEndBtn");
        const bahamasHotelNextBtn = document.getElementById("bahamasHotelNextBtn");
        let bahamasMovementUnlocked = !(bahamasBubbleNextBtn != null && bahamasHotelBubbleImg != null);
        if (bahamasConversationEndBtn != null) bahamasMovementUnlocked = false;
        if (bahamasHotelCharacters != null) {
            bahamasHotelCharacters.onerror = () => {
                const fallbackSrc = bahamasHotelCharacters.dataset.fallbackSrc;
                if (fallbackSrc != null && bahamasHotelCharacters.src.indexOf(fallbackSrc) === -1) {
                    bahamasHotelCharacters.src = fallbackSrc;
                }
            };
        }
        const bahamasHotelStage = document.getElementById("bahamasHotelStage");
        if (bahamasControlTeardown != null) {
            bahamasControlTeardown();
            bahamasControlTeardown = null;
        }
        bahamasControlTeardown = startBahamasCharacterControl(
            bahamasHotelStage,
            bahamasHotelCharacters,
            () => bahamasMovementUnlocked
        );
        if (bahamasBubbleNextBtn != null && bahamasHotelBubbleImg != null) {
            let bubbleStep = 1;
            bahamasBubbleNextBtn.onclick = () => {
                if (bubbleStep === 1) {
                    bubbleStep = 2;
                    bahamasHotelBubbleImg.src = "assets/water park.png";
                    bahamasHotelBubbleImg.alt = "Lets go to the waterpark!";
                    if (bahamasHotelBubble != null) bahamasHotelBubble.classList.add("secondBubble");
                    bahamasBubbleNextBtn.hidden = true;
                    if (bahamasConversationEndBtn != null) bahamasConversationEndBtn.hidden = false;
                }
            };
        }
        if (bahamasConversationEndBtn != null) {
            bahamasConversationEndBtn.onclick = () => {
                if (bahamasHotelBubble != null) bahamasHotelBubble.hidden = true;
                bahamasConversationEndBtn.hidden = true;
                if (bahamasHotelNextBtn != null) bahamasHotelNextBtn.hidden = false;
                bahamasMovementUnlocked = true;
            };
        }
        return;
    }

    if (state.screen === "yellowScreen") {
        app.innerHTML = screenYellowScreen();
        mountHomeButton();
        const yellowStartGameBtn = document.getElementById("yellowStartGameBtn");
        const yellowStopObjectBtn = document.getElementById("yellowStopObjectBtn");
        const yellowFastPassObject = document.querySelector(".yellowFastPassObject");
        const yellowGameLogo = document.querySelector(".yellowGameLogo");
        const yellowScreenStage = document.getElementById("yellowScreenStage");
        const yellowGoodSign = document.getElementById("yellowGoodSign");
        const yellowNextBtn = document.getElementById("yellowNextBtn");
        const yellowPlayAgainBtn = document.getElementById("yellowPlayAgainBtn");
        const boxWidth = 64;
        const boxHeight = 64;
        const boxCenterXRatio = 0.56;
        const boxTopRatio = 0.52;
        const fixedSpawnTopPercent = 52;
        const checkObjectInBox = () => {
            if (yellowScreenStage == null || yellowFastPassObject == null) return false;
            const stageRect = yellowScreenStage.getBoundingClientRect();
            const objectRect = yellowFastPassObject.getBoundingClientRect();
            const objectLeft = objectRect.left - stageRect.left;
            const objectTop = objectRect.top - stageRect.top;
            const objectRight = objectLeft + objectRect.width;
            const objectBottom = objectTop + objectRect.height;

            const boxCenterX = stageRect.width * boxCenterXRatio;
            const boxCenterY = (stageRect.height * boxTopRatio) + (boxHeight * 0.5);
            const boxLeft = boxCenterX - (boxWidth * 0.5);
            const boxTop = boxCenterY - (boxHeight * 0.5);
            const boxRight = boxLeft + boxWidth;
            const boxBottom = boxTop + boxHeight;
            const hitInset = 22;
            const hitLeft = boxLeft + hitInset;
            const hitTop = boxTop + hitInset;
            const hitRight = boxRight - hitInset;
            const hitBottom = boxBottom - hitInset;

            return objectRight >= hitLeft && objectLeft <= hitRight && objectBottom >= hitTop && objectTop <= hitBottom;
        };
        if (yellowFastPassObject != null) {
            const respawnFastObject = () => {
                if (yellowFastPassObject.dataset.paused === "1") return;
                yellowFastPassObject.style.left = "-14%";
                if (yellowScreenStage != null && yellowScreenStage.classList.contains("photoTaken")) {
                    const stageHeight = yellowScreenStage.clientHeight;
                    const objectHeight = yellowFastPassObject.offsetHeight || 18;
                    const boxCenterY = (stageHeight * boxTopRatio) + (boxHeight * 0.5);
                    const topPx = Math.max(
                        0,
                        Math.min(
                            stageHeight - objectHeight,
                            (boxCenterY - (objectHeight * 0.5)) - 16
                        )
                    );
                    yellowFastPassObject.style.top = `${topPx}px`;
                } else {
                    yellowFastPassObject.style.top = `${fixedSpawnTopPercent}%`;
                }
            };
            yellowFastPassObject.addEventListener("animationiteration", respawnFastObject);
            respawnFastObject();
        }
        if (yellowNextBtn != null) {
            yellowNextBtn.onclick = () => go("redScreen");
        }
        if (yellowPlayAgainBtn != null) {
            yellowPlayAgainBtn.onclick = () => go("yellowScreen");
        }
        if (yellowStopObjectBtn != null) {
            yellowStopObjectBtn.onclick = () => {
                if (yellowFastPassObject != null && yellowScreenStage != null) {
                    const isPaused = yellowFastPassObject.dataset.paused === "1";
                    if (!isPaused) {
                        const stageRect = yellowScreenStage.getBoundingClientRect();
                        const objectRect = yellowFastPassObject.getBoundingClientRect();
                        const maxLeft = Math.max(0, stageRect.width - objectRect.width);
                        const maxTop = Math.max(0, stageRect.height - objectRect.height);
                        const frozenLeft = Math.max(0, Math.min(maxLeft, objectRect.left - stageRect.left));
                        const frozenTop = Math.max(0, Math.min(maxTop, objectRect.top - stageRect.top));
                        yellowFastPassObject.style.left = `${frozenLeft}px`;
                        yellowFastPassObject.style.top = `${frozenTop}px`;
                        yellowFastPassObject.style.transform = "none";
                        yellowFastPassObject.style.animation = "none";
                        yellowFastPassObject.dataset.paused = "1";
                        if (yellowScreenStage.classList.contains("photoTaken") && yellowGoodSign != null && yellowNextBtn != null && yellowPlayAgainBtn != null) {
                            const inBox = checkObjectInBox();
                            yellowGoodSign.hidden = !inBox;
                            yellowNextBtn.hidden = !inBox;
                            yellowPlayAgainBtn.hidden = !inBox;
                            if (inBox) {
                                yellowStopObjectBtn.remove();
                            }
                        }
                    } else {
                        if (yellowScreenStage != null && yellowScreenStage.classList.contains("photoTaken")) {
                            const stageHeight = yellowScreenStage.clientHeight;
                            const objectHeight = yellowFastPassObject.offsetHeight || 18;
                            const boxCenterY = (stageHeight * boxTopRatio) + (boxHeight * 0.5);
                            yellowFastPassObject.style.left = "-14%";
                            yellowFastPassObject.style.top = `${Math.max(0, Math.min(stageHeight - objectHeight, (boxCenterY - (objectHeight * 0.5)) - 16))}px`;
                        } else {
                            yellowFastPassObject.style.left = "-14%";
                            yellowFastPassObject.style.top = `${52 + (Math.random() * 12)}%`;
                        }
                        yellowFastPassObject.style.animation = "yellowFastPass 550ms linear infinite";
                        yellowFastPassObject.dataset.paused = "0";
                        if (yellowGoodSign != null) yellowGoodSign.hidden = true;
                        if (yellowNextBtn != null) yellowNextBtn.hidden = true;
                        if (yellowPlayAgainBtn != null) yellowPlayAgainBtn.hidden = true;
                    }
                }
            };
        }
        if (yellowStartGameBtn != null) {
            yellowStartGameBtn.onclick = () => {
                if (yellowGameLogo != null && yellowGameLogo.parentNode != null) {
                    yellowGameLogo.parentNode.removeChild(yellowGameLogo);
                }
                if (yellowScreenStage != null) {
                    yellowScreenStage.classList.add("photoTaken");
                }
                yellowStartGameBtn.remove();
            };
        }
        return;
    }

    if (state.screen === "redScreen") {
        app.innerHTML = screenRedScreen();
        mountHomeButton();
        const redScreenCharacter = document.getElementById("redScreenCharacter");
        const redThoughtBubbleImg = document.getElementById("redThoughtBubbleImg");
        const redThoughtNextBtn = document.getElementById("redThoughtNextBtn");
        const redFinalImageBtn = document.getElementById("redFinalImageBtn");
        if (redScreenCharacter != null) {
            redScreenCharacter.onerror = () => {
                const fallbackSrc = redScreenCharacter.dataset.fallbackSrc;
                if (fallbackSrc != null && redScreenCharacter.src.indexOf(fallbackSrc) === -1) {
                    redScreenCharacter.src = fallbackSrc;
                }
            };
        }
        if (redFinalImageBtn != null) {
            redFinalImageBtn.onclick = () => go("blackScreen");
        }
        if (redThoughtNextBtn != null && redThoughtBubbleImg != null) {
            let redThoughtStep = 1;
            redThoughtNextBtn.onclick = () => {
                if (redThoughtStep === 1) {
                    redThoughtStep = 2;
                    redThoughtBubbleImg.src = "assets/to sea.png";
                    redThoughtBubbleImg.alt = "Tomorrow lets look for the bug out at sea";
                    redThoughtNextBtn.hidden = true;
                    if (redFinalImageBtn != null) redFinalImageBtn.hidden = false;
                }
            };
        }
        return;
    }

    if (state.screen === "orangeScreen") {
        app.innerHTML = screenOrangeScreen();
        mountHomeButton();
        const orangeToPurpleBtn = document.getElementById("orangeToPurpleBtn");
        if (orangeToPurpleBtn != null) orangeToPurpleBtn.onclick = () => go("violetScreen");
        return;
    }

    if (state.screen === "violetScreen") {
        app.innerHTML = screenVioletScreen();
        mountHomeButton();
        const violetToPurpleBtn = document.getElementById("violetToPurpleBtn");
        if (violetToPurpleBtn != null) violetToPurpleBtn.onclick = () => go("blueScreen");
        return;
    }

    if (state.screen === "blueScreen") {
        app.innerHTML = screenBlueScreen();
        mountHomeButton();
        const bluePromptBubble = document.getElementById("bluePromptBubble");
        const blueToGreenBtn = document.getElementById("blueToGreenBtn");
        const blueEndConvoBtn = document.getElementById("blueEndConvoBtn");
        const blueConversation = [
            {
                src: "assets/wantgo.png",
                alt: "Baby I know we have been doing but there is another place I want to go",
                style: { left: "58%", top: "46%", width: "min(34vw, 420px)" }
            },
            {
                src: "assets/where.png",
                alt: "Where?",
                style: { left: "40%", top: "44%", width: "min(16vw, 170px)" }
            },
            {
                src: "assets/disneyyy.png",
                alt: "Disney!",
                style: { left: "58%", top: "46%", width: "min(26vw, 280px)" }
            }
        ];
        let blueConversationStep = 0;
        const renderBlueConversationStep = () => {
            if (bluePromptBubble == null) return;
            const step = blueConversation[blueConversationStep];
            if (step == null) return;
            bluePromptBubble.src = step.src;
            bluePromptBubble.alt = step.alt;
            const left = step.style?.left ?? "50%";
            const top = step.style?.top ?? "34%";
            const width = step.style?.width ?? "min(64vw, 760px)";
            bluePromptBubble.style.left = left;
            bluePromptBubble.style.top = top;
            bluePromptBubble.style.width = width;
        };
        const renderBlueButtons = () => {
            const isFinalStep = blueConversationStep >= blueConversation.length - 1;
            if (blueToGreenBtn != null) blueToGreenBtn.hidden = isFinalStep;
            if (blueEndConvoBtn != null) blueEndConvoBtn.hidden = !isFinalStep;
        };
        renderBlueConversationStep();
        renderBlueButtons();
        if (blueToGreenBtn != null) {
            blueToGreenBtn.onclick = () => {
                if (blueConversationStep < blueConversation.length - 1) {
                    blueConversationStep += 1;
                    renderBlueConversationStep();
                    renderBlueButtons();
                }
            };
        }
        if (blueEndConvoBtn != null) blueEndConvoBtn.onclick = () => go("greenScreen");
        return;
    }

    if (state.screen === "greenScreen") {
        app.innerHTML = screenGreenScreen();
        mountHomeButton();
        const greenPromptBubble = document.getElementById("greenPromptBubble");
        const greenToDisneyBtn = document.getElementById("greenToDisneyBtn");
        const greenConversation = [
            {
                src: "assets/distracted.png",
                alt: "Baby we got distracted and forgot about the love bug",
                style: { left: "64%", top: "36%", width: "min(34vw, 320px)" }
            },
            {
                src: "assets/look.png",
                alt: "Lets look now!",
                style: { left: "35%", top: "31%", width: "min(28vw, 260px)" }
            }
        ];
        let greenConversationStep = 0;
        const renderGreenConversationStep = () => {
            if (greenPromptBubble == null) return;
            const step = greenConversation[greenConversationStep];
            if (step == null) return;
            greenPromptBubble.src = step.src;
            greenPromptBubble.alt = step.alt;
            greenPromptBubble.style.left = step.style?.left ?? "50%";
            greenPromptBubble.style.top = step.style?.top ?? "34%";
            greenPromptBubble.style.width = step.style?.width ?? "min(34vw, 320px)";
        };
        renderGreenConversationStep();
        if (greenToDisneyBtn != null) {
            greenToDisneyBtn.onclick = () => {
                if (greenConversationStep < greenConversation.length - 1) {
                    greenConversationStep += 1;
                    renderGreenConversationStep();
                    return;
                }
                go("kissRedScreen");
            };
        }
        return;
    }

    if (state.screen === "kissRedScreen") {
        app.innerHTML = screenKissRedScreen();
        mountHomeButton();
        const kissRedScreenStage = document.getElementById("kissRedScreenStage");
        const kissRedPromptBubble = document.getElementById("kissRedPromptBubble");
        const kissRedFindBugSign = document.getElementById("kissRedFindBugSign");
        const kissRedHiddenBug = document.getElementById("kissRedHiddenBug");
        const kissRedFoundSign = document.getElementById("kissRedFoundSign");
        const kissRedToPurpleBtn = document.getElementById("kissRedToPurpleBtn");
        const kissRedChoiceRow = document.getElementById("kissRedChoiceRow");
        const kissRedPlayAgainBtn = document.getElementById("kissRedPlayAgainBtn");
        const kissRedNextBtn = document.getElementById("kissRedNextBtn");
        const kissRedTimeoutRow = document.getElementById("kissRedTimeoutRow");
        const kissRedGiveUpBtn = document.getElementById("kissRedGiveUpBtn");
        if (kissRedTeardown != null) {
            kissRedTeardown();
            kissRedTeardown = null;
        }
        if (kissRedOfferTimer != null) {
            clearTimeout(kissRedOfferTimer);
            kissRedOfferTimer = null;
        }
        let kissRedStarted = false;
        const startKissRedRound = () => {
            kissRedStarted = true;
            if (kissRedFindBugSign != null) kissRedFindBugSign.hidden = true;
            if (kissRedChoiceRow != null) kissRedChoiceRow.hidden = true;
            if (kissRedTimeoutRow != null) kissRedTimeoutRow.hidden = false;
            if (kissRedToPurpleBtn != null) kissRedToPurpleBtn.hidden = true;
            if (kissRedTeardown != null) {
                kissRedTeardown();
                kissRedTeardown = null;
            }
            if (kissRedOfferTimer != null) {
                clearTimeout(kissRedOfferTimer);
                kissRedOfferTimer = null;
            }
            kissRedTeardown = startKissRedClickGame(
                kissRedScreenStage,
                kissRedHiddenBug,
                kissRedFoundSign,
                () => {
                    if (!kissRedStarted) return;
                    if (kissRedOfferTimer != null) {
                        clearTimeout(kissRedOfferTimer);
                        kissRedOfferTimer = null;
                    }
                    if (kissRedTimeoutRow != null) kissRedTimeoutRow.hidden = true;
                    if (kissRedChoiceRow != null) kissRedChoiceRow.hidden = false;
                }
            );
        };
        if (kissRedChoiceRow != null) kissRedChoiceRow.hidden = true;
        if (kissRedTimeoutRow != null) kissRedTimeoutRow.hidden = true;
        if (kissRedToPurpleBtn != null) {
            kissRedToPurpleBtn.onclick = startKissRedRound;
        }
        if (kissRedPlayAgainBtn != null) kissRedPlayAgainBtn.onclick = startKissRedRound;
        if (kissRedNextBtn != null) kissRedNextBtn.onclick = () => go("kissPinkScreen");
        if (kissRedGiveUpBtn != null) kissRedGiveUpBtn.onclick = () => go("kissPinkScreen");
        return;
    }

    if (state.screen === "kissPinkScreen") {
        app.innerHTML = screenKissPinkScreen();
        mountHomeButton();
        const kissPinkBubbleImg = document.getElementById("kissPinkBubbleImg");
        const kissPinkToPurpleBtn = document.getElementById("kissPinkToPurpleBtn");
        const kissPinkEndBtn = document.getElementById("kissPinkEndBtn");
        const kissPinkConversation = [
            { src: "assets/cought.png", alt: "We finally caught the love bug" },
            { src: "assets/ouch.png", alt: "Ouch", size: "min(16vw, 150px)" },
            { src: "assets/wrong.png", alt: "Whats wrong?", size: "min(24vw, 260px)" },
            { src: "assets/bit.png", alt: "It bit me", size: "min(14vw, 140px)" },
            { src: "assets/ok.png", alt: "Are you ok?", size: "min(20vw, 220px)" },
            { src: "assets/ran.png", alt: "Yes, but it dropped it and it ran", left: "64%", top: "33%" },
            { src: "assets/rest.png", alt: "Its ok lets go home and rest", left: "37%", top: "27%" }
        ];
        let kissPinkStep = 0;
        const renderKissPinkStep = () => {
            const step = kissPinkConversation[kissPinkStep];
            if (kissPinkBubbleImg != null && step != null) {
                kissPinkBubbleImg.src = step.src;
                kissPinkBubbleImg.alt = step.alt;
                kissPinkBubbleImg.style.width = step.size ?? "min(38vw, 430px)";
                kissPinkBubbleImg.style.left = step.left ?? "";
                kissPinkBubbleImg.style.top = step.top ?? "";
                const isOddStepNumber = ((kissPinkStep + 1) % 2) === 1;
                kissPinkBubbleImg.classList.toggle("left", isOddStepNumber);
                kissPinkBubbleImg.classList.toggle("right", !isOddStepNumber);
            }
        };
        const showKissPinkEndBtn = () => {
            if (kissPinkToPurpleBtn != null) kissPinkToPurpleBtn.hidden = true;
            if (kissPinkEndBtn != null) kissPinkEndBtn.hidden = false;
        };
        if (kissPinkToPurpleBtn != null) {
            kissPinkToPurpleBtn.onclick = () => {
                if (kissPinkStep < kissPinkConversation.length - 1) {
                    kissPinkStep += 1;
                    renderKissPinkStep();
                    if (kissPinkStep >= kissPinkConversation.length - 1) {
                        showKissPinkEndBtn();
                    }
                    return;
                }
                showKissPinkEndBtn();
            };
        }
        if (kissPinkEndBtn != null) kissPinkEndBtn.onclick = () => go("kissGreyScreen");
        if (kissPinkEndBtn != null) kissPinkEndBtn.hidden = true;
        if (kissPinkToPurpleBtn != null) kissPinkToPurpleBtn.hidden = false;
        renderKissPinkStep();
        return;
    }

    if (state.screen === "kissGreyScreen") {
        app.innerHTML = screenKissGreyScreen();
        mountHomeButton();
        const kissGreyScreenStage = document.getElementById("kissGreyScreenStage");
        const kissGreyBubbleImg = document.getElementById("kissGreyBubbleImg");
        const kissGreyQuestionText = document.getElementById("kissGreyQuestionText");
        const kissGreyAnswerBox = document.getElementById("kissGreyAnswerBox");
        const kissGreyAnswerInput = document.getElementById("kissGreyAnswerInput");
        const kissGreyCenterBox = document.getElementById("kissGreyCenterBox");
        const kissGreyStartMovieImg = document.getElementById("kissGreyStartMovieImg");
        const kissGreyStartMovieBtn = document.getElementById("kissGreyStartMovieBtn");
        const kissGreyKiwiPickup = document.getElementById("kissGreyKiwiPickup");
        const kissGreyKiwiImg = document.getElementById("kissGreyKiwiImg");
        const kissGreyTakeBtn = document.getElementById("kissGreyTakeBtn");
        const kissGreyAnswerError = document.getElementById("kissGreyAnswerError");
        const kissGreyNextBtn = document.getElementById("kissGreyNextBtn");
        let kissGreyStep = 0;
        let kiwiRevealQueued = false;
        let isKiwiDragging = false;
        let kiwiLockedInBox = false;
        let kiwiDragOffsetX = 0;
        let kiwiDragOffsetY = 0;
        const placeKiwiAt = (left, top) => {
            if (kissGreyKiwiImg == null) return;
            const maxLeft = Math.max(0, window.innerWidth - kissGreyKiwiImg.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - kissGreyKiwiImg.offsetHeight);
            const clampedLeft = Math.min(Math.max(0, left), maxLeft);
            const clampedTop = Math.min(Math.max(0, top), maxTop);
            kissGreyKiwiImg.style.left = `${clampedLeft}px`;
            kissGreyKiwiImg.style.top = `${clampedTop}px`;
        };
        const lockKiwiInCenterBox = () => {
            if (kissGreyKiwiImg == null || kissGreyCenterBox == null) return;
            kiwiLockedInBox = true;
            kissGreyKiwiImg.classList.remove("dragging", "draggable");
            kissGreyKiwiImg.classList.add("locked");
            if (kissGreyStartMovieImg != null) kissGreyStartMovieImg.hidden = false;
            if (kissGreyStartMovieBtn != null) kissGreyStartMovieBtn.hidden = false;
        };
        const shouldLockKiwiInBox = () => {
            if (kissGreyKiwiImg == null || kissGreyCenterBox == null) return false;
            const kiwiRect = kissGreyKiwiImg.getBoundingClientRect();
            const boxRect = kissGreyCenterBox.getBoundingClientRect();
            return !(kiwiRect.right < boxRect.left || kiwiRect.left > boxRect.right || kiwiRect.bottom < boxRect.top || kiwiRect.top > boxRect.bottom);
        };
        const stopKiwiDrag = () => {
            isKiwiDragging = false;
            if (kissGreyKiwiImg != null) kissGreyKiwiImg.classList.remove("dragging");
            window.removeEventListener("pointermove", onKiwiDragMove);
            window.removeEventListener("pointerup", stopKiwiDrag);
            window.removeEventListener("pointercancel", stopKiwiDrag);
            window.removeEventListener("mousemove", onKiwiDragMouseMove);
            window.removeEventListener("mouseup", stopKiwiDrag);
            if (kiwiLockedInBox || kissGreyKiwiImg == null || !kissGreyKiwiImg.classList.contains("draggable")) return;
            if (shouldLockKiwiInBox()) {
                lockKiwiInCenterBox();
            }
        };
        const onKiwiDragMove = (event) => {
            if (state.screen !== "kissGreyScreen") {
                stopKiwiDrag();
                return;
            }
            if (!isKiwiDragging) return;
            placeKiwiAt(event.clientX - kiwiDragOffsetX, event.clientY - kiwiDragOffsetY);
        };
        const onKiwiDragMouseMove = (event) => {
            onKiwiDragMove(event);
        };
        const onKiwiPointerDown = (event) => {
            if (kissGreyKiwiImg == null) return;
            if (!kissGreyKiwiImg.classList.contains("draggable")) return;
            if (kiwiLockedInBox) return;
            const kiwiRect = kissGreyKiwiImg.getBoundingClientRect();
            kiwiDragOffsetX = event.clientX - kiwiRect.left;
            kiwiDragOffsetY = event.clientY - kiwiRect.top;
            isKiwiDragging = true;
            kissGreyKiwiImg.classList.add("dragging");
            window.addEventListener("pointermove", onKiwiDragMove);
            window.addEventListener("pointerup", stopKiwiDrag);
            window.addEventListener("pointercancel", stopKiwiDrag);
        };
        const onKiwiMouseDown = (event) => {
            if (kissGreyKiwiImg == null) return;
            if (!kissGreyKiwiImg.classList.contains("draggable")) return;
            if (kiwiLockedInBox) return;
            event.preventDefault();
            const kiwiRect = kissGreyKiwiImg.getBoundingClientRect();
            kiwiDragOffsetX = event.clientX - kiwiRect.left;
            kiwiDragOffsetY = event.clientY - kiwiRect.top;
            isKiwiDragging = true;
            kissGreyKiwiImg.classList.add("dragging");
            window.addEventListener("mousemove", onKiwiDragMouseMove);
            window.addEventListener("mouseup", stopKiwiDrag);
        };
        const checkKissGreyAnswer = () => {
            const raw = kissGreyAnswerInput?.value ?? "";
            const answer = raw.trim().toLowerCase();
            if (answer === "kiwi") {
                if (kiwiRevealQueued) return;
                kiwiRevealQueued = true;
                if (kissGreyAnswerError != null) kissGreyAnswerError.hidden = true;
                if (kissGreyAnswerInput != null) kissGreyAnswerInput.disabled = true;
                window.setTimeout(() => {
                    if (state.screen !== "kissGreyScreen") return;
                    if (kissGreyScreenStage != null) {
                        kissGreyScreenStage.style.background = 'url("assets/kiwibk.png") center center / cover no-repeat';
                    }
                    if (kissGreyQuestionText != null) kissGreyQuestionText.hidden = true;
                    if (kissGreyAnswerBox != null) kissGreyAnswerBox.hidden = true;
                    if (kissGreyKiwiPickup != null) kissGreyKiwiPickup.hidden = false;
                    if (kissGreyKiwiImg != null) kissGreyKiwiImg.hidden = true;
                    if (kissGreyTakeBtn != null) kissGreyTakeBtn.hidden = false;
                }, 500);
                return;
            }
            if (kissGreyAnswerError != null) {
                kissGreyAnswerError.hidden = answer.length === 0;
            }
        };
        if (kissGreyNextBtn != null) {
            kissGreyNextBtn.onclick = () => {
                if (kissGreyBubbleImg != null && kissGreyStep === 0) {
                    kissGreyStep = 1;
                    kissGreyBubbleImg.src = "assets/couch2.png";
                    kissGreyBubbleImg.alt = "Almost, theres someone missing";
                    kissGreyBubbleImg.classList.remove("first");
                    kissGreyBubbleImg.classList.add("second");
                    kissGreyNextBtn.textContent = "who?";
                    kissGreyNextBtn.setAttribute("aria-label", "who?");
                    return;
                }
                if (kissGreyStep === 1) {
                    kissGreyStep = 2;
                    if (kissGreyBubbleImg != null) kissGreyBubbleImg.hidden = true;
                    if (kissGreyQuestionText != null) kissGreyQuestionText.hidden = false;
                    if (kissGreyAnswerBox != null) kissGreyAnswerBox.hidden = false;
                    kissGreyNextBtn.hidden = true;
                    if (kissGreyAnswerInput != null) kissGreyAnswerInput.focus();
                    return;
                }
            };
        }
        if (kissGreyAnswerInput != null) {
            kissGreyAnswerInput.addEventListener("input", () => {
                checkKissGreyAnswer();
            });
        }
        if (kissGreyTakeBtn != null) {
            kissGreyTakeBtn.onclick = () => {
                if (kissGreyKiwiImg == null) return;
                kissGreyTakeBtn.hidden = true;
                if (kissGreyKiwiPickup != null) kissGreyKiwiPickup.classList.add("dragMode");
                kissGreyKiwiImg.classList.remove("following", "cornered");
                kissGreyKiwiImg.classList.add("draggable");
                kissGreyKiwiImg.hidden = false;
                if (kissGreyScreenStage != null) {
                    const couchBackground = new Image();
                    couchBackground.onload = () => {
                        if (state.screen !== "kissGreyScreen") return;
                        kissGreyScreenStage.style.background = 'url("assets/couch.png") center center / cover no-repeat';
                    };
                    couchBackground.onerror = () => {
                        if (state.screen !== "kissGreyScreen") return;
                        kissGreyScreenStage.style.background = 'url("assets/couch bkg.png") center center / cover no-repeat';
                    };
                    couchBackground.src = "assets/couch.png";
                }
                placeKiwiAt(1800, window.innerHeight - kissGreyKiwiImg.offsetHeight - 320);
            };
        }
        if (kissGreyKiwiImg != null) {
            kissGreyKiwiImg.addEventListener("pointerdown", onKiwiPointerDown);
            kissGreyKiwiImg.addEventListener("mousedown", onKiwiMouseDown);
        }
        if (kissGreyStartMovieBtn != null) {
            kissGreyStartMovieBtn.onclick = () => go("capcutScreen");
        }
        return;
    }

    if (state.screen === "capcutScreen") {
        app.innerHTML = screenCapcutScreen();
        mountHomeButton();
        const capcutScreenVideo = document.getElementById("capcutScreenVideo");
        if (capcutScreenVideo != null) {
            capcutScreenVideo.onended = () => go("creditsScreen");
            const playPromise = capcutScreenVideo.play();
            if (playPromise != null && typeof playPromise.catch === "function") {
                playPromise.catch(() => { });
            }
        }
        return;
    }

    if (state.screen === "creditsScreen") {
        app.innerHTML = screenCreditsScreen();
        mountHomeButton();
        const creditsScreenStage = document.getElementById("creditsScreenStage");
        const creditsBody = creditsScreenStage?.querySelector(".creditsBody");
        const creditsGiftLabel = creditsScreenStage?.querySelector(".creditsGiftLabel");
        const creditsContinueBtn = document.getElementById("creditsContinueBtn");
        if (creditsContinueBtn != null) {
            creditsContinueBtn.onclick = () => {
                if (creditsScreenStage == null) {
                    go("redScreen");
                    return;
                }
                creditsContinueBtn.disabled = true;
                const giftRect = creditsContinueBtn.getBoundingClientRect();
                creditsContinueBtn.hidden = true;
                if (creditsBody != null) creditsBody.hidden = true;
                if (creditsGiftLabel != null) creditsGiftLabel.hidden = true;
                const kissLayer = document.createElement("div");
                kissLayer.className = "creditsKissLayer";
                const stageWidth = creditsScreenStage.clientWidth || window.innerWidth;
                const stageHeight = creditsScreenStage.clientHeight || window.innerHeight;
                const emitters = Array.from({ length: 8 }, () => ({
                    x: Math.random() * stageWidth,
                    y: Math.random() * stageHeight
                }));
                const centerEmitter = {
                    x: giftRect.left + (giftRect.width / 2),
                    y: giftRect.top + (giftRect.height / 2)
                };
                emitters.push(centerEmitter);
                const cellSize = 20;
                const cols = Math.ceil(stageWidth / cellSize) + 2;
                const rows = Math.ceil(stageHeight / cellSize) + 2;
                const targets = [];
                for (let row = -1; row < rows; row += 1) {
                    for (let col = -1; col < cols; col += 1) {
                        targets.push({
                            x: (col * cellSize) + ((Math.random() * 28) - 14),
                            y: (row * cellSize) + ((Math.random() * 28) - 14)
                        });
                    }
                }
                const extraThrows = Math.max(800, Math.floor((stageWidth * stageHeight) / 1500));
                for (let i = 0; i < extraThrows; i += 1) {
                    targets.push({
                        x: Math.random() * stageWidth,
                        y: Math.random() * stageHeight
                    });
                }
                const frag = document.createDocumentFragment();
                for (let i = 0; i < targets.length; i += 1) {
                    const kiss = document.createElement("img");
                    kiss.className = "creditsKissPop";
                    kiss.src = "assets/kisses.png";
                    kiss.alt = "";
                    kiss.setAttribute("aria-hidden", "true");
                    const emitter = emitters[Math.floor(Math.random() * emitters.length)];
                    const target = targets[i];
                    const targetX = target.x;
                    const targetY = target.y;
                    const dx = targetX - emitter.x;
                    const dy = targetY - emitter.y;
                    kiss.style.left = `${emitter.x}px`;
                    kiss.style.top = `${emitter.y}px`;
                    kiss.style.setProperty("--dx", `${dx.toFixed(1)}px`);
                    kiss.style.setProperty("--dy", `${dy.toFixed(1)}px`);
                    kiss.style.setProperty("--rot", `${Math.round((Math.random() * 180) - 90)}deg`);
                    kiss.style.setProperty("--dur", `${1200 + Math.floor(Math.random() * 1300)}ms`);
                    kiss.style.animationDelay = `${Math.random() * 2600}ms`;
                    kiss.style.width = `${44 + Math.random() * 38}px`;
                    frag.appendChild(kiss);
                }
                kissLayer.appendChild(frag);
                creditsScreenStage.appendChild(kissLayer);
                const kissWords = document.createElement("div");
                kissWords.className = "creditsKissWords";
                kissWords.textContent = "LOTS OF KISSES";
                creditsScreenStage.appendChild(kissWords);
                window.setTimeout(() => {
                    if (state.screen !== "creditsScreen") return;
                    kissWords.classList.add("visible");
                }, 700);
            };
        }
        return;
    }

    if (state.screen === "blackScreen") {
        app.innerHTML = screenBlackScreen();
        mountHomeButton();
        const blackScreenEndingImg = document.querySelector(".blackScreenEndingImg");
        const blackTomorrowBtn = document.getElementById("blackTomorrowBtn");
        if (blackScreenEndingImg != null) {
            blackScreenEndingImg.onerror = () => {
                const fallbackSrc = blackScreenEndingImg.dataset.fallbackSrc;
                if (fallbackSrc != null && blackScreenEndingImg.src.indexOf(fallbackSrc) === -1) {
                    blackScreenEndingImg.src = fallbackSrc;
                }
            };
        }
        if (blackTomorrowBtn != null) {
            blackTomorrowBtn.onclick = () => go("brownScreen");
        }
        return;
    }

    if (state.screen === "brownScreen") {
        app.innerHTML = screenBrownScreen();
        mountHomeButton();
        const brownScreenVideo = document.getElementById("brownScreenVideo");
        if (brownScreenVideo != null) {
            brownScreenVideo.onended = () => go("greyScreen");
        }
        return;
    }

    if (state.screen === "greyScreen") {
        app.innerHTML = screenGreyScreen();
        mountHomeButton();
        const greyScreenCharacter = document.getElementById("greyScreenCharacter");
        const greyPurpleBtn = document.getElementById("greyPurpleBtn");
        if (greyScreenCharacter != null) {
            greyScreenCharacter.onerror = () => {
                const fallbackSrc = greyScreenCharacter.dataset.fallbackSrc;
                if (fallbackSrc != null && greyScreenCharacter.src.indexOf(fallbackSrc) === -1) {
                    greyScreenCharacter.src = fallbackSrc;
                }
            };
        }
        if (greyPurpleBtn != null) {
            greyPurpleBtn.onclick = () => go("silverScreen");
        }
        return;
    }

    if (state.screen === "silverScreen") {
        app.innerHTML = screenSilverScreen();
        mountHomeButton();
        const silverToPurpleBtn = document.getElementById("silverToPurpleBtn");
        if (silverToPurpleBtn != null) {
            silverToPurpleBtn.onclick = () => go("purpleScreen");
        }
        return;
    }

    if (state.screen === "purpleScreen") {
        app.innerHTML = screenPurpleScreen();
        mountHomeButton();
        const purpleSlideImg = document.getElementById("purpleSlideImg");
        const purpleSlideVideo = document.getElementById("purpleSlideVideo");
        const purpleSlidePrevBtn = document.getElementById("purpleSlidePrevBtn");
        const purpleSlideNextBtn = document.getElementById("purpleSlideNextBtn");
        const purpleFinishBtn = document.getElementById("purpleFinishBtn");
        let purpleSlideIndex = 0;

        const renderPurpleSlide = () => {
            if (purpleSlideImg == null || PURPLE_SLIDES.length === 0) return;
            const slide = PURPLE_SLIDES[purpleSlideIndex];
            const isVideo = /\.mp4$/i.test(slide);

            if (isVideo) {
                purpleSlideImg.hidden = true;
                if (purpleSlideVideo != null) {
                    purpleSlideVideo.hidden = false;
                    if (purpleSlideVideo.src.indexOf(slide) === -1) {
                        purpleSlideVideo.src = slide;
                    }
                    purpleSlideVideo.currentTime = 0;
                    purpleSlideVideo.play().catch(() => { });
                }
                return;
            }

            purpleSlideImg.hidden = false;
            purpleSlideImg.src = slide;
            if (purpleSlideVideo != null) {
                purpleSlideVideo.pause();
                purpleSlideVideo.hidden = true;
            }
        };

        if (purpleSlidePrevBtn != null) {
            purpleSlidePrevBtn.onclick = () => {
                if (PURPLE_SLIDES.length === 0) return;
                purpleSlideIndex = (purpleSlideIndex - 1 + PURPLE_SLIDES.length) % PURPLE_SLIDES.length;
                renderPurpleSlide();
            };
        }
        if (purpleSlideNextBtn != null) {
            purpleSlideNextBtn.onclick = () => {
                if (PURPLE_SLIDES.length === 0) return;
                purpleSlideIndex = (purpleSlideIndex + 1) % PURPLE_SLIDES.length;
                renderPurpleSlide();
            };
        }
        if (purpleFinishBtn != null) {
            purpleFinishBtn.onclick = () => go("magentaScreen");
        }
        return;
    }

    if (state.screen === "magentaScreen") {
        app.innerHTML = screenMagentaScreen();
        mountHomeButton();
        const magentaTextBubble = document.getElementById("magentaTextBubble");
        const magentaNextBtn = document.getElementById("magentaNextBtn");
        const magentaEndBtn = document.getElementById("magentaEndBtn");
        let magentaStep = 0;

        const renderMagentaStep = () => {
            if (magentaTextBubble == null) return;
            if (magentaStep === 0) {
                magentaTextBubble.innerHTML = `<img class="magentaBubbleImage" src="${MAGENTA_FIRST_BUBBLE_IMAGE}" alt="Now that we are home you know what sounds really good?">`;
                magentaTextBubble.classList.add("useImage");
            } else if (magentaStep === 1) {
                magentaTextBubble.innerHTML = `<img class="magentaBubbleImage magentaBubbleImageSmall magentaBubbleImageWhat" src="${MAGENTA_SECOND_BUBBLE_IMAGE}" alt="What?">`;
                magentaTextBubble.classList.add("useImage");
            } else if (magentaStep === 2) {
                magentaTextBubble.innerHTML = `<img class="magentaBubbleImage magentaBubbleImageSmall" src="${MAGENTA_THIRD_BUBBLE_IMAGE}" alt="Shanghai dui">`;
                magentaTextBubble.classList.add("useImage");
            } else {
                magentaTextBubble.textContent = MAGENTA_TEXT_STEPS[magentaStep] ?? "";
                magentaTextBubble.classList.remove("useImage");
            }
            magentaTextBubble.dataset.step = String(magentaStep + 1);
            if (magentaNextBtn != null) {
                magentaNextBtn.hidden = magentaStep >= (MAGENTA_TEXT_STEPS.length - 1);
            }
            if (magentaEndBtn != null) {
                magentaEndBtn.hidden = magentaStep < (MAGENTA_TEXT_STEPS.length - 1);
            }
        };

        renderMagentaStep();

        if (magentaNextBtn != null) {
            magentaNextBtn.onclick = () => {
                if (magentaStep >= MAGENTA_TEXT_STEPS.length - 1) return;
                magentaStep += 1;
                renderMagentaStep();
            };
        }
        if (magentaEndBtn != null) {
            magentaEndBtn.onclick = () => go("goldenScreen");
        }
        return;
    }

    if (state.screen === "goldenScreen") {
        app.innerHTML = screenGoldenScreen();
        mountHomeButton();
        const goldenLavenderBtn = document.getElementById("goldenLavenderBtn");
        if (goldenLavenderBtn != null) goldenLavenderBtn.onclick = () => go("mintRoom");
        return;
    }

    if (state.screen === "mintRoom") {
        app.innerHTML = screenMintRoom();
        mountHomeButton();
        const mintRoomStage = document.getElementById("mintRoomStage");
        const mintFallingLayer = document.getElementById("mintFallingLayer");
        const mintScoreHud = document.getElementById("mintScoreHud");
        const mintLivesHud = document.getElementById("mintLivesHud");
        const mintHoop = document.getElementById("mintHoop");
        const mintGameSign = document.getElementById("mintGameSign");
        const mintGameOverSign = document.getElementById("mintGameOverSign");
        const mintGameStartBtn = document.getElementById("mintGameStartBtn");
        const mintGameNextBtn = document.getElementById("mintGameNextBtn");
        const paintMintScore = (score) => {
            if (mintScoreHud == null) return;
            mintScoreHud.textContent = `Caught: ${Math.max(0, Math.floor(Number(score) || 0))}`;
        };
        if (mintScoreHud != null) mintScoreHud.hidden = true;
        if (mintLivesHud != null) mintLivesHud.hidden = true;
        if (mintGameNextBtn != null) mintGameNextBtn.hidden = true;
        if (mintGameStartBtn != null) mintGameStartBtn.classList.remove("withNext");
        const paintMintLives = (missed) => {
            if (mintLivesHud == null) return;
            const hearts = mintLivesHud.querySelectorAll(".mintLifeHeart");
            hearts.forEach((heart, index) => {
                heart.classList.toggle("is-empty", index < missed);
            });
        };
        if (mintHoop != null) {
            const fallbackSrc = mintHoop.dataset.fallbackSrc;
            if (fallbackSrc != null) {
                mintHoop.onerror = () => {
                    mintHoop.onerror = null;
                    mintHoop.src = fallbackSrc;
                };
            }
        }
        if (mintGameStartBtn != null) {
            mintGameStartBtn.onclick = () => {
                if (mintGameSign != null) mintGameSign.remove();
                if (mintGameOverSign != null) mintGameOverSign.hidden = true;
                if (mintGameNextBtn != null) mintGameNextBtn.hidden = true;
                mintGameStartBtn.classList.remove("withNext");
                if (mintScoreHud != null) mintScoreHud.hidden = false;
                if (mintLivesHud != null) mintLivesHud.hidden = false;
                paintMintScore(0);
                paintMintLives(0);
                mintGameStartBtn.textContent = "Start";
                mintGameStartBtn.hidden = true;
                if (mintHoop != null) mintHoop.hidden = false;
                if (mintGameTeardown != null) {
                    mintGameTeardown();
                    mintGameTeardown = null;
                }
                mintGameTeardown = startMintFallingGame(mintRoomStage, mintFallingLayer, mintHoop, (result) => {
                    const finalScore = Math.max(0, Math.floor(result?.caughtCount || 0));
                    const previousBest = loadMintTopScore();
                    const bestScore = Math.max(previousBest, finalScore);
                    if (bestScore !== previousBest) saveMintTopScore(bestScore);
                    if (mintGameOverSign != null) {
                        mintGameOverSign.innerHTML = `
                          <div class="mintGameOverTitle">Game Over</div>
                          <div class="mintGameOverMeta">Score: ${finalScore}</div>
                          <div class="mintGameOverMeta">Best: ${bestScore}</div>
                        `;
                        mintGameOverSign.hidden = false;
                    }
                    paintMintLives(3);
                    if (mintScoreHud != null) mintScoreHud.hidden = true;
                    if (mintLivesHud != null) mintLivesHud.hidden = true;
                    if (mintHoop != null) mintHoop.hidden = true;
                    mintGameStartBtn.textContent = "Play Again";
                    mintGameStartBtn.hidden = false;
                    mintGameStartBtn.classList.add("withNext");
                    if (mintGameNextBtn != null) mintGameNextBtn.hidden = false;
                    mintGameTeardown = null;
                }, (missedCount) => {
                    paintMintLives(missedCount);
                }, (caughtCount) => {
                    paintMintScore(caughtCount);
                });
            };
        }
        if (mintGameNextBtn != null) mintGameNextBtn.onclick = () => go("orangeScreen");
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
        const backRoomBtn = document.getElementById("backRoomBtn");
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

        if (backRoomBtn != null) {
            backRoomBtn.onclick = () => {
                state.mapIntroDone = true;
                save();
                go("map");
            };
        }

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
            let vx = (Math.random() < 0.5 ? -1 : 1) * (370 + (Math.random() * 210));
            let vy = (Math.random() < 0.5 ? -1 : 1) * (370 + (Math.random() * 210));
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
                const minSpeed = 350;
                const maxSpeed = 760;
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

