// ==================== LEVEL 2 SCENE ====================
class Level2Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level2Scene' });
        this.gameState = 'INTRO';
        this.trapsTriggered = { A: false, B: false };
        this.dialogueQueue = [];
        this.isDialogueActive = false;
        this.caughtBlocks = 0;
        this.requiredBlocks = 5;
    }

    create() {
        Object.assign(this, SceneMixin);
        this.setupAudioVisualizer();
        this.visualizerGraphics = this.add.graphics().setDepth(0);

        // Background
        this.bg = this.add.rectangle(400, 300, 800, 600, 0x2a2a1a).setDepth(1);

        // Ground with gap (left ends at x=300, right starts at x=500)
        this.groundLeft = this.add.rectangle(150, 560, 300, 40, 0x444433).setDepth(2);
        this.physics.add.existing(this.groundLeft, true);
        this.groundRight = this.add.rectangle(650, 560, 300, 40, 0x444433).setDepth(2);
        this.physics.add.existing(this.groundRight, true);

        // Bridge images - centered at y=570 with height 60 means top edge is at 540 (flush with ground)
        this.bridge = this.add.image(400, 570, 'bridge').setDepth(3);
        this.bridge.setDisplaySize(300, 60);  // 300px wide to fill gap + large overlap
        this.bridgeBroken = this.add.image(400, 570, 'bridge_broken').setDepth(3).setVisible(false);
        this.bridgeBroken.setDisplaySize(300, 60);

        // Hero
        this.hero = this.physics.add.sprite(100, 480, 'hero').setDepth(10);
        this.hero.setCollideWorldBounds(true);
        this.hero.setScale(0.15);
        this.physics.add.collider(this.hero, this.groundLeft);
        this.physics.add.collider(this.hero, this.groundRight);

        // Bridge collision - top at 540 (center 550, height 20)
        // This matches ground top surface exactly
        this.bridgeCollider = this.add.rectangle(400, 550, 220, 20, 0x000000, 0);
        this.physics.add.existing(this.bridgeCollider, true);
        this.physics.add.collider(this.hero, this.bridgeCollider);

        // Villagers
        this.villagers = this.add.image(650, 500, 'villagers').setDepth(5).setScale(0.12);

        // Trap A - Pay Toll (on the LEFT ground, near the gap)
        this.trapA = this.physics.add.sprite(250, 520, 'money_bag').setDepth(5);
        this.trapA.setScale(0.08).body.setAllowGravity(false);
        this.trapA.body.setImmovable(true);
        this.trapA.setVisible(false);

        // Trap B - Pirate (ON THE BRIDGE)
        this.trapB = this.add.text(360, 460, '💀 PIRATE', {
            fontFamily: 'Courier', fontSize: '16px', color: '#ff0000',
            backgroundColor: '#330000', padding: { x: 10, y: 5 }
        }).setDepth(5).setVisible(false);
        this.trapBZone = this.add.zone(400, 510, 120, 60);  // On the bridge
        this.physics.add.existing(this.trapBZone, false);
        this.trapBZone.body.setAllowGravity(false);

        // Virus (for animation - on the bridge, hidden initially)
        this.virus = this.add.image(320, 520, 'virus').setDepth(20).setScale(0.12).setVisible(false);

        // NPCs
        this.goliath = this.physics.add.sprite(400, 300, 'goliath').setDepth(5);
        this.goliath.setScale(0.18).setFlipX(true).body.setAllowGravity(false);
        this.goliath.setVisible(false);

        this.penguin = this.physics.add.sprite(50, 400, 'penguin').setDepth(5);
        this.penguin.setScale(0.15).body.setAllowGravity(false);
        this.penguin.setVisible(false);

        // UI
        this.createDialogueBox(0xccaa00, '#ccaa00');
        this.createForgeUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Collisions
        this.physics.add.overlap(this.hero, this.trapA, () => this.triggerTrap('A'), null, this);
        this.physics.add.overlap(this.hero, this.trapBZone, () => this.triggerTrap('B'), null, this);

        // Previous artifact (scaled for native size)
        this.add.image(50, 50, 'item_n').setDepth(100).setScale(0.05);

        this.startIntro();
    }

    update() {
        this.updateVisualizer(0xccaa00);

        if (this.gameState === 'FORGE') {
            if (this.cursors.left.isDown) {
                this.hero.setVelocityX(-300);
                this.hero.setFlipX(true);
                this.hero.setTexture('hero_walk');
            } else if (this.cursors.right.isDown) {
                this.hero.setVelocityX(300);
                this.hero.setFlipX(false);
                this.hero.setTexture('hero_walk');
            } else {
                this.hero.setVelocityX(0);
                this.hero.setTexture('hero');
            }
        } else {
            this.handleHeroMovement();
        }

        if (this.isDialogueActive && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.advanceDialogue();
        }
    }

    createForgeUI() {
        this.forgeContainer = this.add.container(0, 0).setDepth(50).setVisible(false);
        this.forgeProgress = this.add.text(400, 50, 'Blocks: 0 / 5', {
            fontFamily: 'Courier', fontSize: '24px', color: '#00ff00'
        }).setOrigin(0.5);
        this.forgeContainer.add(this.forgeProgress);
        this.forgeContainer.add(this.add.text(400, 80, 'Catch Open Source tools! Avoid proprietary locks!', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ccaa00'
        }).setOrigin(0.5));
    }

    // ==================== GAME FLOW ====================
    startIntro() {
        this.showDialogue('SYSTEM', 'LEVEL 2: INCLUSIF - The Bridge of Knowledge');
        this.showDialogue('STUDENT', 'I have dyslexia. The proprietary app won\'t let me change the font!');
        this.showDialogue('STUDENT', 'Accessibility is locked behind a €200/year "Pro" feature...', () => this.spawnGoliath());
    }

    spawnGoliath() {
        this.goliath.setVisible(true);
        this.goliath.setTexture('goliath_move');

        // Flying effect - hover up and down
        this.tweens.add({
            targets: this.goliath,
            y: 420,
            duration: 1500,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(1000, () => {
            this.showDialogue('GOLIATH', 'Accessibility? That\'s a PRO feature, kid!');
            this.showDialogue('GOLIATH', 'Pay the subscription or stay excluded!', () => this.showTraps());
        });
    }

    showTraps() {
        this.gameState = 'EXPLORE';
        this.trapA.setVisible(true);
        this.trapB.setVisible(true);
        // Pay Toll label near the money bag
        this.trapALabel = this.add.text(210, 450, 'PAY TOLL\n€200/person', {
            fontFamily: 'Courier', fontSize: '12px', color: '#ff0000', align: 'center'
        }).setDepth(10);
        // Pirate label is already in trapB text
        this.showDialogue('SYSTEM', 'Walk into a choice. Pay Toll on left, or walk onto the bridge to Pirate!');
    }

    triggerTrap(trapType) {
        if (this.gameState !== 'EXPLORE') return;
        if ((trapType === 'A' && this.trapsTriggered.A) || (trapType === 'B' && this.trapsTriggered.B)) return;

        this.gameState = 'DIALOGUE';

        if (trapType === 'A') {
            this.trapsTriggered.A = true;
            playSound(this, 'slap');
            this.cameras.main.shake(300, 0.02);
            const moneyText = this.add.text(200, 400, '-€200', {
                fontFamily: 'Courier', fontSize: '20px', color: '#ff0000'
            }).setDepth(20);
            this.tweens.add({ targets: moneyText, y: 200, alpha: 0, duration: 1500, onComplete: () => moneyText.destroy() });
            this.showDialogue('SYSTEM', 'The bridge opens... but snaps shut after one use!');
            this.showDialogue('SYSTEM', 'Subscription expired! You can\'t sustain this cost.', () => this.checkBothTraps());
        } else {
            this.trapsTriggered.B = true;
            playSound(this, 'siren');

            // Virus appears and eats the bridge with mouth animation
            this.virus.setVisible(true);
            this.virus.setPosition(280, 540);

            // Move virus towards bridge while animating mouth
            let mouthOpen = false;
            const mouthAnim = this.time.addEvent({
                delay: 200,
                callback: () => {
                    mouthOpen = !mouthOpen;
                    this.virus.setTexture(mouthOpen ? 'virus_open' : 'virus');
                },
                loop: true
            });

            this.tweens.add({
                targets: this.virus,
                x: 500,
                duration: 2000,
                onComplete: () => {
                    mouthAnim.destroy();
                    this.virus.setVisible(false);
                    // Bridge is destroyed
                    this.bridge.setVisible(false);
                    this.bridgeBroken.setVisible(true);
                    // Remove bridge collision
                    this.bridgeCollider.body.enable = false;
                }
            });

            this.showDialogue('SYSTEM', 'Security Risk! The virus ate the bridge!');
            this.showDialogue('SYSTEM', 'Piracy destroys trust and infrastructure.', () => this.checkBothTraps());
        }
    }

    checkBothTraps() {
        if (this.trapsTriggered.A && this.trapsTriggered.B) {
            this.spawnMentor();
        } else {
            this.gameState = 'EXPLORE';
            const remaining = !this.trapsTriggered.A ? 'PAY TOLL' : 'PIRATE';
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
            this.showDialogue('MENTOR', 'Both paths lead to exclusion!');
            this.showDialogue('MENTOR', 'The Forge des Communs lets teachers share tools freely.');
            this.showDialogue('MENTOR', 'Build a Bridge with Open Source: Moodle, Peertube, OpenDyslexic!', () => {
                this.trapA.setVisible(false);
                this.trapB.setVisible(false);
                this.trapALabel.setVisible(false);
                this.startForge();
            });
        });
    }

    startForge() {
        this.gameState = 'FORGE';
        this.forgeContainer.setVisible(true);
        this.caughtBlocks = 0;
        this.updateForgeProgress();
        this.hero.setPosition(400, 540);

        this.spawnBlockTimer = this.time.addEvent({
            delay: 1000, callback: this.spawnBlock, callbackScope: this, loop: true
        });
    }

    spawnBlock() {
        if (this.gameState !== 'FORGE') return;

        const isDRM = Math.random() < 0.3;
        const x = Phaser.Math.Between(100, 700);
        // Real Open Source tools vs Proprietary locks
        const goodTools = ['📚 Moodle', '🎬 Peertube', '🔤 OpenDyslexic', '📝 LibreOffice'];
        const badTools = ['🔒 Locked PDF', '☁️ Proprietary Cloud', '👁️ User Tracking'];
        const blockText = isDRM ? badTools[Phaser.Math.Between(0, badTools.length - 1)] : goodTools[Phaser.Math.Between(0, goodTools.length - 1)];

        const block = this.add.text(x, -50, blockText, {
            fontFamily: 'Courier', fontSize: '20px', color: isDRM ? '#ff0000' : '#00ff00',
            backgroundColor: isDRM ? '#330000' : '#003300', padding: { x: 8, y: 4 }
        }).setDepth(30);

        this.physics.add.existing(block);
        block.body.setVelocityY(200).setAllowGravity(false);

        this.physics.add.overlap(this.hero, block, () => {
            if (isDRM) {
                playSound(this, 'slap');
                this.cameras.main.shake(200, 0.02);
                this.caughtBlocks = Math.max(0, this.caughtBlocks - 1);
            } else {
                playSound(this, 'success');
                this.caughtBlocks++;
            }
            block.destroy();
            this.updateForgeProgress();
            if (this.caughtBlocks >= this.requiredBlocks) this.completeForge();
        }, null, this);

        this.time.delayedCall(4000, () => { if (block && block.active) block.destroy(); });
    }

    updateForgeProgress() {
        this.forgeProgress.setText(`Blocks: ${this.caughtBlocks} / ${this.requiredBlocks}`);
    }

    completeForge() {
        if (this.gameState === 'WON') return;
        this.gameState = 'WON';
        if (this.spawnBlockTimer) this.spawnBlockTimer.destroy();
        this.forgeContainer.setVisible(false);

        // Hide broken bridge, show fixed bridge
        this.bridgeBroken.setVisible(false);
        this.bridge.setVisible(true);
        this.tweens.add({ targets: this.bridge, alpha: { from: 0, to: 1 }, duration: 1000 });
        // Add collision for bridge area
        const bridgeCollider = this.add.rectangle(400, 570, 200, 20, 0x000000, 0);
        this.physics.add.existing(bridgeCollider, true);
        this.physics.add.collider(this.hero, bridgeCollider);

        playSound(this, 'success');
        this.tweens.add({ targets: this.villagers, tint: 0xffffff, y: 520, duration: 500, yoyo: true, repeat: 3 });

        const itemI = this.add.image(400, 300, 'item_i').setDepth(50).setScale(0.3).setAlpha(0);
        this.tweens.add({ targets: itemI, alpha: 1, scale: 0.5, duration: 1000 });
        this.startMusic('drums');
        CodexManager.addCard('I');
        this.tweens.add({ targets: this.bg, fillColor: { from: 0x2a2a1a, to: 0x3a3a2a }, duration: 2000 });

        this.showDialogue('SYSTEM', 'Bridge Complete! The students cross!');
        this.showDialogue('HERO', 'The Forge is open to everyone!');
        this.showDialogue('SYSTEM', 'Artifact Acquired: [I] - Inclusif');
        this.showDialogue('SYSTEM', 'Level 2 Complete! The drums kick in...', () => {
            this.tweens.add({ targets: itemI, x: 100, y: 50, scale: 0.1, duration: 1000 });
            this.time.delayedCall(1500, () => {
                CodexManager.showCardPopup(this, 'I', () => {
                    this.scene.start('Level3Scene');
                });
            });
        });
    }
}

Object.assign(Level2Scene.prototype, SceneMixin);
