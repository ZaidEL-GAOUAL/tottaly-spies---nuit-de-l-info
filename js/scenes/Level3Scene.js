// ==================== LEVEL 3 SCENE ====================
class Level3Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level3Scene' });
        this.gameState = 'INTRO';
        this.trapsTriggered = { A: false, B: false };
        this.dialogueQueue = [];
        this.isDialogueActive = false;
        this.savedPackets = 0;
        this.requiredPackets = 10;
    }

    create() {
        Object.assign(this, SceneMixin);
        this.setupAudioVisualizer();
        this.visualizerGraphics = this.add.graphics().setDepth(0);

        // Background
        this.bg = this.add.rectangle(400, 300, 800, 600, 0x1a2a3a).setDepth(1);

        // Ground
        this.ground = this.add.rectangle(400, 580, 800, 40, 0x334455).setDepth(2);
        this.physics.add.existing(this.ground, true);

        // Hero
        this.hero = this.physics.add.sprite(100, 500, 'hero').setDepth(10);
        this.hero.setCollideWorldBounds(true);
        this.hero.setScale(0.15);
        this.physics.add.collider(this.hero, this.ground);

        // Cloud & Server
        this.cloud = this.add.image(700, 100, 'cloud').setDepth(5).setScale(0.15).setTint(0x880000);
        this.server = this.add.image(100, 300, 'firewall').setDepth(5).setScale(0.12);
        this.add.text(70, 380, 'SCHOOL\nSERVER', {
            fontFamily: 'Courier', fontSize: '10px', color: '#00ff00', align: 'center'
        }).setDepth(6);

        // Traps - invisible collision zones
        this.trapA = this.add.text(250, 500, '🍪 Accept Cookies', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ff0000',
            backgroundColor: '#330000', padding: { x: 10, y: 5 }
        }).setDepth(5).setVisible(false);
        this.trapAZone = this.add.zone(300, 520, 120, 40);
        this.physics.add.existing(this.trapAZone, false);
        this.trapAZone.body.setAllowGravity(false);

        this.trapB = this.add.text(450, 500, '🔌 Unplug Internet', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ff0000',
            backgroundColor: '#330000', padding: { x: 10, y: 5 }
        }).setDepth(5).setVisible(false);
        this.trapBZone = this.add.zone(520, 520, 120, 40);
        this.physics.add.existing(this.trapBZone, false);
        this.trapBZone.body.setAllowGravity(false);

        // NPCs
        this.goliath = this.physics.add.sprite(600, 400, 'goliath').setDepth(5);
        this.goliath.setScale(0.18).setFlipX(true).body.setAllowGravity(false);
        this.goliath.setVisible(false);

        this.penguin = this.physics.add.sprite(50, 500, 'penguin').setDepth(5);
        this.penguin.setScale(0.15).body.setAllowGravity(false);
        this.penguin.setVisible(false);

        // Shield - needs physics for collision!
        this.shield = this.add.rectangle(150, 300, 20, 80, 0x0088ff).setDepth(15).setVisible(false);
        this.physics.add.existing(this.shield, false);
        this.shield.body.setImmovable(true);
        this.shield.body.setAllowGravity(false);

        // UI
        this.createDialogueBox(0x0088ff, '#0088ff');
        this.createDataPongUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Collisions
        this.physics.add.overlap(this.hero, this.trapAZone, () => this.triggerTrap('A'), null, this);
        this.physics.add.overlap(this.hero, this.trapBZone, () => this.triggerTrap('B'), null, this);

        // Previous artifacts (different scales for different native sizes)
        this.add.image(50, 50, 'item_n').setDepth(100).setScale(0.05);
        this.add.image(100, 50, 'item_i').setDepth(100).setScale(0.15);

        this.startIntro();
    }

    update() {
        this.updateVisualizer(0x0088ff);

        if (this.gameState === 'PONG') {
            if (this.cursors.up.isDown) this.shield.y = Math.max(100, this.shield.y - 5);
            else if (this.cursors.down.isDown) this.shield.y = Math.min(500, this.shield.y + 5);
            this.hero.setVelocityX(0).setTexture('hero');
        } else {
            this.handleHeroMovement();
        }

        if (this.isDialogueActive && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.advanceDialogue();
        }
    }

    createDataPongUI() {
        this.pongContainer = this.add.container(0, 0).setDepth(50).setVisible(false);
        this.pongProgress = this.add.text(400, 30, 'Data Saved: 0 / 10', {
            fontFamily: 'Courier', fontSize: '24px', color: '#00ff00'
        }).setOrigin(0.5);
        this.pongContainer.add(this.pongProgress);
        this.pongContainer.add(this.add.text(400, 60, 'Use UP/DOWN to deflect data packets!', {
            fontFamily: 'Courier', fontSize: '14px', color: '#0088ff'
        }).setOrigin(0.5));
    }

    // ==================== GAME FLOW ====================
    startIntro() {
        this.showDialogue('SYSTEM', 'LEVEL 3: RESPONSABLE - Data Sovereignty');
        this.showDialogue('SYSTEM', 'Student data is being harvested by foreign clouds...', () => this.spawnGoliath());
    }

    spawnGoliath() {
        this.goliath.setVisible(true);
        this.goliath.setTexture('goliath_move');

        // Flying effect
        this.tweens.add({
            targets: this.goliath,
            y: 420,
            duration: 1500,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(1000, () => {
            this.showDialogue('GOLIATH', 'Why host it yourself? My Cloud is FREE!');
            this.showDialogue('GOLIATH', 'I just need to... peek at the health data. And grades. And photos.', () => this.showTraps());
        });
    }

    showTraps() {
        this.gameState = 'EXPLORE';
        this.trapA.setVisible(true);
        this.trapB.setVisible(true);
        this.showDialogue('SYSTEM', 'Walk into a choice. (Arrow keys to move)');
    }

    triggerTrap(trapType) {
        if (this.gameState !== 'EXPLORE') return;
        if ((trapType === 'A' && this.trapsTriggered.A) || (trapType === 'B' && this.trapsTriggered.B)) return;

        this.gameState = 'DIALOGUE';

        if (trapType === 'A') {
            this.trapsTriggered.A = true;
            playSound(this, 'slap');
            this.tweens.add({ targets: this.hero, x: 600, y: 200, duration: 1000 });
            this.showDialogue('GOLIATH', 'You accepted my cookies! Now you ARE the product!');
            this.showDialogue('SYSTEM', 'Your data was sold. Privacy: COMPROMISED.', () => {
                this.hero.setPosition(100, 500);
                this.checkBothTraps();
            });
        } else {
            this.trapsTriggered.B = true;
            const darkness = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9).setDepth(50);
            this.showDialogue('SYSTEM', 'You unplugged the internet. Total darkness.');
            this.showDialogue('SYSTEM', 'You can\'t learn in the dark. We need SAFE connection.', () => {
                darkness.destroy();
                this.checkBothTraps();
            });
        }
    }

    checkBothTraps() {
        if (this.trapsTriggered.A && this.trapsTriggered.B) {
            this.spawnMentor();
        } else {
            this.gameState = 'EXPLORE';
            const remaining = !this.trapsTriggered.A ? 'Accept Cookies' : 'Unplug Internet';
            this.showDialogue('SYSTEM', `Now try: ${remaining}`);
        }
    }

    spawnMentor() {
        this.penguin.setVisible(true).setAlpha(0);
        this.penguin.setTexture('penguin_walk');
        this.tweens.add({ targets: this.penguin, alpha: 1, x: 150, duration: 1500 });

        // Flying effect
        this.tweens.add({
            targets: this.penguin,
            y: '+=15',
            duration: 800,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(1500, () => {
            this.showDialogue('MENTOR', 'Neither path protects student data!');
            this.showDialogue('MENTOR', 'Use Apps.education.fr - sovereign tools hosted in France.');
            this.showDialogue('MENTOR', 'RGPD says: sensitive data stays in Europe!', () => {
                this.trapA.setVisible(false);
                this.trapB.setVisible(false);
                this.startDataPong();
            });
        });
    }

    startDataPong() {
        this.gameState = 'PONG';
        this.pongContainer.setVisible(true);
        this.shield.setVisible(true);
        this.savedPackets = 0;
        this.updatePongProgress();
        this.hero.setVisible(false);

        this.spawnPacketTimer = this.time.addEvent({
            delay: 800, callback: this.spawnDataPacket, callbackScope: this, loop: true
        });
    }

    spawnDataPacket() {
        if (this.gameState !== 'PONG') return;

        const y = Phaser.Math.Between(100, 500);
        const packet = this.add.circle(700, y, 10, 0xff0000).setDepth(20);
        this.physics.add.existing(packet);
        packet.body.setVelocityX(-300).setAllowGravity(false);
        packet.saved = false;

        this.physics.add.overlap(this.shield, packet, () => {
            if (packet.saved) return;
            packet.saved = true;
            packet.body.setVelocityX(-200).setVelocityY(Phaser.Math.Between(-100, 100));
            packet.setFillStyle(0x00ff00);
            playSound(this, 'success');
        }, null, this);

        this.time.addEvent({
            delay: 100, repeat: 30,
            callback: () => {
                if (packet && packet.active && packet.x < 130 && packet.saved) {
                    this.savedPackets++;
                    this.updatePongProgress();
                    packet.destroy();
                    if (this.savedPackets >= this.requiredPackets) this.completePong();
                }
            }
        });

        this.time.delayedCall(4000, () => { if (packet && packet.active) packet.destroy(); });
    }

    updatePongProgress() {
        this.pongProgress.setText(`Data Saved: ${this.savedPackets} / ${this.requiredPackets}`);
    }

    completePong() {
        if (this.gameState === 'WON') return;
        this.gameState = 'WON';
        if (this.spawnPacketTimer) this.spawnPacketTimer.destroy();
        this.pongContainer.setVisible(false);
        this.shield.setVisible(false);
        this.hero.setVisible(true).setPosition(100, 500);

        playSound(this, 'success');
        this.tweens.add({ targets: this.cloud, scale: 0.05, alpha: 0, duration: 2000 });

        const itemR = this.add.image(400, 300, 'item_r').setDepth(50).setScale(0.3).setAlpha(0);
        this.tweens.add({ targets: itemR, alpha: 1, scale: 0.5, duration: 1000 });
        this.startMusic('melody');
        CodexManager.addCard('R');
        this.tweens.add({ targets: this.bg, fillColor: { from: 0x1a2a3a, to: 0x2a3a4a }, duration: 2000 });

        this.showDialogue('HERO', 'My data stays here. Encrypted and safe.');
        this.showDialogue('SYSTEM', 'Artifact Acquired: [R] - Responsable');
        this.showDialogue('SYSTEM', 'Level 3 Complete! The melody plays...', () => {
            this.tweens.add({ targets: itemR, x: 150, y: 50, scale: 0.08, duration: 1000 });
            this.time.delayedCall(1500, () => {
                CodexManager.showCardPopup(this, 'R', () => {
                    this.scene.start('Level4Scene');
                });
            });
        });
    }
}

Object.assign(Level3Scene.prototype, SceneMixin);
