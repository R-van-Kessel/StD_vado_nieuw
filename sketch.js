const style = document.createElement('style');
style.innerHTML = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
body {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    background: #0e1621;
    font-family: Arial, sans-serif;
    overflow: auto;
    padding: 10px 10px 50px 10px;
    -webkit-touch-callout: none;
    touch-action: manipulation;  /* ← AANGEPAST: manipulation i.p.v. none */
}
canvas {
    display: block;
    position: relative;
    z-index: 1;
    touch-action: none;  /* ← Canvas mag none hebben */
    -webkit-user-select: none;
    user-select: none;
}
button {
    font-family: Arial, sans-serif;
    transition: all 0.2s ease;
    z-index: 1;
    touch-action: manipulation;  /* ← VOEG DIT TOE voor buttons */
}
button:hover {
    opacity: 0.9;
    transform: scale(1.05);
}
button:active {
    transform: scale(0.95);
}

 
 /* ===== NAVIGATIEBALK STYLING ===== */
      
.nav {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 8px 16px;
    background: rgba(11, 19, 29, 0.0);  /* ← 0.5 naar 0.0 = volledig doorzichtig */
    width: fit-content;
    max-width: 90%;
    border-radius: 14px;
    z-index: 10;
    margin-bottom: -20px;
}
.nav a {
    color: white;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);  /* ← iets meer zichtbaar gemaakt */
    font-size: 15px;
    font-weight: bold;
    transition: all 0.3s ease;
    white-space: nowrap;
}
.nav a:hover {
    background: rgba(255, 255, 255, 0.3);  /* ← hover effect sterker */
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.nav a.active {
    background: #ffc107;
    color: #1a237e;
    box-shadow: 0 4px 8px rgba(255, 193, 7, 0.4);
}
`;
document.head.appendChild(style);

/* =====================================
   NAVIGATIEBALK INSTELLEN
===================================== */

// Voeg navigatiebalk toe aan de pagina
function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'nav';
    
    // ⚙️ AANPASSEN: Verander hieronder de links en labels
    nav.innerHTML = `
        <a href="index.html">🏠 Start</a>
        <a href="rekenen.html">➗ Rekenen</a>
        <a href="klas1.html">📘 Klas 1</a>
        <a href="klas2.html">📗 Klas 2</a>
        <a href="klas3.html">📙 Klas 3</a>
        <a href="bovenbouw.html">🎓 Bovenbouw</a>
    `;
    
    document.body.insertBefore(nav, document.body.firstChild);
  
}
// Roep de functie aan zodra pagina laadt
createNavigation();

// VERVANG DE OUDE SPATIE BLOKKERING DOOR DEZE:
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.keyCode === 32) {
        // Alleen toestaan als we in de dino game zitten EN niet game over
        if (showDinoGame && dinoGame && !dinoGame.gameOver) {
            e.preventDefault();
            e.stopPropagation();
            dinoGame.dino.jump();
        } else if (showDinoGame && dinoGame && dinoGame.gameOver) {
            // Tijdens game over: blokkeer spatie volledig
            e.preventDefault();
            e.stopPropagation();
        } else {
            // Buiten game: blokkeer spatie ook
            e.preventDefault();
            e.stopPropagation();
        }
    }
}, true);


/* =====================================
   GRID & LAYOUT INSTELLINGEN
===================================== */

const NAV_OFFSET = 0;   // ← totale hoogte navigatie + marge

// Grid
const COLS = 5;
const ROWS = 4;
const CELL_SIZE = 110;
const MARGIN = 200;

// Verticale ruimte boven grid
const TITLE_SPACE = -80;      // ← hoogte grid
const BUTTON_HEIGHT = 40;   // Hoogte van knoppenrij

// KNOP POSITIES (horizontaal verschuiving vanaf linker marge)
const BUTTON_1_X = 5;      // ← Nakijken knop
const BUTTON_2_X = 140;    // ← Score knop
const BUTTON_3_X = 300;    // ← Reset knop  
const BUTTON_4_X = 450;    // ← Info knop

// KNOP VERTICALE POSITIE (onder de titel)
const BUTTON_Y = 90;    // ← Aanpassen: hoger getal = lager op scherm

// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_LINK = 'https://r-van-kessel.github.io/Summon_the_Dragon/index.html';
const TITLE_SIZE = 30;
const TITLE_COLOR = [255, 200, 100];
const TITLE_Y =10;   // titel hoger/lager

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Los alle sommen op (zonder rekenmachine) om de draak op te roepen!';
const SUBTITLE_SIZE = 14;
const SUBTITLE_COLOR = [255, 200, 100];
const SUBTITLE_Y = 50;   // subtitle afstand

// DRAAK ACHTERGROND INSTELLINGEN - HIER KUN JE AANPASSEN!
const DRAGON_SCALE_X = 0.9;    // ← Horizontale schaal: 1.0=normaal, 1.5=breder, 0.5=smaller
const DRAGON_SCALE_Y = 0.8;    // ← Verticale schaal: 1.0=normaal, 1.5=hoger, 0.5=korter
const DRAGON_X_OFFSET = 50;     // ← Horizontaal: negatief=links, positief=rechts (bijv. -100 of 150)
const DRAGON_Y_OFFSET = -90;     // ← Verticaal: negatief=omhoog, positief=omlaag (bijv. -50 of 100)
const DRAGON_OPACITY = 200;    // ← Transparantie: 0=onzichtbaar, 255=volledig zichtbaar, 150=half
const DRAGON_BLUR = true;     // ← true = achtergrond wazig, false = scherp

// ============================================

let blocks = [];
let draggingBlock = null;
let offsetX = 0;
let offsetY = 0;
let checkButton;
let resetButton;
let scoreButton;
let infoButton;
let isChecked = false;
let correctCount = 0;
let isFlashing = false;
let flashCounter = 0;

let dinoGame = null;
let showDinoGame = false;
let totalGamesPlayed = 0;
let dinoGameCount = 0;
let dinoImage = null;
let backgroundImage = null;
let bgLoaded = false;

class Dino {
  constructor() {
    this.x = 100;this.x = MARGIN + (COLS * CELL_SIZE) / 4;  // ← 25% van grid breedte
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;
  }

 jump() {
    if (this.onGround) {
        if (this.onPlatform) {
            this.vy = this.jumpPower * 1.2;
            this.onPlatform = false;
        } else {
            this.vy = this.jumpPower;
        }
        this.onGround = false;
    }
}        

  update() {
    this.vy += this.gravity;
    this.y += this.vy;

    if (this.y >= 0) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
      this.onPlatform = false;
    }
    
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
  }

  draw(gameY) {
    push();
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;
    
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width/2, drawY + this.height + 2, this.width * 0.8, 10);
    
    if (dinoImage) {
      imageMode(CORNER);
      image(dinoImage, this.x, drawY, this.width, this.height);
    } else {
      textAlign(CENTER, CENTER);
      textSize(this.height);
      text('🦖', this.x + this.width/2, drawY + this.height/2);
    }
    
    pop();
  }

  getBottom(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y + this.height;
  }

  getTop(gameY) {
    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    return groundY + this.y;
  }
}

class Obstacle {
  constructor(type, xPos) {
    this.type = type;
    this.x = xPos;
    this.scored = false;

    if (type === 'low') {
      this.width = 100;
      this.height = 40;
      this.isPlatform = false;
    } else if (type === 'high') {
      this.width = 25;
      this.height = 80;
      this.isPlatform = false;
    } else if (type === 'platform') {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;
    }
  }

  update(speed) {
    this.x -= speed;
  }

  draw(gameY) {
    push();
    
        
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + CELL_SIZE;
      rect(this.x, platformY, this.width, this.height, 4);
    } else {
      fill(231, 76, 60);
      noStroke();
      let obsY = gameY + (CELL_SIZE * 2) - this.height;
      rect(this.x, obsY, this.width, this.height);
    }
    pop();
  }

  hits(dino, gameY) {
    if (this.isPlatform) {
      let platformTop = gameY + CELL_SIZE;
      let platformBottom = gameY + CELL_SIZE + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      
      if (dino.vy >= 0 && 
          dinoBottom >= platformTop - 3 && 
          dinoBottom <= platformTop + 3 &&
          horizontalOverlap) {
        
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      
      if (dino.vy < 0 && 
          dinoTop <= platformBottom + 5 && 
          dinoTop >= platformTop &&
          horizontalOverlap) {
        
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }
      
      return false;
    } else {
      let obsTop = gameY + (CELL_SIZE * 2) - this.height;
      let obsBottom = gameY + (CELL_SIZE * 2);
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      if (dino.x + dino.width > this.x && 
          dino.x < this.x + this.width &&
          dinoBottom > obsTop && 
          dinoTop < obsBottom) {
        return true;
      }
    }
    return false;
  }

  isOffScreen() {
    return this.x + this.width < MARGIN;  // Links van grid
  }
}

class DinoGame {
  constructor() {
    this.dino = new Dino();
    this.obstacles = [];
    this.gameOver = false;
    this.score = 0;
    this.gameSpeed = 6;
    this.spawnTimer = 0;
    this.gamesPlayed = 0;
    this.maxGames = 3;
    this.gameOverTimer = 0;  // ← NIEUW: timer voor game over
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    this.gameOverTimer = 0;  // ← RESET de timer
    
    if (this.gamesPlayed >= this.maxGames) {
      this.score = 0;
      this.gameSpeed = 6;
      this.gamesPlayed = 0;
    }
}
  
  spawnObstacles() {
    let rand = random();
    
    let spawnX = MARGIN + COLS * CELL_SIZE - 50;  // Binnen de grid
    
    if (rand < 0.4) {
      this.obstacles.push(new Obstacle('low', MARGIN + COLS * CELL_SIZE));
    } else if (rand < 0.7) {
      this.obstacles.push(new Obstacle('high', MARGIN + COLS * CELL_SIZE));
    } else {
      let platform = new Obstacle('platform', MARGIN + COLS * CELL_SIZE);
      this.obstacles.push(platform);
      let followUp = new Obstacle(random() < 0.5 ? 'low' : 'high', MARGIN + COLS * CELL_SIZE + 250);
      this.obstacles.push(followUp);
    }
  }

  update(gameY) {
    if (this.gameOver) {
        this.gameOverTimer++;  // ← Tel frames na game over
        
        // Automatisch naar volgende game na 2 seconden (120 frames bij 60fps)
        if (this.gameOverTimer >= 120) {
            if (this.gamesPlayed < this.maxGames) {
                this.reset();
            }
            // Als gamesPlayed >= maxGames: blijf op game over scherm
        }
        return;
    }

    this.dino.update();
    
    this.spawnTimer++;
    let spawnInterval = max(40, 80 - floor(this.score / 5) * 5);
    if (this.spawnTimer > spawnInterval) {
        this.spawnObstacles();
        this.spawnTimer = 0;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
        let obs = this.obstacles[i];
        obs.update(this.gameSpeed);

        if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
            this.gameOver = true;
            this.gamesPlayed++;
            this.gameOverTimer = 0;  // ← START de timer
        } else if (obs.isPlatform) {
            obs.hits(this.dino, gameY);
        }

        if (!obs.scored && !obs.isPlatform && obs.x + obs.width < this.dino.x) {
            obs.scored = true;
            this.score++;
        }

        if (obs.isOffScreen()) {
            this.obstacles.splice(i, 1);
        }
    }

    if (frameCount % 180 === 0) {
        this.gameSpeed = min(this.gameSpeed + 0.5, 15);
    }
}

  draw(gameY) {
    push();
    
    // Clip alles buiten de grid
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    drawingContext.clip();
    
    fill(135, 206, 235);
    noStroke();
    rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
    
    fill(139, 69, 19);
    rect(MARGIN, gameY + (CELL_SIZE * 2) - 10, COLS * CELL_SIZE, 10);

    for (let obs of this.obstacles) {
      obs.draw(gameY);
    }
    
    this.dino.draw(gameY);
    drawingContext.restore();  // ← VOEG DIT TOE na dino.draw()
    
    fill(51);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    textStyle(BOLD);
    text('Score: ' + this.score, MARGIN + 10, gameY + 10);
    
    textSize(14);
    textStyle(NORMAL);
    fill(85);
    text('Games: ' + this.gamesPlayed + '/' + this.maxGames, MARGIN + 10, gameY + 30);
    text('Speed: ' + nf(this.gameSpeed, 1, 1), MARGIN + 10, gameY + 50);
  
    if (this.gameOver) {
      fill(0, 0, 0, 180);
      rect(MARGIN, gameY, COLS * CELL_SIZE, CELL_SIZE * 2);
      
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(28);
      textStyle(BOLD);
      text('GAME OVER!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE - 20);
      
      textSize(18);
      textStyle(NORMAL);
      text('Score: ' + this.score, MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 10);
      text('Komt er nog een dragon?', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 35);
      
      if (this.gamesPlayed >= this.maxGames) {
        fill(243, 156, 18);
        textSize(18);
        textStyle(BOLD);
        text('Nee, klik nu op rode reset knop!', MARGIN + (COLS * CELL_SIZE) / 2, gameY + CELL_SIZE + 65);
      }
    }
    
    pop();
  }
} 
  
// Voorkom dat spatie de pagina scrollt
document.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.keyCode === 32) {
        if (showDinoGame && dinoGame) {
            e.preventDefault();
        }
    }
}, false);

function styleButton(btn, bgColor, padding) {
    btn.style('padding', padding);
    btn.style('font-size', '16px');
    btn.style('cursor', 'pointer');
    btn.style('background-color', bgColor);
    btn.style('color', 'white');
    btn.style('border', 'none');
    btn.style('border-radius', '8px');
    btn.style('position', 'absolute');  // ← was 'fixed', nu 'absolute'
}



function checkAnswers() {
    isChecked = true;
    correctCount = 0;

    for (let block of blocks) block.isCorrect = null;

    for (let questionBlock of blocks) {
        if (questionBlock.isQuestion) {
            let answerBlock = null;
            for (let block of blocks) {
                if (!block.isQuestion && block.col === questionBlock.col && block.row === questionBlock.row) {
                    answerBlock = block;
                    break;
                }
            }

            if (answerBlock && questionBlock.answer === answerBlock.answer) {
                questionBlock.isCorrect = true;
                answerBlock.isCorrect = true;
                correctCount++;
            } else {
                questionBlock.isCorrect = false;
                if (answerBlock) answerBlock.isCorrect = false;
            }
        }
    }

    if (scoreButton && scoreButton.elt) {
        scoreButton.elt.textContent = 'Score: ' + correctCount + '/10';
    }

    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        if (scoreButton && scoreButton.elt) {
            scoreButton.style('background-color', '#FFD700');
        }
    }
}

function resetGame() {
    showDinoGame = false;
    dinoGame = null;
    generateQuestions();
}

function showInfo() {

    let overlay = document.createElement('div');
    overlay.id = 'infoOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    let popup = document.createElement('div');
    popup.id = 'infoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid #333;
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="margin-top: 0;">
        <a href="https://r-van-kessel.github.io/Summon_the_Dragon/index.html" target="_blank" style="color: #F44336; text-decoration: none; cursor:pointer;">Summon the Dragon</a>
        </h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 sommen correct op en speel de Dragon game!</ol><br><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe somblokjes naar de juiste oranje antwoorden.</li>
                <li>Klik "Nakijken" om je antwoorden te controleren.</li>
                <li>Klik op "Score" voor feedback op je resultaat.</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch!</li>
            </ol><br> 
            <strong>Dragon Game:<br></strong> Spring met spatie of muisklik.<br> Spring op de hoge gele trampolines voor extra boost!<br>
            Na 3 game-overs komt er een volledige reset.<br>
            <ol style="color: #F44336; margin: 5px 0;">
            </ol><br>
            <strong>Reset:<br></strong> Klik "Reset" voor nieuwe sommen.
            </ol>
        </p>
        <button id="closeBtn" style="
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    document.getElementById('closeBtn').addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // BELANGRIJKE WIJZIGING: Verwijder de overlay click ALLEEN bij klikken buiten de popup
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
}

function showScoreFeedback() {
    // Alleen tonen als er gecontroleerd is
    if (!isChecked) {
        return; // Doe niets als er nog niet gecontroleerd is
    }
    
    // Bepaal feedback op basis van score
    let feedbackTitle = '';
    let feedbackText = '';
    let feedbackColor = '';
    
    if (correctCount === 0) {
        feedbackTitle = '😢 Oeps! 0/10';
        feedbackText = 'Nog geen enkele som goed! Probeer de blauwe somblokjes te slepen naar de juiste oranje antwoorden. Kijk goed naar de sommen en reken ze uit zonder rekenmachine!';
        feedbackColor = '#e74c3c';
    } else if (correctCount <= 3) {
        feedbackTitle = '😕 Goede poging! ' + correctCount + '/10';
        feedbackText = 'Je hebt er al één, twee of drie goed, maar ik weet dat jij beter kunt! Zet je berekeningen eerst op papier en controleer je antwoord goed. Het gaat je lukken!';
        feedbackColor = '#e67e22';
    } else if (correctCount <= 5) {
        feedbackTitle = '🙂 Halfway! ' + correctCount + '/10';
        feedbackText = 'Je hebt (bijna) de helft goed! Goed bezig, maar nu wil je het nog beter kunnen. Werk nauwkeurig en check je berekeningen!';
        feedbackColor = '#f39c12';
    } else if (correctCount <= 7) {
        feedbackTitle = '😊 Goed bezig! ' + correctCount + '/10';
        feedbackText = 'Wow, meer dan de helft goed! Je bent er bijna. Jij kunt dit, nu geen slordigheidsfoutjes meer. Ga voor de perfecte score';
        feedbackColor = '#3498db';
    } else if (correctCount <= 9) {
        feedbackTitle = '🤩 Bijna perfect! ' + correctCount + '/10';
        feedbackText = 'Fantastisch! Je hebt ze bijna allemaal goed. Nog even opletten bij de laatste paar en dan mag jij de Dragon game spelen!';
        feedbackColor = '#2ecc71';
    }
    // Score 10 wordt niet getoond omdat de game dan automatisch start
    
    // Maak overlay
    let overlay = document.createElement('div');
    overlay.id = 'scoreOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
    `;
    document.body.appendChild(overlay);
    
    // Maak popup
    let popup = document.createElement('div');
    popup.id = 'scorePopup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 3px solid ${feedbackColor};
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    popup.innerHTML = `
        <h2 style="margin-top: 0; color: ${feedbackColor};">
            ${feedbackTitle}
        </h2>
        <p style="color: #333; line-height: 1.6; font-size: 16px;">
            ${feedbackText}
        </p>
        <button id="closeFeedbackBtn" style="
            background-color: ${feedbackColor};
            color: white;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 20px;
        ">Sluiten</button>
    `;
    
    document.body.appendChild(popup);
    
    // Sluit popup bij klik op knop
    document.getElementById('closeFeedbackBtn').addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // Sluit popup bij klik op overlay
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
}

function keyPressed(event) {
    // Laat de window event listener het afhandelen
    return false;
}

function generateQuestions() {
    blocks = [];
    isChecked = false;
    correctCount = 0;
    isFlashing = false;
    flashCounter = 0;

    if (scoreButton && scoreButton.elt) scoreButton.elt.textContent = 'Score: 0/10';
    scoreButton.style('background-color', '#9C27B0');

    let questions = [];
    let answers = [];

    for (let i = 0; i < 10; i++) {
        let operation = floor(random(4));
        let num1, num2, answer, text;

        if (operation === 0) {
            num1 = floor(random(1, 100));
            num2 = floor(random(1, 100));
            answer = num1 + num2;
            text = num1 + " + " + num2;
        } else if (operation === 1) {
            num1 = floor(random(10, 100));
            num2 = floor(random(1, num1));
            answer = num1 - num2;
            text = num1 + " - " + num2;
        } else if (operation === 2) {
            num1 = floor(random(2, 50));
            num2 = floor(random(2, 50));
            answer = num1 * num2;
            text = num1 + " × " + num2;
        } else {
            num2 = floor(random(2, 20));
            answer = floor(random(2, 20));
            num1 = num2 * answer;
            text = num1 + " ÷ " + num2;
        }

        questions.push({ text: text, answer: answer });
        answers.push(answer);
    }

    answers = shuffle(answers);

    let questionIndex = 0;
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < COLS; col++) {
            blocks.push({
                col: col,
                row: row,
                startCol: col,
                startRow: row,
                x: MARGIN + col * CELL_SIZE,
                y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
                isDragging: false,
                isPlaced: false,
                text: questions[questionIndex].text,
                answer: questions[questionIndex].answer,
                isQuestion: true,
                isCorrect: null,
                isHovered: false,
                hoverProgress: 0,

            });
            questionIndex++;
        }
    }

    let answerIndex = 0;
    for (let row = 2; row < 4; row++) {
        for (let col = 0; col < COLS; col++) {
            blocks.push({
                col: col,
                row: row,
                startCol: col,
                startRow: row,
                x: MARGIN + col * CELL_SIZE,
                y: MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE,
                isDragging: false,
                isPlaced: true,
                text: "" + answers[answerIndex],
                answer: answers[answerIndex],
                isQuestion: false,
                isCorrect: null,
                isHovered: false,
                hoverProgress: 0,
            });
            answerIndex++;
        }
    }
}


function setup() {
    // Maak een container div die alles bevat
    let container = createDiv();
    container.style('position', 'relative');
    container.style('display', 'inline-block');
    container.style('margin', '20px auto');  // ← voor centreren
    
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(container);  // ← canvas IN de container
    
    // Laad achtergrond
    loadImage('background_dragon.png', 
      (img) => { backgroundImage = img; bgLoaded = true; },
      () => {
        loadImage('background_dragon.png', 
          (img) => { backgroundImage = img; bgLoaded = true; }
        );
      }
    );
    
    // Laad dino
    loadImage('dino.png', (img) => { dinoImage = img; });
    
    // BUTTONS - nu binnen dezelfde container als canvas
    checkButton = createButton('Nakijken');
    checkButton.parent(container);  // ← in container!
    checkButton.mousePressed(checkAnswers);
    styleButton(checkButton, '#4CAF50', '10px 15px');
    checkButton.position(MARGIN + BUTTON_1_X, BUTTON_Y);
    
    scoreButton = createButton('Score: 0/10');
    scoreButton.parent(container);
    scoreButton.mousePressed(showScoreFeedback);
    styleButton(scoreButton, '#9C27B0', '10px 15px');
    scoreButton.style('height', '38px');  
    scoreButton.style('min-height', '38px');  
    scoreButton.position(MARGIN + BUTTON_2_X, BUTTON_Y);
    
    resetButton = createButton('Reset');
    resetButton.parent(container);  // ← in container!
    resetButton.mousePressed(resetGame);
    styleButton(resetButton, '#f44336', '10px 15px');
    resetButton.position(MARGIN + BUTTON_3_X, BUTTON_Y);
    
    infoButton = createButton('ℹ Info');
    infoButton.parent(container);  // ← in container!
    infoButton.mousePressed(showInfo);
    styleButton(infoButton, '#03A9F4', '10px 15px');
    infoButton.position(MARGIN + BUTTON_4_X, BUTTON_Y);
  
  // Voorkom dat spatie buttons activeert
    if (checkButton && checkButton.elt) {
        checkButton.elt.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
            }
        });
    }
    if (resetButton && resetButton.elt) {
        resetButton.elt.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
            }
        });
    }
    if (scoreButton && scoreButton.elt) {
        scoreButton.elt.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
            }
        });
    }
    if (infoButton && infoButton.elt) {
        infoButton.elt.addEventListener('keydown', function(e) {
            if (e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
            }
        });
    }
    
    generateQuestions();
    
    // Achtergrondkleur
    document.body.style.backgroundColor = '#0e1621';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
}

  
  function draw() {
    // === GLOBALE DRAW VARIABELEN ===
    let titleWidth = 0;
    let titleX = width / 2;

    // ====== ACHTERGROND TEKENEN ======
    // ALTIJD eerst de donkere achtergrond
    background(14, 22, 33);  // ← Donkere achtergrond ALTIJD, niet alleen bij geen image
    
    if (bgLoaded && backgroundImage) {
        push();
        
        // Bereken geschaalde dimensies met aparte X en Y schaal
        let scaledW = width * DRAGON_SCALE_X;
        let scaledH = height * DRAGON_SCALE_Y;
        
        // Bereken positie (center + offset)
        let imgX = (width - scaledW) / 2 + DRAGON_X_OFFSET;
        let imgY = (height - scaledH) / 2 + DRAGON_Y_OFFSET;
        
        // Pas transparantie toe
        tint(255, DRAGON_OPACITY);
        
        // Teken de draak
        imageMode(CORNER);
        image(backgroundImage, imgX, imgY, scaledW, scaledH);
        
        noTint();
        
        // Optionele blur overlay
        if (DRAGON_BLUR) {
            fill(14, 22, 33, 100);
            noStroke();
            rect(0, 0, width, height);
        }
        
        pop();
    }
    
  
    // ====== TITEL EN ONDERTITEL TEKENEN ======
   push();
// TITEL (klikbaar)
fill(TITLE_COLOR[0], TITLE_COLOR[1], TITLE_COLOR[2]);
textAlign(CENTER, TOP);
textSize(TITLE_SIZE);
textStyle(BOLD);

// Bereken titleWidth NA textSize
titleWidth = textWidth(TITLE_TEXT);
titleX = width / 2;
isHoveringTitle = mouseX > titleX - titleWidth/2 && 
                      mouseX < titleX + titleWidth/2 && 
                      mouseY > TITLE_Y && 
                      mouseY < TITLE_Y + TITLE_SIZE;


text(TITLE_TEXT, width / 2, TITLE_Y);

// SUBTITLE
fill(SUBTITLE_COLOR[0], SUBTITLE_COLOR[1], SUBTITLE_COLOR[2]);
textSize(SUBTITLE_SIZE);
textStyle(NORMAL);
text(SUBTITLE_TEXT, width / 2, SUBTITLE_Y);
pop();
    
    // ====== GRID TEKENEN ======
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = MARGIN + col * CELL_SIZE;
            const y = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            if (showDinoGame && (row === 0 || row === 1)) continue;
            if (row >= 2) {
                fill(200, 220, 200, 0);  // Groen vakje (antwoorden)
            } else {
                fill(220, 220, 200, 0);  // ← TRANSPARANT!
            }
            stroke(100, 100, 100, 0);
            strokeWeight(2);
            rect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }
    
    // ====== HOVER DETECTIE VOOR BLOKKEN ======
for (let block of blocks) {
    block.isHovered = false;
  // ====== HOVER EASING ======
for (let block of blocks) {
    const target = block.isHovered ? 1 : 0;
    block.hoverProgress = lerp(block.hoverProgress, target, 0.01); //hover transform snelheid
}


    if (
        !showDinoGame &&
        block.isQuestion &&
        block.row < 2 &&
        !draggingBlock &&
        mouseX >= block.x &&
        mouseX <= block.x + CELL_SIZE &&
        mouseY >= block.y &&
        mouseY <= block.y + CELL_SIZE
    ) {
        block.isHovered = true;
    }
}

    // ====== BLOKKEN TEKENEN ======
    for (let block of blocks) {
        if (!block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 0 || block.row === 1)) continue;
            drawBlock(block);
        }
    }

    for (let block of blocks) {
        if (block.isQuestion && block !== draggingBlock) {
            if (showDinoGame && (block.row === 0 || block.row === 1)) continue;
            drawBlock(block);
        }
    }

    // ====== FLASHING EFFECT ======
    if (isFlashing) {
    flashCounter++;
    if (flashCounter % 20 < 10) {
        fill(255, 255, 0, 150);
        noStroke();
        rect(0, 0, width, height);
    }
    if (flashCounter > 100) {
        isFlashing = false;
        flashCounter = 0;
        
        // Check of er al games gespeeld zijn OF een game actief is
        if (totalGamesPlayed >= 1 || dinoGame !== null) {
            // Doe niets, de game is al actief
            // Zorg dat de game weer zichtbaar wordt
            showDinoGame = true;
        } else {
            // Start alleen de game als er nog geen games gespeeld zijn
            showDinoGame = true;
            dinoGame = new DinoGame();
        }
    }
}
    // ====== DINO GAME TEKENEN ======
    if (showDinoGame && dinoGame) {
        const gameY = MARGIN + BUTTON_HEIGHT + TITLE_SPACE;
        dinoGame.update(gameY);
        dinoGame.draw(gameY);
    }

    // ====== DRAGGING BLOCK ======
    if (draggingBlock) {
        drawBlock(draggingBlock);
    }
  
// ====== CURSOR LOGICA (ALTIJD ALS LAATSTE) ======
let showHandCursor = false;

// Hover over blauwe vraagblokken
if (!showDinoGame) {
    for (let block of blocks) {
        if (
            block.isQuestion &&
            block.row < 2 &&
            mouseX >= block.x &&
            mouseX <= block.x + CELL_SIZE &&
            mouseY >= block.y &&
            mouseY <= block.y + CELL_SIZE
        ) {
            showHandCursor = true;
            break;
        }
    }
}

  
// Tijdens slepen
if (draggingBlock) {
    showHandCursor = true;
}

// Cursor instellen
cursor(showHandCursor ? HAND : ARROW);
  }


function drawBlock(block) {
    push();

let lift = -6 * block.hoverProgress;
let scaleAmount = 1 + 0.05 * block.hoverProgress;

translate(
    block.x + CELL_SIZE / 2,
    block.y + CELL_SIZE / 2 + lift
);
scale(scaleAmount);
translate(-CELL_SIZE / 2, -CELL_SIZE / 2);

drawingContext.shadowBlur = 15 * block.hoverProgress;
drawingContext.shadowColor = 'rgba(0,0,0,0.4)';


    // ===== KLEUR =====
    if (isChecked && block.isCorrect !== null) {
        fill(block.isCorrect ? [100, 200, 100] : [250, 100, 100]);
    } else if (block.isQuestion) {
        fill(100, 150, 250);
    } else {
        fill(255, 200, 100);
    }

    // ===== SCHADUW BIJ HOVER =====
    if (block.isHovered) {
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(0,0,0,0.4)';
    } else {
        drawingContext.shadowBlur = 0;
    }

    stroke(50, 100, 200);
    strokeWeight(3);
    rect(5, 5, CELL_SIZE - 10, CELL_SIZE - 10, 5);

    // ===== TEKST =====
    drawingContext.shadowBlur = 0;
    fill(47, 79, 79);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(16);
    text(block.text, CELL_SIZE / 2, CELL_SIZE / 2);

    pop();
}

function checkAnswers() {
    isChecked = true;
    correctCount = 0;

    for (let block of blocks) block.isCorrect = null;

    for (let questionBlock of blocks) {
        if (questionBlock.isQuestion) {
            let answerBlock = null;
            for (let block of blocks) {
                if (!block.isQuestion && block.col === questionBlock.col && block.row === questionBlock.row) {
                    answerBlock = block;
                    break;
                }
            }

            if (answerBlock && questionBlock.answer === answerBlock.answer) {
                questionBlock.isCorrect = true;
                answerBlock.isCorrect = true;
                correctCount++;
            } else {
                questionBlock.isCorrect = false;
                if (answerBlock) answerBlock.isCorrect = false;
            }
        }
    }

    if (scoreButton && scoreButton.elt) {
        scoreButton.elt.textContent = 'Score: ' + correctCount + '/10';
    }

    if (correctCount === 10) {
        isFlashing = true;
        flashCounter = 0;
        if (scoreButton && scoreButton.elt) {
            scoreButton.style('background-color', '#FFD700');
        }
    }
}
   
function mousePressed() {
    // Check of er op de titel geklikt wordt
    textSize(TITLE_SIZE);
    let titleWidth = textWidth(TITLE_TEXT);
    let titleX = width / 2;
    
    if (mouseX > titleX - titleWidth/2 && 
        mouseX < titleX + titleWidth/2 && 
        mouseY > TITLE_Y && 
        mouseY < TITLE_Y + TITLE_SIZE) {
        window.open('https://r-van-kessel.github.io/Summon_the_Dragon/index.html', '_blank');
        return false;
    }
    
    if (document.getElementById('infoPopup')) return false;
    if (document.getElementById('scorePopup')) return false;  // ← VOEG DIT TOE

    if (showDinoGame && dinoGame) {
        // Alleen springen als NIET game over
        if (!dinoGame.gameOver) {
            dinoGame.dino.jump();
        }
        return false;
    }

    if (!showDinoGame) {
        for (let i = blocks.length - 1; i >= 0; i--) {
            let block = blocks[i];
            if (mouseX > block.x && mouseX < block.x + CELL_SIZE && mouseY > block.y && mouseY < block.y + CELL_SIZE) {
                if (block.isQuestion && !block.isDragging && block.row < 2) {
                    draggingBlock = block;
                    offsetX = mouseX - block.x;
                    offsetY = mouseY - block.y;
                    block.isDragging = true;
                    block.isCorrect = null;
                    isChecked = false;
                    break;
                }
            }
        }
    }
    return false;
}       
                   
function mouseDragged() {
    if (document.getElementById('infoPopup')) return false;
    if (draggingBlock) {
        draggingBlock.x = mouseX - offsetX;
        draggingBlock.y = mouseY - offsetY;
    }
    return false;
}
function mouseReleased() {
    if (document.getElementById('infoPopup')) return false;

    if (draggingBlock) {
        draggingBlock.isDragging = false;
        let snapped = false;
        for (let row = 2; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cellX = MARGIN + col * CELL_SIZE;
                const cellY = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
                const centerX = draggingBlock.x + CELL_SIZE / 2;
                const centerY = draggingBlock.y + CELL_SIZE / 2;

                if (centerX > cellX && centerX < cellX + CELL_SIZE && centerY > cellY && centerY < cellY + CELL_SIZE) {
                    let occupied = false;
                    for (let other of blocks) {
                        if (other !== draggingBlock && other.isQuestion && other.col === col && other.row === row) {
                            occupied = true;
                            break;
                        }
                    }

                    if (!occupied) {
                        draggingBlock.x = cellX;
                        draggingBlock.y = cellY;
                        draggingBlock.col = col;
                        draggingBlock.row = row;
                        draggingBlock.isPlaced = true;
                        draggingBlock.startCol = col;
                        draggingBlock.startRow = row;
                        snapped = true;
                        break;
                    }
                }
            }
            if (snapped) break;
        }

        if (!snapped) {
            draggingBlock.x = MARGIN + draggingBlock.startCol * CELL_SIZE;
            draggingBlock.y = MARGIN + draggingBlock.startRow * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            draggingBlock.col = draggingBlock.startCol;
            draggingBlock.row = draggingBlock.startRow;
            draggingBlock.isPlaced = false;
        }

        draggingBlock = null;
    }
    return false;
}

function touchStarted() {
    // Check of er op de titel geklikt wordt
    textSize(TITLE_SIZE);
    let titleWidth = textWidth(TITLE_TEXT);
    let titleX = width / 2;
    
    if (touches.length > 0) {
        let touch = touches[0];
        
        if (touch.x > titleX - titleWidth/2 && 
            touch.x < titleX + titleWidth/2 && 
            touch.y > TITLE_Y && 
            touch.y < TITLE_Y + TITLE_SIZE) {
            window.open('https://r-van-kessel.github.io/Summon_the_Dragon/index.html', '_blank');
            return false;
        }
    }
    
    if (document.getElementById('infoPopup')) return false;
    if (document.getElementById('scorePopup')) return false;

    if (showDinoGame && dinoGame) {
        // Alleen springen als NIET game over
        if (!dinoGame.gameOver) {
            dinoGame.dino.jump();
        }
        return false;
    }

    if (!showDinoGame && touches.length > 0) {
        let touch = touches[0];
        for (let i = blocks.length - 1; i >= 0; i--) {
            let block = blocks[i];
            if (touch.x > block.x && touch.x < block.x + CELL_SIZE && 
                touch.y > block.y && touch.y < block.y + CELL_SIZE) {
                if (block.isQuestion && !block.isDragging && block.row < 2) {
                    draggingBlock = block;
                    offsetX = touch.x - block.x;
                    offsetY = touch.y - block.y;
                    block.isDragging = true;
                    block.isCorrect = null;
                    isChecked = false;
                    break;
                }
            }
        }
    }
    return false;
}

function touchMoved() {
    if (document.getElementById('infoPopup')) return false;
    if (document.getElementById('scorePopup')) return false;
    
    if (draggingBlock && touches.length > 0) {
        let touch = touches[0];
        draggingBlock.x = touch.x - offsetX;
        draggingBlock.y = touch.y - offsetY;
    }
    return false;
}

function touchEnded() {
    if (document.getElementById('infoPopup')) return false;
    if (document.getElementById('scorePopup')) return false;

    if (draggingBlock) {
        draggingBlock.isDragging = false;
        let snapped = false;
        for (let row = 2; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cellX = MARGIN + col * CELL_SIZE;
                const cellY = MARGIN + row * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
                const centerX = draggingBlock.x + CELL_SIZE / 2;
                const centerY = draggingBlock.y + CELL_SIZE / 2;

                if (centerX > cellX && centerX < cellX + CELL_SIZE && 
                    centerY > cellY && centerY < cellY + CELL_SIZE) {
                    let occupied = false;
                    for (let other of blocks) {
                        if (other !== draggingBlock && other.isQuestion && 
                            other.col === col && other.row === row) {
                            occupied = true;
                            break;
                        }
                    }

                    if (!occupied) {
                        draggingBlock.x = cellX;
                        draggingBlock.y = cellY;
                        draggingBlock.col = col;
                        draggingBlock.row = row;
                        draggingBlock.isPlaced = true;
                        draggingBlock.startCol = col;
                        draggingBlock.startRow = row;
                        snapped = true;
                        break;
                    }
                }
            }
            if (snapped) break;
        }

        if (!snapped) {
            draggingBlock.x = MARGIN + draggingBlock.startCol * CELL_SIZE;
            draggingBlock.y = MARGIN + draggingBlock.startRow * CELL_SIZE + BUTTON_HEIGHT + TITLE_SPACE;
            draggingBlock.col = draggingBlock.startCol;
            draggingBlock.row = draggingBlock.startRow;
            draggingBlock.isPlaced = false;
        }

        draggingBlock = null;
    }
    return false;
}