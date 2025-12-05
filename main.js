// ==================== GAME CONFIG ====================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: false
        }
    },
    scene: [BootScene, Level1Scene, Level2Scene, Level3Scene, Level4Scene, EndingScene]
};

// ==================== START GAME ====================
const game = new Phaser.Game(config);
