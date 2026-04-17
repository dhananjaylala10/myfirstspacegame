// --- DHANANJAY'S FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyAyq_wwdBoKMs6Mb9i2sjh5FRkPGQ_kiz8",
  authDomain: "dhananjay-game.firebaseapp.com",
  projectId: "dhananjay-game",
  storageBucket: "dhananjay-game.firebasestorage.app",
  messagingSenderId: "948971388112",
  appId: "1:948971388112:web:9ca9c7c0c889bc6dd372d5",
  measurementId: "G-MBTRSKMS0B"
};

// Initialize Firebase using Compat mode
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, platforms, cursors, stars, bombs, scoreText, highScoreText, restartBtn;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameOver = false;

let isLeft = false, isRight = false, isJump = false, isDown = false;

function preload() {
    this.load.setBaseURL('https://labs.phaser.io');
    this.load.image('sky', 'assets/skies/space3.png');
    this.load.image('ground', 'assets/sprites/platform.png');
    this.load.image('star', 'assets/demoscene/star.png');
    this.load.image('bomb', 'assets/sprites/bomb.png');
    this.load.spritesheet('dude', 'assets/sprites/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
    this.add.image(400, 300, 'sky');
    
    // Signature
    this.add.text(400, 300, 'Made by Dhananjay Shrivastava', { 
        fontSize: '40px', fill: '#ffffff', fontStyle: 'bold' 
    }).setOrigin(0.5).setAlpha(0.1);

    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');
    player.setBounce(0.1).setCollideWorldBounds(true);

    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    stars = this.physics.add.group({
        key: 'star', repeat: 11, setXY: { x: 12, y: 0, stepX: 70 }
    });
    stars.children.iterate(child => child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)));
    
    bombs = this.physics.add.group();

    // UI Buttons
    let globalScoreBtn = this.add.text(400, 50, '🏆 Global Leaderboard', { 
        fontSize: '20px', backgroundColor: '#444', padding: { x: 10, y: 5 } 
    }).setOrigin(0.5).setInteractive();

    // Corrected function call
    globalScoreBtn.on('pointerdown', () => showOnlineLeaderboard());

    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFF' });
    highScoreText = this.add.text(16, 50, 'High Score: ' + highScore, { fontSize: '20px', fill: '#FFD700' });
    
    cursors = this.input.keyboard.createCursorKeys();

    const createBtn = (x, y, label) => {
        return this.add.text(x, y, label, { 
            fontSize: '50px', backgroundColor: '#333', padding: { x: 25, y: 15 } 
        }).setInteractive().setAlpha(0.6).setScrollFactor(0).setDepth(10);
    };

    createBtn(40, 470, '←').on('pointerdown', () => isLeft = true);
    createBtn(170, 470, '→').on('pointerdown', () => isRight = true);
    createBtn(670, 470, '↑').on('pointerdown', () => isJump = true);
    createBtn(670, 360, '↓').on('pointerdown', () => isDown = true);

    this.input.on('pointerup', () => {
        isLeft = false; isRight = false; isJump = false; isDown = false;
    });

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.overlap(player, stars, collectStar, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
    if (gameOver) return;
    if (cursors.left.isDown || isLeft) {
        player.setVelocityX(-180);
        player.anims.play('left', true);
    } else if (cursors.right.isDown || isRight) {
        player.setVelocityX(180);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }
    if ((cursors.up.isDown || isJump) && player.body.touching.down) {
        player.setVelocityY(-480);
    }
    if (cursors.down.isDown || isDown) {
        player.setVelocityY(400);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
    score += 10;
    scoreText.setText('Score: ' + score);
    if (score > highScore) {
        highScore = score;
        highScoreText.setText('High Score: ' + highScore);
        localStorage.setItem('highScore', highScore);
    }
    if (stars.countActive(true) === 0) {
        stars.children.iterate(child => child.enableBody(true, child.x, 0, true, true));
        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        let bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1).setCollideWorldBounds(true).setVelocity(Phaser.Math.Between(-200, 200), 20);
    }
}

function hitBomb(player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn');
    gameOver = true;

    this.add.text(400, 250, 'GAME OVER', { fontSize: '64px', fill: '#f00', fontStyle: 'bold' }).setOrigin(0.5);

    // Save Online Score
    let name = prompt("Enter your name for Global Leaderboard:", "Player");
    if (name) {
        db.collection("leaderboard").add({
            playerName: name,
            playerScore: score,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert("Score synced to Cloud!");
        });
    }

    restartBtn = this.add.text(400, 350, ' RESTART ', { 
        fontSize: '32px', backgroundColor: '#0f0', fill: '#000', padding: { x: 10, y: 5 } 
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        score = 0;
        gameOver = false;
        this.scene.restart();
    });
}

// ASLI DATA FETCH KARNE KA FUNCTION
function showOnlineLeaderboard() {
    db.collection("leaderboard")
      .orderBy("playerScore", "desc")
      .limit(5)
      .get()
      .then((querySnapshot) => {
          let list = "🏆 GLOBAL TOP 5 🏆\n\n";
          querySnapshot.forEach((doc) => {
              list += `${doc.data().playerName}: ${doc.data().playerScore}\n`;
          });
          alert(list);
      }).catch(err => alert("Leaderboard is empty or connecting..."));
}