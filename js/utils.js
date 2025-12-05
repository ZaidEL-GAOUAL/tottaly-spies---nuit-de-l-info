// ==================== HELPER FUNCTIONS ====================
function playSound(scene, key) {
    if (scene.cache.audio.exists(key)) {
        scene.sound.play(key);
    }
}

// Mixin for common scene functionality
const SceneMixin = {
    setupAudioVisualizer() {
        if (this.sound.context && this.sound.context.createAnalyser) {
            this.analyser = this.sound.context.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            if (this.sound.masterVolumeNode) {
                this.sound.masterVolumeNode.connect(this.analyser);
            }
        }
    },

    updateVisualizer(color = 0x00ff00) {
        this.visualizerGraphics.clear();
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.dataArray);
            this.visualizerGraphics.fillStyle(color, 0.2);
            const barWidth = (800 / this.dataArray.length) * 2.5;
            let x = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                const barHeight = this.dataArray[i] * 1.2;
                this.visualizerGraphics.fillRect(x, 600 - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }
    },

    createDialogueBox(borderColor = 0x00ff00, textColor = '#00ff00') {
        this.dialogueBoxBg = this.add.graphics().setDepth(100);
        this.dialogueBoxBg.fillStyle(0x000000, 0.9);
        this.dialogueBoxBg.lineStyle(2, borderColor, 1);
        this.dialogueBoxBg.fillRect(50, 480, 700, 100);
        this.dialogueBoxBg.strokeRect(50, 480, 700, 100);
        this.dialogueBoxBg.setVisible(false);

        this.dialogueSpeaker = this.add.text(70, 485, '', {
            fontFamily: 'Courier', fontSize: '14px', color: '#ffff00'
        }).setDepth(101);

        this.dialogueText = this.add.text(70, 505, '', {
            fontFamily: 'Courier', fontSize: '16px', color: textColor,
            wordWrap: { width: 660 }
        }).setDepth(101);

        this.dialoguePrompt = this.add.text(700, 560, '[SPACE]', {
            fontFamily: 'Courier', fontSize: '12px', color: '#888888'
        }).setDepth(101);
        this.dialoguePrompt.setVisible(false);
    },

    showDialogue(speaker, text, callback = null) {
        this.dialogueQueue.push({ speaker, text, callback });
        if (!this.isDialogueActive) {
            this.displayNextDialogue();
        }
    },

    displayNextDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.isDialogueActive = false;
            this.dialogueBoxBg.setVisible(false);
            this.dialogueSpeaker.setText('');
            this.dialogueText.setText('');
            this.dialoguePrompt.setVisible(false);
            return;
        }

        this.isDialogueActive = true;
        this.dialogueBoxBg.setVisible(true);
        this.dialoguePrompt.setVisible(true);

        const { speaker, text, callback } = this.dialogueQueue.shift();
        this.currentCallback = callback;
        this.dialogueSpeaker.setText(speaker);
        this.dialogueText.setText(text);
    },

    advanceDialogue() {
        if (this.currentCallback) {
            this.currentCallback();
            this.currentCallback = null;
        }
        this.displayNextDialogue();
    },

    handleHeroMovement(speed = 200) {
        if (this.gameState === 'EXPLORE' || this.gameState === 'WON') {
            if (this.cursors.left.isDown) {
                this.hero.setVelocityX(-speed);
                this.hero.setFlipX(true);
                this.hero.setTexture('hero_walk');
            } else if (this.cursors.right.isDown) {
                this.hero.setVelocityX(speed);
                this.hero.setFlipX(false);
                this.hero.setTexture('hero_walk');
            } else {
                this.hero.setVelocityX(0);
                this.hero.setTexture('hero');
            }
        } else {
            this.hero.setVelocityX(0);
            this.hero.setTexture('hero');
        }
    },

    startMusic(layer) {
        if (this.cache.audio.exists('track_' + layer)) {
            const music = this.sound.add('track_' + layer, { loop: true, volume: 0 });
            music.play();
            this.tweens.add({
                targets: music,
                volume: 1,
                duration: 2000
            });
        }
    }
};
