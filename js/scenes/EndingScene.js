// ==================== ENDING SCENE ====================
class EndingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndingScene' });
    }

    create() {
        // Background - celebration colors
        this.add.rectangle(400, 300, 800, 600, 0x0a2a0a).setDepth(1);

        // Title
        this.add.text(400, 40, '🎉 MISSION ACCOMPLISHED! 🎉', {
            fontFamily: 'Courier', fontSize: '28px', color: '#ffff00'
        }).setOrigin(0.5).setDepth(10);

        // All 4 items displayed
        const items = ['item_n', 'item_i', 'item_r', 'item_d'];
        const labels = ['Numérique', 'Inclusif', 'Responsable', 'Durable'];
        const scales = [0.08, 0.25, 0.08, 0.25];

        for (let i = 0; i < 4; i++) {
            const x = 200 + i * 150;
            const item = this.add.image(x, 120, items[i]).setDepth(10).setScale(scales[i]);
            this.add.text(x, 170, labels[i], {
                fontFamily: 'Courier', fontSize: '12px', color: '#00ff00'
            }).setOrigin(0.5).setDepth(10);

            // Floating animation
            this.tweens.add({
                targets: item,
                y: 110,
                duration: 1000 + i * 200,
                ease: 'Sine.InOut',
                yoyo: true,
                repeat: -1
            });
        }

        // NIRD Village message
        this.add.text(400, 210, 'You have built a NIRD Village!', {
            fontFamily: 'Courier', fontSize: '18px', color: '#88ff88'
        }).setOrigin(0.5).setDepth(10);

        this.add.text(400, 240, 'But the real battle is just starting...', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ffffff'
        }).setOrigin(0.5).setDepth(10);

        // YOUR NEXT STEPS - Call to Action
        this.add.text(400, 290, '── YOUR NEXT STEPS ──', {
            fontFamily: 'Courier', fontSize: '16px', color: '#ffff00'
        }).setOrigin(0.5).setDepth(10);

        const steps = [
            '🐧 TRY LINUX: Download a Live USB of Linux Mint or PrimTux',
            '🛡️ PROTECT DATA: Use Apps.education.fr for school projects',
            '♻️ REPAIR: Visit a Repair Café before throwing away devices'
        ];

        steps.forEach((step, i) => {
            this.add.text(400, 330 + i * 35, step, {
                fontFamily: 'Courier', fontSize: '12px', color: '#aaffaa'
            }).setOrigin(0.5).setDepth(10);
        });

        // Links
        const linuxLink = this.add.text(400, 450, '[ linuxmint.com ]', {
            fontFamily: 'Courier', fontSize: '14px', color: '#00aaff',
            backgroundColor: '#002233', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10).setInteractive();

        linuxLink.on('pointerover', () => linuxLink.setStyle({ color: '#ffff00' }));
        linuxLink.on('pointerout', () => linuxLink.setStyle({ color: '#00aaff' }));
        linuxLink.on('pointerdown', () => {
            window.open('https://linuxmint.com', '_blank');
        });

        const nirdLink = this.add.text(400, 490, '[ NIRD Official Website ]', {
            fontFamily: 'Courier', fontSize: '14px', color: '#00ff00',
            backgroundColor: '#003300', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10).setInteractive();

        nirdLink.on('pointerover', () => nirdLink.setStyle({ color: '#ffff00' }));
        nirdLink.on('pointerout', () => nirdLink.setStyle({ color: '#00ff00' }));
        nirdLink.on('pointerdown', () => {
            window.open('https://nird.fr', '_blank');
        });

        // Restart button
        const restartBtn = this.add.text(400, 550, '[ PLAY AGAIN ]', {
            fontFamily: 'Courier', fontSize: '16px', color: '#888888',
            backgroundColor: '#222222', padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(10).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setStyle({ color: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ color: '#888888' }));
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
