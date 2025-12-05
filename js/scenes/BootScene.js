// ==================== BOOT SCENE ====================
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // --- SPRITES (Idle & Walking) ---
        this.load.image('hero', 'assets/sprites/hero-idle.png');
        this.load.image('hero_walk', 'assets/sprites/hero-walking.png');
        this.load.image('goliath', 'assets/sprites/goliath-idle.png');
        this.load.image('goliath_move', 'assets/sprites/goliath-moving.png');
        this.load.image('penguin', 'assets/sprites/penguin-idle.png');
        this.load.image('penguin_walk', 'assets/sprites/penguin-walking.png');
        this.load.image('police', 'assets/sprites/police-idle.png');
        this.load.image('police_fly', 'assets/sprites/police-flying.png');
        this.load.image('villagers', 'assets/sprites/villagers.png');
        this.load.image('background', 'assets/sprites/background.png');

        // --- ITEMS ---
        this.load.image('item_n', 'assets/items/item_N.png');
        this.load.image('item_i', 'assets/items/item_I.png');
        this.load.image('item_r', 'assets/items/item_R.png');
        this.load.image('item_d', 'assets/items/item_D.png');

        // --- TRAPS ---
        this.load.image('money_bag', 'assets/traps/money-bag.png');
        this.load.image('trash', 'assets/traps/trash.png');
        this.load.image('fixed_pc', 'assets/traps/fixed_pc.png');
        this.load.image('broken_pc', 'assets/traps/broken_pc.png');
        this.load.image('cloud', 'assets/traps/cloud.png');
        this.load.image('firewall', 'assets/traps/firewall.png');
        this.load.image('bridge', 'assets/traps/bridge.png');
        this.load.image('bridge_broken', 'assets/traps/bridge_broken.png');
        this.load.image('virus', 'assets/traps/virus_idle.png');
        this.load.image('virus_open', 'assets/traps/virus_open.png');

        // --- AUDIO (Optional) ---
        this.load.audio('track_bass', 'assets/music/track_bass.mp3');
        this.load.audio('track_drums', 'assets/music/track_drums.mp3');
        this.load.audio('track_melody', 'assets/music/track_melody.mp3');
        this.load.audio('track_harmony', 'assets/music/track_harmony.mp3');
        this.load.audio('slap', 'assets/sfx/slap.wav');
        this.load.audio('siren', 'assets/sfx/siren.wav');
        this.load.audio('success', 'assets/sfx/success.wav');
    }

    create() {
        this.registry.set('unlockedLayers', []);
        this.registry.set('artifacts', []);
        this.scene.start('Level1Scene');
    }
}
