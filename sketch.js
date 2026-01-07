/* ======================
   GLOBAL STYLE
====================== */
const style = document.createElement('style');
style.textContent = `
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
  padding: 10px 10px 50px;
}

button {
  height: 38px;
  cursor: pointer;
  transition: transform .2s ease, opacity .2s ease;
}

button:hover { transform: scale(1.15); }
button:active { transform: scale(0.95); }

.nav {
  display: flex;
  gap: 10px;
  padding: 8px 16px;
  margin-bottom: -20px;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  background: rgba(255,255,255,.15);
  font-weight: bold;
}
.nav a:hover { background: rgba(255,255,255,.5); }
`;
document.head.appendChild(style);

/* viewport */
let meta = document.querySelector('meta[name="viewport"]');
if (!meta) {
  meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1';
  document.head.appendChild(meta);
}

/* =====================================
   NAVIGATIEBALK INSTELLEN
===================================== */

// Voeg navigatiebalk toe aan de pagina
function createNavigation() {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/">🏠 Home</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/rekenen.html">➗ Rekenen</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas1.html">📘 Klas 1</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas2.html">📗 Klas 2</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/klas3.html">📙 Klas 3</a>
    <a href="https://r-van-kessel.github.io/Summon_the_Dragon/bovenbouw.html">🎓 Bovenbouw</a>
  `;
  document.body.prepend(nav);
}
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


// Grid
const COLS = 5;
const ROWS = 4;
const CELL_SIZE = 140;
const MARGIN = 200;

// Verticale ruimte boven grid
const TITLE_SPACE = -60;      // ← hoogte grid
const BUTTON_HEIGHT = 40;   // Hoogte van knoppenrij

// KNOP POSITIES (horizontaal verschuiving vanaf linker marge)
const BUTTON_1_X = 90;      // ← Nakijken knop
const BUTTON_2_X = 240;    // ← Score knop
const BUTTON_3_X = 410;    // ← Reset knop  
const BUTTON_4_X = 540;    // ← Info knop

// KNOP VERTICALE POSITIE (onder de titel)
const BUTTON_Y = 110;    // ← Aanpassen: hoger getal = lager op scherm

// TITEL INSTELLINGEN
const TITLE_TEXT = 'Summon the Dragon';
const TITLE_LINK = 'https://r-van-kessel.github.io/Summon_the_Dragon/index.html';
const TITLE_SIZE = 30;
const TITLE_COLOR = [255, 200, 100];
const TITLE_Y = 30;   // titel hoger/lager

// ONDERTITEL INSTELLINGEN
const SUBTITLE_TEXT = 'Los alle sommen op (zonder rekenmachine) om de draak op te roepen!';
const SUBTITLE_SIZE = 14;
const SUBTITLE_COLOR = [255, 200, 100];
const SUBTITLE_Y = 70;   // subtitle afstand

const DINO_ZONE = {
    xRatio: 0.98,   
    yRatio: 0.47,   
    wRatio: 0.01,   
    hRatio: 0.01    
};

// DRAAK ACHTERGROND INSTELLINGEN - HIER KUN JE AANPASSEN!
const DRAGON_SCALE_X = 0.9;    // ← Horizontale schaal: 1.0=normaal, 1.5=breder, 0.5=smaller
const DRAGON_SCALE_Y = 0.9;    // ← Verticale schaal: 1.0=normaal, 1.5=hoger, 0.5=korter
const DRAGON_X_OFFSET = 50;     // ← Horizontaal: negatief=links, positief=rechts (bijv. -100 of 150)
const DRAGON_Y_OFFSET = -80;     // ← Verticaal: negatief=omhoog, positief=omlaag (bijv. -50 of 100)
const DRAGON_OPACITY = 250;    // ← Transparantie: 0=onzichtbaar, 255=volledig zichtbaar, 150=half
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
    this.x = MARGIN + (COLS * CELL_SIZE) / 4;
    this.y = 0;
    this.width = 50;
    this.height = 53;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpPower = -15;
    this.onGround = true;
    this.onPlatform = false;
    this.legFrame = 0;

    // ===== INVINCIBLE STATUS =====
    this.invincible = false;
    this.invincibleUntil = 0;

    // ===== INSTELBAAR =====
    this.invincibleDuration = 3000; //aanpassen invisible tijd van 3 sec
    this.invincibleFlickerSpeed = 100;
  }

  activateInvincible() {
    this.invincible = true;
    this.invincibleUntil = millis() + this.invincibleDuration;
  }

  update() {
    // fps-safe timer
    if (this.invincible && millis() > this.invincibleUntil) {
      this.invincible = false;
    }

    this.vy += this.gravity;
    this.y += this.vy;

    // Check if on ground (and not on a platform)
    if (this.y >= 0 && !this.onPlatform) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
    }
    
    // If falling past ground level, reset platform status
    if (this.y > 0) {
      this.onPlatform = false;
    }
    
    if (this.onGround && frameCount % 6 === 0) {
      this.legFrame = (this.legFrame + 1) % 2;
    }
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

  draw(gameY) {
    push();

    let groundY = gameY + (CELL_SIZE * 2) - this.height;
    let drawY = groundY + this.y;

    // Schaduw onder voeten//
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(this.x + this.width / 2, drawY + this.height + 2, this.width * 0.6, 10); 

    // Flikker logica
    let flickerOn = true;
    if (this.invincible) {
      flickerOn = (millis() % (this.invincibleFlickerSpeed * 2)) < this.invincibleFlickerSpeed;
    }

    if (flickerOn) {
      if (dinoImage) {
        imageMode(CORNER);
        image(dinoImage, this.x, drawY, this.width, this.height);
      } else {
        textAlign(CENTER, CENTER);
        textSize(this.height);
        text('🦖', this.x + this.width / 2, drawY + this.height / 2);
      }
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

class Orb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.collected = false;
  }

  update() {
    this.y += sin(frameCount * 0.1) * 0.5;
  }

  draw() {
    if (!this.collected) {
      push();
      translate(this.x, this.y);
      
      // Rotatie voor sparkle effect
      rotate(frameCount * 0.02);
      
      // Buitenste diamant (glow)
      fill(34, 2, 97, 100);
      noStroke();
      beginShape();
      vertex(0, -this.radius * 1.3);
      vertex(this.radius * 0.8, 0);
      vertex(0, this.radius * 1.3);
      vertex(-this.radius * 0.8, 0);
      endShape(CLOSE);
      
      // Binnenste diamant (helder)
      fill(7, 165, 255);
      stroke(0);
      strokeWeight(2);
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.6, 0);
      vertex(0, this.radius);
      vertex(-this.radius * 0.6, 0);
      endShape(CLOSE);
      
      // Glans facetten
      fill(255, 255, 255, 180);
      noStroke();
      beginShape();
      vertex(0, -this.radius);
      vertex(this.radius * 0.3, -this.radius * 0.3);
      vertex(0, 0);
      vertex(-this.radius * 0.3, -this.radius * 0.3);
      endShape(CLOSE);
      
      // Kleine sparkles
      fill(255, 255, 255, 200);
      ellipse(this.radius * 0.4, -this.radius * 0.4, 3);
      ellipse(-this.radius * 0.3, this.radius * 0.3, 2);
      
      pop();
    }
  }

  hits(dino, gameY) {
    let dinoBottom = dino.getBottom(gameY);
    let dinoTop = dino.getTop(gameY);
    let dinoRight = dino.x + dino.width;
    let dinoLeft = dino.x;

    let closestX = constrain(this.x, dinoLeft, dinoRight);
    let closestY = constrain(this.y, dinoTop, dinoBottom);
    let dx = this.x - closestX;
    let dy = this.y - closestY;

    return dx * dx + dy * dy < this.radius * this.radius;
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
    } else {
      this.width = 150;
      this.height = 15;
      this.isPlatform = true;

      this.hasOrb = random() < 0.3; //verhouding diamantjes//

      if (this.hasOrb) {
        let platformY = CELL_SIZE + 25;
        this.orb = new Orb(
          this.x + this.width * 1.5, //aanpassen x waarde diamant//
          platformY - 80
        );
      } else {
        this.orb = null;
      }
    }
  }

  update(speed) {
    this.x -= speed;
    if (this.orb) this.orb.x -= speed;
  }

  draw(gameY) {
    push();
    if (this.isPlatform) {
      fill(229, 244, 58);
      stroke(139, 69, 19);
      strokeWeight(2);
      let platformY = gameY + (CELL_SIZE + 25);
      rect(this.x, platformY, this.width, this.height, 4);

      if (this.orb && !this.orb.collected) {
        this.orb.y = platformY - 80;
        this.orb.draw();
      }
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
      let platformTop = gameY + CELL_SIZE + 25;
      let platformBottom = platformTop + this.height;
      let dinoBottom = dino.getBottom(gameY);
      let dinoTop = dino.getTop(gameY);
      
      let horizontalOverlap = dino.x + dino.width > this.x && dino.x < this.x + this.width;
      
      // Landing on platform (from above)
      if (dino.vy >= 0 && 
          dinoBottom >= platformTop - 5 && 
          dinoBottom <= platformTop + 5 &&
          horizontalOverlap) {
        
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformTop - groundY;
        dino.vy = 0;
        dino.onGround = true;
        dino.onPlatform = true;
      }
      
      // Hitting platform from below
      if (dino.vy < 0 && 
          dinoTop <= platformBottom + 5 && 
          dinoTop >= platformTop &&
          horizontalOverlap) {
        
        dino.vy = 0;
        let groundY = gameY + (CELL_SIZE * 2) - dino.height;
        dino.y = platformBottom - groundY;
      }

      // Orb collection
      if (this.hasOrb && !this.orb.collected) {
        if (this.orb.hits(dino, gameY)) {
          this.orb.collected = true;
          dino.activateInvincible();
        }
      }
      
      return false;
    } else {
      // Regular obstacle collision
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
    return this.x + this.width < MARGIN;
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
    this.gameOverTimer = 0;
  }

  reset() {
    this.dino = new Dino();
    this.obstacles = [];
    this.spawnTimer = 0;
    this.gameOver = false;
    this.gameOverTimer = 0;

    if (this.gamesPlayed >= this.maxGames) {
      this.score = 0;
      this.gameSpeed = 6;
      this.gamesPlayed = 0;
    }
  }

  spawnObstacles() {
    let rand = random();
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
      this.gameOverTimer++;
      if (this.gameOverTimer >= 120) {
        if (this.gamesPlayed < this.maxGames) {
          this.reset();
        }
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

    // First check platforms, then obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.update(this.gameSpeed);

      // Platform collision (doesn't end game)
      if (obs.isPlatform) {
        obs.hits(this.dino, gameY);
      }

      // Obstacle collision (ends game if not invincible)
      if (!obs.isPlatform && obs.hits(this.dino, gameY)) {
        if (!this.dino.invincible) {
          this.gameOver = true;
          this.gamesPlayed++;
          this.gameOverTimer = 0;
        }
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
    drawingContext.restore();

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
        <h2 style="color: #fb0427; margin-top: 0;">
        Summon the Dragon
        </h2><br>
        <p style="color: #0E0E0E; line-height: 1.2;">
            <strong>Doel:<br></strong> Los alle 10 sommen correct op en speel de Dragon game!</ol><br><br>
            <strong>Hoe speel je:</strong>
            <ol style="color: #0909B4; margin: 5px 0;">
                <li>Sleep blauwe somblokjes naar de juiste oranje antwoorden.</li>
                <li>Klik "Nakijken" om je antwoorden te controleren.</li>
                <li>Klik op "Score" om de feedback op je resultaten te bekijken.</li>
                <li>Bij een score van 10/10 start de Dragon game automatisch! </li>
            </ol><br> 
            <strong>Dragon Game:</strong><li> Spring met spatie of muisklik.</li>
<li>Spring op de hoge gele trampolines en kom er met een grote boog uit door een snelle dubbelklik!</li>
<li>Pak de draaiende diamantjes om 3 seconden lang dwars door de hindernissen te kunnen lopen</li>
            <li>Na 3 game-overs komt er een volledige reset.</li>
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
    
    let closeBtn = document.getElementById('closeBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
            popup.remove();
            overlay.remove();
        }
    });
}

function showScoreFeedback() {
    if (!isChecked) {
        return;
    }
    
    let feedbackTitle = '';
    let feedbackText = '';
    let feedbackColor = '';
    
    if (correctCount === 0) {
        feedbackTitle = '😢 Oeps! 0/10';
        feedbackText = 'Nog geen enkele som goed! Kijk of je uitleg kunt krijgen voor deze sommen en reken ze dan eerst op papier uit!';
        feedbackColor = '#e74c3c';
    } else if (correctCount <= 3) {
        feedbackTitle = '😕 Begin is er! ' + correctCount + '/10';
        feedbackText = 'Je hebt er al één,twee of drie goed! Reken de sommen uit op papier en controleer je antwoord, dan gaat het vast beter!';
        feedbackColor = '#e67e22';
    } else if (correctCount <= 5) {
        feedbackTitle = '🙂 Halfway! ' + correctCount + '/10';
        feedbackText = 'Je bent al (bijna) halverwege! Goed gedaan, maar je kunt beter! Blijf geconcentreerd en blijf oefenen totdat je het foutloos kunt!';
        feedbackColor = '#f39c12';
    } else if (correctCount <= 7) {
        feedbackTitle = '😊 Goed bezig! ' + correctCount + '/10';
        feedbackText = 'Wow, meer dan de helft goed! Jij kunt dit! Let op slordigheidsfoutjes dan mag jij straks ook de Dragon game spelen!';
        feedbackColor = '#3498db';
    } else if (correctCount <= 9) {
        feedbackTitle = '🤩 Bijna perfect! ' + correctCount + '/10';
        feedbackText = 'Fantastisch! Je hebt ze bijna allemaal goed. Nog even opletten bij de laatste sommen en dan roep je de draak op!';
        feedbackColor = '#2ecc71';
    } else if (correctCount <= 10) {
        feedbackTitle = '🤩 Perfect! ' + correctCount + '/10';
        feedbackText = 'Dragon Master! De sommen maak je foutloos maar wat is je highscore bij de Dragon game?';
        feedbackColor = '#FFC107';
    }
    
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
    
    let closeBtn = document.getElementById('closeFeedbackBtn');
    
    // CLICK event
    closeBtn.addEventListener('click', function() {
        popup.remove();
        overlay.remove();
    });
    
    // TOUCH event voor mobiel
    closeBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        popup.remove();
        overlay.remove();
    });
    
    // Overlay click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            popup.remove();
            overlay.remove();
        }
    });
    
    // Overlay touch voor mobiel
    overlay.addEventListener('touchend', function(e) {
        if (e.target === overlay) {
            e.preventDefault();
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

  // ===== MAAK VRAAG BLOKJES (rijen 0 en 1) =====
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
                isHovered: false, //hoverparameters//
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
                isHovered: false, //hoverparameters//
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
    container.style('margin', '20px auto');
    
    let canvasWidth = COLS * CELL_SIZE + MARGIN * 2;
    let canvasHeight = ROWS * CELL_SIZE + MARGIN * 2 + BUTTON_HEIGHT + TITLE_SPACE;
    let cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent(container);
    
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
    
    // BUTTONS
    checkButton = createButton('Nakijken');
    checkButton.parent(container);
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
    resetButton.parent(container);
    resetButton.mousePressed(resetGame);
    styleButton(resetButton, '#f44336', '10px 15px');
    resetButton.position(MARGIN + BUTTON_3_X, BUTTON_Y);
    
    infoButton = createButton('ℹ Info');
    infoButton.parent(container);
    infoButton.mousePressed(showInfo);
    styleButton(infoButton, '#03A9F4', '10px 15px');
    infoButton.position(MARGIN + BUTTON_4_X, BUTTON_Y);
    
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
let scaleAmount = 1 + 0.15 * block.hoverProgress;

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
        drawingContext.shadowColor = 'rgba(0,0,0,0.7)';
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
  
let zoneX = width  * DINO_ZONE.xRatio;
let zoneY = height * DINO_ZONE.yRatio;
let zoneW = width  * DINO_ZONE.wRatio;
let zoneH = height * DINO_ZONE.hRatio;

if (
    mouseX > zoneX &&
    mouseX < zoneX + zoneW &&
    mouseY > zoneY &&
    mouseY < zoneY + zoneH
) {
    
    showDinoGame = true;
    dinoGame = new DinoGame();
    isFlashing = false;
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