// ==================== LEVEL 1 SCENE ====================
class Level1Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Level1Scene' });
        this.gameState = 'INTRO';
        this.trapsTriggered = { A: false, B: false };
        this.dialogueQueue = [];
        this.isDialogueActive = false;
        this.terminalInput = '';
        this.terminalStep = 0;
    }

    create() {
        // Audio Visualizer
        Object.assign(this, SceneMixin);
        this.setupAudioVisualizer();
        this.visualizerGraphics = this.add.graphics().setDepth(0);

        // Background
        this.bg = this.add.rectangle(400, 300, 800, 600, 0x1a1a1a).setDepth(1);

        // Ground
        this.ground = this.add.rectangle(400, 580, 800, 40, 0x333333).setDepth(2);
        this.physics.add.existing(this.ground, true);

        // Hero
        this.hero = this.physics.add.sprite(100, 500, 'hero').setDepth(10);
        this.hero.setCollideWorldBounds(true);
        this.hero.setScale(0.15);
        this.physics.add.collider(this.hero, this.ground);

        // Traps
        this.trapA = this.physics.add.sprite(300, 520, 'money_bag').setDepth(5);
        this.trapA.setScale(0.1);
        this.trapA.body.setAllowGravity(false);
        this.trapA.body.setImmovable(true);
        this.trapA.setVisible(false);

        this.trapB = this.physics.add.sprite(500, 520, 'trash').setDepth(5);
        this.trapB.setScale(0.1);
        this.trapB.body.setAllowGravity(false);
        this.trapB.body.setImmovable(true);
        this.trapB.setVisible(false);

        // NPCs
        this.goliath = this.physics.add.sprite(650, 450, 'goliath').setDepth(5);
        this.goliath.setScale(0.2);
        this.goliath.setFlipX(true);
        this.goliath.body.setAllowGravity(false);
        this.goliath.setVisible(false);

        this.penguin = this.physics.add.sprite(50, 500, 'penguin').setDepth(5);
        this.penguin.setScale(0.15);
        this.penguin.body.setAllowGravity(false);
        this.penguin.setVisible(false);

        this.police = this.physics.add.sprite(800, 400, 'police').setDepth(5);
        this.police.setScale(0.15);
        this.police.body.setAllowGravity(false);
        this.police.setVisible(false);

        // UI
        this.createDialogueBox();
        this.createTerminalUI();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Collisions
        this.physics.add.overlap(this.hero, this.trapA, () => this.triggerTrap('A'), null, this);
        this.physics.add.overlap(this.hero, this.trapB, () => this.triggerTrap('B'), null, this);

        // Terminal keyboard
        this.input.keyboard.on('keydown', (event) => {
            if (this.gameState === 'TERMINAL') this.handleTerminalInput(event);
        });

        this.startIntro();
    }

    update() {
        this.updateVisualizer(0x00ff00);
        this.handleHeroMovement();

        if (this.isDialogueActive && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.advanceDialogue();
        }
    }

    // ==================== TERMINAL ====================
    createTerminalUI() {
        this.terminalContainer = this.add.container(100, 100).setDepth(200).setVisible(false);
        this.terminalLines = []; // Store all output lines
        this.maxVisibleLines = 15; // Max lines visible in terminal

        const termBg = this.add.graphics();
        termBg.fillStyle(0x000000, 0.95);
        termBg.lineStyle(3, 0x00ff00, 1);
        termBg.fillRect(0, 0, 600, 400);
        termBg.strokeRect(0, 0, 600, 400);
        this.terminalContainer.add(termBg);

        this.terminalContainer.add(this.add.text(10, 5, 'NIRD Terminal v1.0', {
            fontFamily: 'Courier', fontSize: '14px', color: '#00ff00'
        }));

        // Output area - fixed height, shows last N lines
        this.terminalOutput = this.add.text(10, 30, '', {
            fontFamily: 'Courier', fontSize: '13px', color: '#00ff00',
            wordWrap: { width: 580 }, lineSpacing: 2
        });
        this.terminalContainer.add(this.terminalOutput);

        this.terminalPromptText = this.add.text(10, 360, 'C:\\Users\\School> ', {
            fontFamily: 'Courier', fontSize: '14px', color: '#00ff00'
        });
        this.terminalContainer.add(this.terminalPromptText);

        this.terminalCursor = this.add.text(170, 360, '_', {
            fontFamily: 'Courier', fontSize: '14px', color: '#00ff00'
        });
        this.terminalContainer.add(this.terminalCursor);

        this.time.addEvent({
            delay: 500,
            callback: () => { if (this.terminalCursor) this.terminalCursor.setVisible(!this.terminalCursor.visible); },
            loop: true
        });
    }

    addTerminalLine(text) {
        // Add line(s) and update display with scrolling
        const newLines = text.split('\n');
        this.terminalLines = this.terminalLines.concat(newLines);
        this.updateTerminalOutput();
    }

    updateTerminalOutput() {
        // Show only the last N lines (scroll effect)
        const visibleLines = this.terminalLines.slice(-this.maxVisibleLines);
        this.terminalOutput.setText(visibleLines.join('\n'));
    }

    showTerminal() {
        this.gameState = 'TERMINAL';
        this.terminalContainer.setVisible(true);
        this.terminalInput = '';
        this.terminalStep = 0;
        this.updateTerminalDisplay();
    }

    handleTerminalInput(event) {
        if (event.key === 'Enter') {
            this.processTerminalCommand();
        } else if (event.key === 'Backspace') {
            this.terminalInput = this.terminalInput.slice(0, -1);
            this.updateTerminalPrompt();
        } else if (event.key.length === 1) {
            this.terminalInput += event.key;
            this.updateTerminalPrompt();
        }
    }

    updateTerminalPrompt() {
        let promptText = '';
        if (this.terminalStep === 0) promptText = 'C:\\Users\\School> ' + this.terminalInput;
        else if (this.terminalStep === 1) promptText = 'Enter username: ' + this.terminalInput;
        else if (this.terminalStep === 2) promptText = 'Enter password: ' + '*'.repeat(this.terminalInput.length);
        this.terminalPromptText.setText(promptText);
        this.terminalCursor.setX(this.terminalPromptText.x + this.terminalPromptText.width + 5);
    }

    updateTerminalDisplay() {
        this.terminalLines = [];
        this.addTerminalLine('Microsoft Windows [CRITICAL ERROR]');
        this.addTerminalLine('Windows 10 Support has ended.');
        this.addTerminalLine('Security: COMPROMISED');
        this.addTerminalLine('');
        this.addTerminalLine('Mentor says: "Type the magic words!"');
        this.addTerminalLine('Hint: wsl --install -d Ubuntu');
        this.addTerminalLine('');
        this.updateTerminalPrompt();
    }

    processTerminalCommand() {
        const input = this.terminalInput.trim().toLowerCase();

        if (this.terminalStep === 0) {
            this.addTerminalLine('> ' + this.terminalInput);
            if (input.includes('wsl') && input.includes('install') && input.includes('ubuntu')) {
                this.addTerminalLine('');
                this.addTerminalLine('Installing WSL...');
                this.terminalInput = '';
                this.runInstallAnimation();
            } else {
                this.addTerminalLine('SYNTAX ERROR: Try again...');
                this.addTerminalLine('');
                this.terminalInput = '';
                this.cameras.main.shake(200, 0.01);
            }
        } else if (this.terminalStep === 1) {
            this.addTerminalLine('Username set: ' + this.terminalInput);
            this.addTerminalLine('');
            this.terminalInput = '';
            this.terminalStep = 2;
        } else if (this.terminalStep === 2) {
            this.addTerminalLine('Password set: ********');
            this.addTerminalLine('');
            this.addTerminalLine('Creating user account... Done!');
            this.addTerminalLine('=== INSTALLATION COMPLETE ===');
            this.addTerminalLine('Welcome to Ubuntu on Windows!');
            this.time.delayedCall(2000, () => this.completeLevel());
        }
        this.updateTerminalPrompt();
    }

    runInstallAnimation() {
        const steps = [
            { text: 'Downloading Linux kernel...', delay: 500 },
            { text: '25%... 50%... 75%... 100% Done!', delay: 800 },
            { text: 'Unpacking Ubuntu... Done!', delay: 400 },
            { text: 'Mounting NIRD drive... Success!', delay: 400 },
            { text: '', delay: 200 },
            { text: 'Create your Linux user account:', delay: 500 }
        ];

        let totalDelay = 0;
        steps.forEach(step => {
            this.time.delayedCall(totalDelay, () => {
                this.addTerminalLine(step.text);
            });
            totalDelay += step.delay;
        });

        this.time.delayedCall(totalDelay, () => {
            this.terminalStep = 1;
            this.updateTerminalPrompt();
        });
    }

    // ==================== GAME FLOW ====================
    startIntro() {
        this.showDialogue('SYSTEM', 'CRITICAL ERROR. Windows 10 End of Support reached.');
        this.showDialogue('SYSTEM', 'Security status: COMPROMISED');
        this.showDialogue('SYSTEM', 'School budget: $0.00', () => this.spawnGoliath());
    }

    spawnGoliath() {
        this.goliath.setVisible(true);
        this.goliath.setTexture('goliath_move');

        // Flying effect
        this.tweens.add({
            targets: this.goliath,
            y: 450,
            duration: 1500,
            ease: 'Sine.InOut',
            yoyo: true,
            repeat: -1
        });

        this.time.delayedCall(1000, () => {
            this.showDialogue('GOLIATH', 'Well, well. Looks like your machines are obsolete, kid.');
            this.showDialogue('GOLIATH', 'They are unsafe trash now. Pay up!');
            this.showDialogue('HERO', 'But the hardware works fine! It\'s just the software...');
            this.showDialogue('GOLIATH', 'SILENCE! Buy my new licenses or get out.', () => this.showTraps());
        });
    }

    showTraps() {
        this.gameState = 'EXPLORE';
        this.trapA.setVisible(true);
        this.trapB.setVisible(true);

        this.trapALabel = this.add.text(260, 440, 'BUY NEW PCs\n($50,000)', {
            fontFamily: 'Courier', fontSize: '12px', color: '#ff0000', align: 'center'
        }).setDepth(10);

        this.trapBLabel = this.add.text(460, 440, 'TRASH THE PCs', {
            fontFamily: 'Courier', fontSize: '12px', color: '#ff0000', align: 'center'
        }).setDepth(10);

        this.showDialogue('SYSTEM', 'Walk into a choice to select it. (Arrow keys to move)');
    }

    triggerTrap(trapType) {
        if (this.gameState !== 'EXPLORE') return;
        if (trapType === 'A' && this.trapsTriggered.A) return;
        if (trapType === 'B' && this.trapsTriggered.B) return;

        this.gameState = 'DIALOGUE';

        if (trapType === 'A') {
            this.trapsTriggered.A = true;
            playSound(this, 'slap');
            this.cameras.main.shake(500, 0.03);
            this.tweens.add({ targets: this.goliath, scaleX: 0.3, scaleY: 0.3, duration: 500 });

            const moneyText = this.add.text(300, 400, '-$50,000', {
                fontFamily: 'Courier', fontSize: '24px', color: '#ff0000'
            }).setDepth(20);
            this.tweens.add({ targets: moneyText, y: 200, alpha: 0, duration: 2000, onComplete: () => moneyText.destroy() });

            this.showDialogue('GOLIATH', 'HAHAHA! You bankrupted the school!');
            this.showDialogue('SYSTEM', 'Insufficient funds. This path leads to ruin.', () => this.checkBothTraps());

        } else if (trapType === 'B') {
            this.trapsTriggered.B = true;
            playSound(this, 'siren');
            this.police.setVisible(true);
            this.tweens.add({ targets: this.police, x: 600, duration: 1000 });

            this.showDialogue('POLLUTION POLICE', 'HALT! E-Waste dumping is a crime!');
            this.showDialogue('SYSTEM', 'Ecological destruction is not the answer.', () => this.checkBothTraps());
        }
    }

    checkBothTraps() {
        if (this.trapsTriggered.A && this.trapsTriggered.B) {
            this.spawnMentor();
        } else {
            this.gameState = 'EXPLORE';
            const remaining = !this.trapsTriggered.A ? 'BUY NEW PCs' : 'TRASH THE PCs';
            this.showDialogue('SYSTEM', `You've seen one path. Now try: ${remaining}`);
        }
    }

    spawnMentor() {
        this.penguin.setVisible(true);
        this.penguin.setAlpha(0);
        this.penguin.setTexture('penguin_walk');
        this.tweens.add({ targets: this.penguin, alpha: 1, x: 200, duration: 1500 });

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
            this.showDialogue('MENTOR', 'Wait! Both paths lead to destruction.');
            this.showDialogue('MENTOR', 'The machine has a soul. It does not need Windows to breathe.');
            this.showDialogue('MENTOR', 'Give it the penguin\'s heart. Open the Terminal!', () => {
                this.trapA.setVisible(false);
                this.trapB.setVisible(false);
                this.trapALabel.setVisible(false);
                this.trapBLabel.setVisible(false);
                this.showTerminal();
            });
        });
    }

    completeLevel() {
        if (this.gameState === 'WON') return;
        this.gameState = 'WON';
        this.terminalContainer.setVisible(false);

        playSound(this, 'success');
        this.tweens.add({ targets: this.bg, fillColor: { from: 0x1a1a1a, to: 0x0a2a0a }, duration: 2000 });

        const itemN = this.add.image(400, 300, 'item_n').setDepth(50).setScale(0.3).setAlpha(0);
        this.tweens.add({ targets: itemN, alpha: 1, scale: 0.5, duration: 1000 });

        this.startMusic('bass');

        this.showDialogue('SYSTEM', 'OS Updated. Performance: 100%. Cost: $0.');
        this.showDialogue('HERO', 'It\'s... it\'s fast again!');
        this.showDialogue('SYSTEM', 'Artifact Acquired: [N] - Numérique');
        this.showDialogue('SYSTEM', 'Level 1 Complete! The bass line begins...', () => {
            this.tweens.add({ targets: itemN, x: 50, y: 50, scale: 0.05, duration: 1000 });
            this.time.delayedCall(3000, () => this.scene.start('Level2Scene'));
        });
    }
}

// Apply mixin methods
Object.assign(Level1Scene.prototype, SceneMixin);
