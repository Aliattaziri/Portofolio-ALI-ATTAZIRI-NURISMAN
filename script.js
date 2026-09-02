document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("nav a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.forEach((item) => item.classList.remove("active"));
      link.classList.add("active");
    });
  });

  const revealElements = document.querySelectorAll(".reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  revealElements.forEach((element) => revealObserver.observe(element));

  const board = document.getElementById("gameBoard");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const startBtn = document.getElementById("startGameBtn");

  const gridSize = 10;
  const directionMap = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  let snake = [];
  let food = { x: 7, y: 5 };
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let score = 0;
  let timeLeft = 30;
  let moveTimerId = null;
  let countdownTimerId = null;
  let gameActive = false;

  function createBoard() {
    board.innerHTML = "";
    for (let i = 0; i < gridSize * gridSize; i++) {
      const cell = document.createElement("div");
      cell.className = "game-cell";
      board.appendChild(cell);
    }
  }

  function placeFood() {
    let candidate = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };

    while (snake.some((segment) => segment.x === candidate.x && segment.y === candidate.y)) {
      candidate = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize),
      };
    }

    food = candidate;
  }

  function updateBoard() {
    const cells = board.children;

    for (let i = 0; i < cells.length; i++) {
      cells[i].classList.remove("snake", "head", "food");
    }

    snake.forEach((segment, index) => {
      const cellIndex = segment.y * gridSize + segment.x;
      cells[cellIndex].classList.add(index === 0 ? "head" : "snake");
    });

    const foodIndex = food.y * gridSize + food.x;
    cells[foodIndex].classList.add("food");
  }

  function setDirection(dirKey) {
    if (!gameActive) return;

    const newDirection = directionMap[dirKey];
    if (!newDirection) return;

    const isReverse = newDirection.x === -direction.x && newDirection.y === -direction.y;
    if (isReverse) return;

    nextDirection = newDirection;
  }

  function moveSnake() {
    if (!gameActive) return;

    direction = nextDirection;
    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y,
    };

    const hitWall = head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
    const ateFood = head.x === food.x && head.y === food.y;
    const collisionBody = ateFood ? snake : snake.slice(0, -1);
    const hitSelf = collisionBody.some((segment) => segment.x === head.x && segment.y === head.y);

    if (hitWall || hitSelf) {
      endGame();
      return;
    }

    snake.unshift(head);

    if (ateFood) {
      score += 1;
      scoreEl.textContent = score;
      placeFood();
    } else {
      snake.pop();
    }

    updateBoard();
  }

  function countdown() {
    timeLeft -= 1;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }

  function startGame() {
    gameActive = true;
    score = 0;
    timeLeft = 30;
    scoreEl.textContent = score;
    timeEl.textContent = timeLeft;

    snake = [
      { x: 3, y: 5 },
      { x: 2, y: 5 },
      { x: 1, y: 5 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    placeFood();
    updateBoard();

    clearInterval(moveTimerId);
    clearInterval(countdownTimerId);
    moveTimerId = setInterval(moveSnake, 220);
    countdownTimerId = setInterval(countdown, 1000);
  }

  function endGame() {
    gameActive = false;
    clearInterval(moveTimerId);
    clearInterval(countdownTimerId);
    alert("Game over! Skor akhir: " + score);
  }

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "arrowup" || key === "w") setDirection("up");
    if (key === "arrowdown" || key === "s") setDirection("down");
    if (key === "arrowleft" || key === "a") setDirection("left");
    if (key === "arrowright" || key === "d") setDirection("right");
  });

  let touchStartX = 0;
  let touchStartY = 0;

  board.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  board.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) return;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDirection(deltaX > 0 ? "right" : "left");
    } else {
      setDirection(deltaY > 0 ? "down" : "up");
    }
  }, { passive: true });

  document.querySelectorAll(".turn-btn").forEach((button) => {
    button.addEventListener("click", () => {
      setDirection(button.dataset.dir);
    });
  });

  startBtn.addEventListener("click", startGame);

  const soundToggle = document.getElementById("soundToggle");
  const bgAudio = document.getElementById("bgAudio");
  const soundIcon = soundToggle.querySelector(".sound-icon");
  const soundHint = document.getElementById("soundHint");

  let soundOn = false;

  function updateSoundButton() {
    soundIcon.textContent = soundOn ? "🔊" : "🔇";
    soundToggle.setAttribute("aria-label", soundOn ? "Mute sound" : "Enable sound");
    soundToggle.title = soundOn ? "Mute sound" : "Enable sound";
  }

  soundToggle.addEventListener("click", async () => {
    soundHint.style.display = "none";
    soundOn = !soundOn;

    if (soundOn) {
      bgAudio.volume = 0.4;
      try {
        await bgAudio.play();
      } catch (error) {
        console.warn("Audio play was blocked until user interaction:", error);
        soundOn = false;
      }
    } else {
      bgAudio.pause();
      bgAudio.currentTime = 0;
    }

    updateSoundButton();
  });

  updateSoundButton();

  createBoard();
  updateBoard();
});
