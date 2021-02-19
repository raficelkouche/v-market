class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }
  
  game ()
  {
    //call on login/register scence to get data
    Phaser.Scene.call(this, { key: 'game' });
  }
  init(data)
  {
    //pass var from login scence
    this.playerInfo = {
      name: data.name.replace(/%20/g, " ").trim(), 
      guest: data.guest || false,
      id: data.user_id,
      x: data.x || undefined,
      y: data.y || undefined
    }
    this.storeInfo = data.storeInfo;
  }

  static player = Phaser.Physics.Arcade.Sprite;
  static playerName;
  static overlap = true;
  static inshop = false;
  static storeExistThisMap;
  static storeId;
  static storeLoadCount;
  static storeName;
  static helperMsg;

  preload() {
    //load all texture
    this.load.tilemapTiledJSON("map", "maps/vMarket2.json")
    this.load.image('tile', 'maps/vMarketTilesCROPPED.png')
    this.load.spritesheet('fm_02', 'characters/fm_02.png', { frameWidth: 32, frameHeight: 32 })
    this.load.html('store_window', 'templates/store_window.html');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.key = this.input.keyboard.addKeys("W, A, S, D, ESC")
    this.storeLoadCount = 0;
    //get all store info
  }

  create() {
    console.log(this.storeInfo)
    let storeExist = {};
    this.storeExistThisMap = {};
    // get all store info to a more easy handle data type
    for (const store of this.storeInfo) { 
      storeExist[store.id] = store
    }

    //make the map of this scence
    this.map = this.make.tilemap({ key: "map" });

    //add object layer first. 
    let storesArea = this.map.getObjectLayer('StoreObj')['objects'];
    let storeAreaGroup = this.physics.add.staticGroup({});
    storesArea.forEach(area => {
      let a = storeAreaGroup.create(area.x, area.y);
      a.setScale(area.width / 32, area.height / 32);
      a.setOrigin(0); //to replace auto offset
      a.body.width = area.width;
      a.body.height = area.height;
      a.name = area.properties[0].value //add store_id as name to do ajax call, 
      //please note, this store_id must be set as first custom_property in tile
      //overlap cb does not seems to return id for some reason, so use name
      if (storeExist[a.name]) {
        this.storeExistThisMap[a.name] = storeExist[a.name]; // only get store on this map
      }
    });

    //physics body needs to refresh
    storeAreaGroup.refresh();
    //console.log(storeAreaGroup.children.entries[0].name) < Example of storeArea's store_id path

    //add other layer to overwrite obj layer
    this.tileset = this.map.addTilesetImage('vMarketTiles', 'tile')
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0)
    this.cityObjLayer = this.map.createLayer("CityObj", this.tileset, 0, 0)

    //grab collides tile from each map. Note: collides have NOT been set yet
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.cityObjLayer.setCollisionByProperty({ collides: true });


    //make sprite anime
    this.anims.create({
      key: 'idle-u',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [10] }),
    });
    this.anims.create({
      key: 'idle-d',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [1] }),
    });
    this.anims.create({
      key: 'idle-l',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [4] }),
    });
    this.anims.create({
      key: 'idle-r',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [7] }),
    });
    this.anims.create({
      key: 'walk-u',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [9, 10, 11] }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: 'walk-d',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [0, 1, 2] }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: 'walk-l',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [3, 4, 5] }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: 'walk-r',
      frames: this.anims.generateFrameNumbers('fm_02', { frames: [6, 7, 8] }),
      frameRate: 7,
      repeat: -1
    });

    //add player sprite, animation and name
    this.player = this.physics.add.sprite( this.playerInfo.x ||400, this.playerInfo.y || 300, "fm_02")
    this.player.play('idle-d')
    this.playerName = this.add.text(this.player.x -60, this.player.y+32, `${this.playerInfo.name}`)

    //add 3 camera, 1st to follow player, mini(2nd) for mini map, and 3rd for background when pause 
    //set camera to size of map, zoom in for better view, then make this follow player
    this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true)

    //make 'mini map' and place to top right, set bound of map, zoom out so it is mini, and set to follow player
    this.miniCam = this.cameras.add(1030, 0, 250, 250);
    this.miniCam.setBounds(0, 0, 1920, 1920)
    this.miniCam.zoom = 0.35;
    this.miniCam.startFollow(this.player, true)

    //set camera to size design res of canvas, center the cam, hide it to wait for call
    this.pauseCam = this.cameras.add(0, 0, 1280, 960);
    this.pauseCam.setBounds(320,480,1920,1920)
    this.pauseCam.zoom = 1;
    this.pauseCam.setVisible(false);
    
    //add overlapArea detect
    this.physics.add.overlap(this.player, storeAreaGroup, (x, y) => { 
      this.storeId = y.name;
      /*
      check if the store exist, if do and name have not been display, add name and interactible msg on screen, and trigger display so it will only run once.
      if for some reason, player is still overlap, but name disspear, add it back.
      */
      if (this.storeExistThisMap[this.storeId] && !this.storeExistThisMap[this.storeId].display) {
        this.storeName = this.add.text(y.x, y.y - 32*3 , `${this.storeExistThisMap[this.storeId].name}`, { font: "bold 28px Messiri", fill: "#fff"});
        this.helperMsg = this.add.text(y.x -32, y.y, `Space to interact`);
        this.storeExistThisMap[this.storeId].display = true;
      } else if (this.storeExistThisMap[this.storeId] && !this.storeName) {
        this.storeName = this.add.text(y.x, y.y - 32*3 , `${this.storeExistThisMap[this.storeId].name}`, { font: "bold 28px Messiri", fill: "#fff" });
        this.helperMsg = this.add.text(y.x -32, y.y, `Space to interact`);
        this.add.text(y.x -32, y.y, `Space to interact`);
      } 
      if (this.cursors.space.isDown) {
        this.playerInfo.store_id = this.storeId;
        this.playerInfo.x = this.player.x;
        this.playerInfo.y = this.player.y;
        this.playerInfo.storeInfo = this.storeInfo;
        this.platerInfo.storeName = this.storeName._text
        this.scene.start('store', this.playerInfo);
      }
      this.overlap = true;
    }, undefined, this); //check overlap with store area, change overlap to true

    //add collider with player
    // this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.groundLayer)
    this.physics.add.collider(this.player, this.cityObjLayer)

    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;
    this.player.body.setCollideWorldBounds(true); 
    
    //move from update so it does not check every ticks
    if (!this.overlap && this.storeName) {
      for (const x of Object.keys(this.storeExistThisMap)) {
        if (this.storeExistThisMap[x].name === this.storeName._text) this.storeExistThisMap[x].display = false;
      }
      this.storeName.destroy();
      this.helperMsg.destroy();
    }
  }

  update() {

    //update player movement
    this.player.setVelocity(0);
    if (this.cursors.left.isDown || this.key.A.isDown) {
      this.player.setVelocityX(-200);
      if (this.player.anims.currentAnim.key === 'walk-l') { }
      else if (this.cursors.up.isDown || this.cursors.down.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
        this.player.play('walk-l')
      }
    }
    else if (this.cursors.right.isDown || this.key.D.isDown) {
      this.player.setVelocityX(200);
      if (this.player.anims.currentAnim.key === 'walk-r') { }
      else if (this.cursors.up.isDown || this.cursors.down.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
        this.player.play('walk-r')
      }
    }
    if (this.cursors.up.isDown || this.key.W.isDown) {
      this.player.setVelocityY(-200);
      if (this.player.anims.currentAnim.key === 'walk-u') { }
      else {
        this.player.play('walk-u')
      }
    }
    else if (this.cursors.down.isDown || this.key.S.isDown) {
      this.player.setVelocityY(200);
      if (this.player.anims.currentAnim.key === 'walk-d') { }
      else {
        this.player.play('walk-d')
      }
    }

    //if player does not move, play idle anime
    if (!this.cursors.down.isDown && !this.cursors.up.isDown && !this.cursors.right.isDown && !this.cursors.left.isDown && !this.key.W.isDown && !this.key.A.isDown && !this.key.S.isDown && !this.key.D.isDown) {
      if (!this.player.anims.currentAnim.key.includes('idle')) {
        let newAnim = this.player.anims.currentAnim.key.split('-')
        this.player.play("idle-" + newAnim[1])
      }
    }

    //if player left the interactive area, remove shop name and interactible msg
    if (!this.overlap && this.storeName) {
      for (const x of Object.keys(this.storeExistThisMap)) {
        if (this.storeExistThisMap[x].name === this.storeName._text) this.storeExistThisMap[x].display = false;
      }
      this.storeName.destroy();
      this.helperMsg.destroy();
    }

    //update player name's place
    this.playerName.x = this.player.x-20;  
    this.playerName.y = this.player.y+20;
    this.overlap = false; //update overlap check
  }
}

export { Game }