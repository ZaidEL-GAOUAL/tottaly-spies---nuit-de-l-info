// ==================== ENDING SCENE ====================
class EndingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndingScene' });
    }

    create() {
        // Background - celebration colors
        this.add.rectangle(400, 300, 800, 600, 0x0a2a0a).setDepth(1);

        // All 4 items displayed prominently
        const items = ['item_n', 'item_i', 'item_r', 'item_d'];
        const labels = ['Numérique', 'Inclusif', 'Responsable', 'Durable'];
        const scales = [0.1, 0.3, 0.1, 0.3]; // Different scales for different native sizes

        for (let i = 0; i < 4; i++) {
            const x = 200 + i * 150;
            const item = this.add.image(x, 200, items[i]).setDepth(10).setScale(scales[i]);
            this.add.text(x, 280, labels[i], {
                fontFamily: 'Courier', fontSize: '14px', color: '#00ff00'
            }).setOrigin(0.5).setDepth(10);

            // Floating animation
            this.tweens.add({
                targets: item,
                y: 180,
                duration: 1000 + i * 200,
                ease: 'Sine.InOut',
                yoyo: true,
                repeat: -1
            });
        }

        // Title
        this.add.text(400, 80, '🎉 CONGRATULATIONS! 🎉', {
            fontFamily: 'Courier', fontSize: '32px', color: '#ffff00'
        }).setOrigin(0.5).setDepth(10);

        // NIRD logo
        this.add.text(400, 350, 'N.I.R.D.', {
            fontFamily: 'Courier', fontSize: '64px', color: '#00ff00'
        }).setOrigin(0.5).setDepth(10);

        this.add.text(400, 420, 'Numérique • Inclusif • Responsable • Durable', {
            fontFamily: 'Courier', fontSize: '16px', color: '#88ff88'
        }).setOrigin(0.5).setDepth(10);

        // Message
        this.add.text(400, 480, 'You have learned the ways of sustainable digital citizenship!', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(10);

        this.add.text(400, 520, 'Open Source • Privacy • Accessibility • Environment', {
            fontFamily: 'Courier', fontSize: '12px', color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(10);

        // Restart button
        const restartBtn = this.add.text(400, 560, '[ PLAY AGAIN ]', {
            fontFamily: 'Courier', fontSize: '18px', color: '#00ff00',
            backgroundColor: '#003300', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(10).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setStyle({ color: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ color: '#00ff00' }));
        restartBtn.on('pointerdown', () => this.scene.start('Level1Scene'));

        // Play all music layers if available
        ['bass', 'drums', 'melody', 'harmony'].forEach(layer => {
            if (this.cache.audio.exists('track_' + layer)) {
                const music = this.sound.add('track_' + layer, { loop: true, volume: 0.5 });
                music.play();
            }
        });
    }
}
