// ==================== LEVEL 4 SCENE ====================
class Level4Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level4Scene' });
        this.gameState = 'INTRO';
        this.trapsTriggered = { A: false, B: false };
        this.dialogueQueue = [];
        this.isDialogueActive = false;
        this.plantsGrown = 0;
        this.requiredPlants = 6;
    }

    create() {
        Object.assign(this, SceneMixin);
        this.setupAudioVisualizer();
        this.visualizerGraphics = this.add.graphics().setDepth(0);

        // Background (purple/nature tint)
        this.bg = this.add.rectangle(400, 300, 800, 600, 0x2a1a2a).setDepth(1);

        // Ground
        this.ground = this.add.rectangle(400, 580, 800, 40, 0x3a2a1a).setDepth(2);
        this.physics.add.existing(this.ground, true);

        // E-waste mountain (pile of broken PCs)
        this.ewaste = this.add.image(650, 480, 'broken_pc').setDepth(3).setScale(0.15);
        this.add.image(620, 520, 'broken_pc').setDepth(3).setScale(0.12).setTint(0x888888);
        this.add.image(680, 510, 'broken_pc').setDepth(3).setScale(0.1).setTint(0x666666);

        // Hero
        this.hero = this.physics.add.sprite(100, 500, 'hero').setDepth(10);
        this.hero.setCollideWorldBounds(true);
        this.hero.setScale(0.15);
        this.physics.add.collider(this.hero, this.ground);

        // Traps
        this.trapA = this.add.text(200, 500, '🔥 Burn E-Waste', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ff0000',
            backgroundColor: '#330000', padding: { x: 10, y: 5 }
        }).setDepth(5).setVisible(false);
        this.trapAZone = this.add.zone(250, 520, 120, 40);
        this.physics.add.existing(this.trapAZone, false);
        this.trapAZone.body.setAllowGravity(false);

        this.trapB = this.add.text(380, 500, '📦 Ship to Africa', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ff0000',
            backgroundColor: '#330000', padding: { x: 10, y: 5 }
        }).setDepth(5).setVisible(false);
        this.trapBZone = this.add.zone(450, 520, 120, 40);
        this.physics.add.existing(this.trapBZone, false);
        this.trapBZone.body.setAllowGravity(false);

        // NPCs
        this.goliath = this.physics.add.sprite(600, 300, 'goliath').setDepth(5);
        this.goliath.setScale(0.18).setFlipX(true).body.setAllowGravity(false);
        this.goliath.setVisible(false);

        this.penguin = this.physics.add.sprite(50, 400, 'penguin').setDepth(5);
        this.penguin.setScale(0.15).body.setAllowGravity(false);
        this.penguin.setVisible(false);

        // Garden area (for planting)
        this.gardenPlots = [];
        for (let i = 0; i < 6; i++) {
            const plot = this.add.rectangle(150 + i * 90, 530, 60, 30, 0x553311).setDepth(4);
            plot.planted = false;
            this.gardenPlots.push(plot);
        }

        // UI
        this.createDialogueBox(0x88ff88, '#88ff88');
        this.createGardenUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Collisions
        this.physics.add.overlap(this.hero, this.trapAZone, () => this.triggerTrap('A'), null, this);
        this.physics.add.overlap(this.hero, this.trapBZone, () => this.triggerTrap('B'), null, this);

        // Previous artifacts (different scales for different native sizes)
        this.add.image(50, 50, 'item_n').setDepth(100).setScale(0.05);
        this.add.image(100, 50, 'item_i').setDepth(100).setScale(0.15);
        this.add.image(150, 50, 'item_r').setDepth(100).setScale(0.05);

        this.startIntro();
    }

    update() {
        this.updateVisualizer(0x88ff88);

        if (this.gameState === 'GARDEN') {
            // Hero moves and can plant
            if (this.cursors.left.isDown) {
                this.hero.setVelocityX(-200);
                this.hero.setFlipX(true);
                this.hero.setTexture('hero_walk');
            } else if (this.cursors.right.isDown) {
                this.hero.setVelocityX(200);
                this.hero.setFlipX(false);
                this.hero.setTexture('hero_walk');
            } else {
                this.hero.setVelocityX(0);
                this.hero.setTexture('hero');
            }

            // Check for planting with SPACE
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.tryPlant();
            }
        } else {
            this.handleHeroMovement();
            if (this.isDialogueActive && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
                this.advanceDialogue();
            }
        }
    }

    createGardenUI() {
        this.gardenContainer = this.add.container(0, 0).setDepth(50).setVisible(false);
        this.gardenProgress = this.add.text(400, 30, 'Plants: 0 / 6', {
            fontFamily: 'Courier', fontSize: '24px', color: '#00ff00'
        }).setOrigin(0.5);
        this.gardenContainer.add(this.gardenProgress);
        this.gardenContainer.add(this.add.text(400, 60, 'Stand over a plot and press SPACE to plant!', {
            fontFamily: 'Courier', fontSize: '14px', color: '#88ff88'
        }).setOrigin(0.5));
    }

    // ==================== GAME FLOW ====================
    startIntro() {
        this.showDialogue('SYSTEM', 'LEVEL 4: DURABLE - Sustainable Computing');
        this.showDialogue('SYSTEM', 'Mountains of e-waste poison the land...', () => this.spawnGoliath());
    }

    spawnGoliath() {
        this.goliath.setVisible(true);
        // Flying effect
        this.tweens.add({
            targets: this.goliath,
            y: 450,
            duration: 1500,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });
        this.goliath.setTexture('goliath_move');

        this.time.delayedCall(1000, () => {
            this.showDialogue('GOLIATH', 'Who cares about old junk? Burn it! Ship it!');
            this.showDialogue('GOLIATH', 'Out of sight, out of mind!', () => this.showTraps());
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

            // Fire effect
            const fire = this.add.text(650, 400, '🔥🔥🔥', {
                fontFamily: 'Courier', fontSize: '48px'
            }).setDepth(20);
            this.tweens.add({ targets: fire, alpha: 0, y: 300, duration: 2000, onComplete: () => fire.destroy() });

            // Smoke
            const smoke = this.add.text(650, 350, '☠️ TOXIC SMOKE', {
                fontFamily: 'Courier', fontSize: '24px', color: '#888888'
            }).setDepth(20);
            this.tweens.add({ targets: smoke, alpha: 0, y: 200, duration: 3000, onComplete: () => smoke.destroy() });

            this.showDialogue('SYSTEM', 'Burning e-waste releases toxic fumes!');
            this.showDialogue('SYSTEM', 'Heavy metals poison air and water.', () => this.checkBothTraps());
        } else {
            this.trapsTriggered.B = true;
            playSound(this, 'siren');

            const ship = this.add.text(650, 400, '🚢 → 🌍', {
                fontFamily: 'Courier', fontSize: '32px'
            }).setDepth(20);
            this.tweens.add({ targets: ship, x: 100, duration: 2000, onComplete: () => ship.destroy() });

            this.showDialogue('SYSTEM', 'Illegal e-waste dumping exploits poor nations!');
            this.showDialogue('SYSTEM', 'This is environmental colonialism.', () => this.checkBothTraps());
        }
    }

    checkBothTraps() {
        if (this.trapsTriggered.A && this.trapsTriggered.B) {
            this.spawnMentor();
        } else {
            this.gameState = 'EXPLORE';
            const remaining = !this.trapsTriggered.A ? 'Burn E-Waste' : 'Ship to Africa';
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
            y: '+=20',
            duration: 800,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(1500, () => {
            this.showDialogue('MENTOR', 'Both paths destroy our planet!');
            this.showDialogue('MENTOR', 'Reduce, Reuse, Repair, Recycle!');
            this.showDialogue('MENTOR', 'Plant the Garden of Sustainability!', () => {
                this.trapA.setVisible(false);
                this.trapB.setVisible(false);
                this.startGarden();
            });
        });
    }

    startGarden() {
        this.gardenContainer.setVisible(true);
        this.plantsGrown = 0;
        this.updateGardenProgress();

        // Show instruction, then switch to GARDEN state after dialogue dismissed
        this.showDialogue('SYSTEM', 'Stand on a brown plot and press SPACE to plant!', () => {
            this.gameState = 'GARDEN';
        });
    }

    tryPlant() {
        // Check if hero is over an unplanted plot
        for (let plot of this.gardenPlots) {
            if (plot.planted) continue;

            const distance = Phaser.Math.Distance.Between(
                this.hero.x, this.hero.y,
                plot.x, plot.y
            );

            if (distance < 50) {
                this.plantInPlot(plot);
                return;
            }
        }
    }

    plantInPlot(plot) {
        plot.planted = true;
        playSound(this, 'success');

        // Grow a plant
        const plantEmoji = ['🌱', '🌿', '🌻', '🌳', '🍀', '🌸'][this.plantsGrown];
        const plant = this.add.text(plot.x, plot.y - 20, plantEmoji, {
            fontFamily: 'Courier', fontSize: '32px'
        }).setOrigin(0.5).setDepth(10).setScale(0);

        this.tweens.add({
            targets: plant,
            scale: 1,
            duration: 500,
            ease: 'Back.Out'
        });

        // Change plot color to green
        plot.setFillStyle(0x225522);

        // Shrink e-waste
        this.tweens.add({
            targets: this.ewaste,
            scale: this.ewaste.scale - 0.02,
            alpha: this.ewaste.alpha - 0.15,
            duration: 300
        });

        this.plantsGrown++;
        this.updateGardenProgress();

        if (this.plantsGrown >= this.requiredPlants) {
            this.completeGarden();
        }
    }

    updateGardenProgress() {
        this.gardenProgress.setText(`Plants: ${this.plantsGrown} / ${this.requiredPlants}`);
    }

    completeGarden() {
        if (this.gameState === 'WON') return;
        this.gameState = 'WON';
        this.gardenContainer.setVisible(false);

        playSound(this, 'success');

        // E-waste disappears
        this.tweens.add({ targets: this.ewaste, alpha: 0, scale: 0, duration: 1000 });

        // Item D appears
        const itemD = this.add.image(400, 300, 'item_d').setDepth(50).setScale(0.2).setAlpha(0);
        this.tweens.add({ targets: itemD, alpha: 1, scale: 0.4, duration: 1000 });

        // Start harmony layer
        this.startMusic('harmony');

        // Background becomes greener
        this.tweens.add({ targets: this.bg, fillColor: { from: 0x2a1a2a, to: 0x1a3a1a }, duration: 2000 });

        this.showDialogue('HERO', 'The garden grows from recycled parts!');
        this.showDialogue('SYSTEM', 'Artifact Acquired: [D] - Durable');
        this.showDialogue('SYSTEM', 'All 4 artifacts collected! The full symphony plays...', () => {
            this.tweens.add({ targets: itemD, x: 200, y: 50, scale: 0.08, duration: 1000 });
            this.time.delayedCall(3000, () => this.scene.start('EndingScene'));
        });
    }
}

Object.assign(Level4Scene.prototype, SceneMixin);
