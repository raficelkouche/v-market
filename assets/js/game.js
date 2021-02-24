const { socket, coordinates, connectSocket } = window.allGlobalVars

//The code below will handle the game scene
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
      name: sessionStorage.getItem("IGN"),
      guest: sessionStorage.getItem("guest") === "true",
      id: sessionStorage.getItem("user_id"),
      x: data.x || undefined,
      y: data.y || undefined
    }
    
  }

  static player;
  static playerContainer;
  static overlap = true;
  static inshop = false;
  static enterStore; //to prevent scene change fire more then once
  static storeInfo = [];
  static storeExistThisMap;
  static storeId;
  static storeLoadCount
  static storeNameThisMap;
  static storeName;
  static helperMsg;
  static gra;
  static otherPlayers;
  static playerInfo;
  static storesArea;
  static storeAreaGroup;
  
  preload() {
    //load all texture
    this.load.tilemapTiledJSON("map", "maps/vMarket2.json")
    this.load.image('tile', 'maps/vMarketTilesCROPPED.png')
    this.load.spritesheet('fm_02', 'characters/fm_02.png', { frameWidth: 32, frameHeight: 32 })
    this.load.html('store_window', 'templates/store_window.html');
    this.load.audio('background', 'audio/TownTheme.mp3')
    this.key = this.input.keyboard.addKeys("W, A, S, D, LEFT, UP, RIGHT, SPACE, DOWN, X, M") //WASD to move, M to toggle minimap
    this.storeLoadCount = 0;
    this.player = undefined;
  }

  create() {
    this.storeInfo = this.sys.game.globals.globalVars.storeData
    this.otherPlayers = this.physics.add.group();
    this.player = Phaser.Physics.Arcade.Sprite
    
    this.createMap()
    this.createPlayer(coordinates)
    this.updateCamera()
    this.createOverlap()
    this.addMiniMap()
    
    socket.on('all players', playersList => {
      Object.keys(playersList).forEach((player) => {
        this.sys.game.globals.globalVars.playersList[player] = playersList[player]
        this.addOtherPlayers(playersList[player])
      })
    })

    socket.on('new player', playerInfo => {
      this.sys.game.globals.globalVars.playersList[playerInfo.user_id] = playerInfo
      this.addOtherPlayers(playerInfo)
    })

    socket.on('player moved', data => {
      this.otherPlayers.getChildren().forEach((player) => {
        console.log(player.list[0].texture.key)
        if (player.list[0].player_id === data.user_id) {
          player.setPosition(data.x + 16, data.y + 16) // offset container
        }
        if(data.deltaX  > 0 && data.deltaY === 0 && player.list[0].anims.currentAnim.key != `walk-r-${player.list[0].texture.key}`) {
          player.list[0].play(`walk-r-${player.list[0].texture.key}`)
        } else if (data.deltaX < 0 && data.deltaY === 0 && player.list[0].anims.currentAnim.key != `walk-l-${player.list[0].texture.key}`) {
          player.list[0].play(`walk-l-${player.list[0].texture.key}`)
        }
        if(data.deltaY  > 0  && player.list[0].anims.currentAnim.key != `walk-d-${player.list[0].texture.key}`) {
          player.list[0].play(`walk-d-${player.list[0].texture.key}`)
        } else if (data.deltaY < 0 && player.list[0].anims.currentAnim.key != `walk-u-${player.list[0].texture.key}`) {
          player.list[0].play(`walk-u-${player.list[0].texture.key}`)
        }
        if (data.deltaX === 0 && data.deltaY === 0) {
          if (!player.list[0].anims.currentAnim.key.includes('idle')) {
            let newAnim = player.list[0].anims.currentAnim.key.split('-')
            player.list[0].play("idle-" + newAnim[1] + `-${player.list[0].texture.key}`)
          }
        }
      })
    })

    socket.on('delete user', user_id => {
      $('#friends-list').find(`#${user_id}`).remove()

      this.otherPlayers.getChildren().forEach((player) => {
        if (user_id === player.list[0].player_id) {
          player.destroy()
        }
      })
    })

    connectSocket();
    
    socket.emit("update-user-details", {
      username: this.playerInfo.name,
      user_id: this.playerInfo.id
    })

    //If the player goes to the store and then comes back
    if(this.sys.game.globals.globalVars.connectionEstablished){
      const playersList = this.sys.game.globals.globalVars.playersList
      Object.keys(playersList).forEach((player) => {
        this.addOtherPlayers(playersList[player])
      })
      
    }
    
   //disable key cap on all element so it would not steal the focus
    this.input.on('pointerdownoutside', () => {
      this.input.keyboard.disableGlobalCapture();
      for (const k of Object.keys(this.key)) {
        this.key[k].enabled = false;
      } 
    })

    $('canvas').on('click', ()=>{ 
      $(document.activeElement).blur();
      this.input.keyboard.enableGlobalCapture();
      for (const k of Object.keys(this.key)) {
        this.key[k].enabled = true;
      } 
    })
    
    
    // toggle mini map
    this.input.keyboard.on('keydown', function (event) {
      if(event.key === 'm') {
        this.miniCam.setVisible(!this.miniCam.visible)
      }
    }, this);
  }

  update() {
    //console.log(this.otherPlayers)
    if (true) {
      //take player into store if space is press when overlap
      if (this.overlap && this.key.SPACE.isDown && !this.enterStore) {
        this.enterStore = true; //prevent event fire twice
        this.playerInfo.store_id = this.storeId;
        coordinates.x = this.playerContainer.body.x + 16;
        coordinates.y = this.playerContainer.body.y + 16;
        this.playerInfo.storeInfo = this.storeInfo;
        this.storeName
          ? this.playerInfo.storeName = this.storeName
          : this.playerInfo.storeName = null;
        this.sys.game.globals.globalVars.connectionEstablished = true;
        this.storeOtherPlayersPositions()
        this.scene.start('store', this.playerInfo);
      }
  
      this.playerContainer.body.setVelocity(0);

      //update player movement
      if (this.key.LEFT.isDown || this.key.A.isDown) {
        this.playerContainer.body.setVelocityX(-150);
        if (this.player.anims.currentAnim.key === `walk-l-${this.player.texture.key}`) { }
        else if (this.key.UP.isDown || this.key.DOWN.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
          this.player.play(`walk-l-${this.player.texture.key}`)
        }
      }
      else if (this.key.RIGHT.isDown || this.key.D.isDown) {
        this.playerContainer.body.setVelocityX(150);
        if (this.player.anims.currentAnim.key === `walk-r-${this.player.texture.key}`) { }
        else if (this.key.UP.isDown || this.key.DOWN.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
          this.player.play(`walk-r-${this.player.texture.key}`)
        }
      }
      if (this.key.UP.isDown || this.key.W.isDown) {
        this.playerContainer.body.setVelocityY(-150);
        if (this.player.anims.currentAnim.key === `walk-u-${this.player.texture.key}`) { }
        else {
          this.player.play(`walk-u-${this.player.texture.key}`)
        }
      }
      else if (this.key.DOWN.isDown || this.key.S.isDown) {
        this.playerContainer.body.setVelocityY(150);
        if (this.player.anims.currentAnim.key === `walk-d-${this.player.texture.key}`) { }
        else {
          this.player.play(`walk-d-${this.player.texture.key}`)
        }
      }
  
      //if player does not move, play idle anime
      if (!this.key.DOWN.isDown && !this.key.UP.isDown && !this.key.RIGHT.isDown && !this.key.LEFT.isDown && !this.key.W.isDown && !this.key.A.isDown && !this.key.S.isDown && !this.key.D.isDown) {
        if (!this.player.anims.currentAnim.key.includes('idle')) {
          let newAnim = this.player.anims.currentAnim.key.split('-')
          this.player.play("idle-" + newAnim[1] + `-${this.player.texture.key}`)
        }
      }
  
      //if player LEFT the interactive area, remove shop name and interactible msg
      
      if (!this.overlap && this.storeName) {
        this.storeName = null;
        this.storeNameThisMap[this.storeId].storeName.setDepth(-1);
  
        this.storeNameThisMap[this.storeId].helperMsg.setDepth(-1);
        this.storeNameThisMap[this.storeId].gra.setDepth(-1);
      }
      
      //update player name's place
      //this.playerName.x = this.player.x;  
      //this.playerName.y = this.playerInfo.guest ? this.player.y + 34 : this.player.y + 28; 
      //this.playerNameBox.x = this.playerName.x - 3 - this.playerName.width / 2
      //this.playerNameBox.y = this.playerName.y - this.playerName.height / 2
      this.overlap = false; //update overlap check
      //this.gra.clear() //redraw the backdrop on name
      //this.gra.fillRectShape(this.playerNameBox);

      //emit the player's movement to other clients
      if (this.playerContainer.body.currentPosition){
        const x = this.playerContainer.body.x
        const y = this.playerContainer.body.y
        if(x !== this.playerContainer.body.currentPosition.x || y !== this.playerContainer.body.currentPosition.y) {
          this.playerContainer.moving = true;
          socket.emit('user movement', { x,y })
        } else if (this.playerContainer.moving) {
          this.playerContainer.moving = false;
          socket.emit('user movement', { x,y })
        }
      }
  
      //store the current player's position
      this.playerContainer.body.currentPosition = {
        x: this.playerContainer.body.x,
        y: this.playerContainer.body.y
      }
    }
  }
  
  createPlayer(playerInfo){
    this.player = this.physics.add.sprite(0, 0, "fm_02")
    this.createSpriteAnimation(this.player.texture.key)
    this.player.play(`idle-d-${this.player.texture.key}`)

    const playerName = this.add.text(0, 32, !(this.playerInfo.id) ? `GUEST\n${this.playerInfo.name}` : `${this.playerInfo.name}`, {font: "bold", align:'center'}).setOrigin(0.5)
    playerName.setDepth(9);

    const playerNameBox = new Phaser.Geom.Rectangle( -(playerName.width + 6) / 2 ,  32 -  playerName.height / 2, playerName.width + 6, playerName.height);
    const gra = this.add.graphics({ fillStyle: { color: 0x000000 } });
    gra.alpha= .5;
    gra.setDepth(8);
    // put player inside a container
    this.playerContainer = this.add.container(playerInfo.x, playerInfo.y);
    this.playerContainer.setSize(32,32);
    this.playerContainer.add(this.player)
    this.playerContainer.add(gra)
    this.playerContainer.add(playerName)
    this.playerContainer.moving = false;
    this.physics.world.enable(this.playerContainer);
    this.updateCamera();
    this.playerContainer.body.setCollideWorldBounds(true);
    gra.fillRectShape(playerNameBox);

    /*
    this.player.play('idle-d')
    this.playerName = this.add.text(this.player.x - 60, this.player.y + 32, this.playerInfo.guest ? `GUEST\n${this.playerInfo.name}` : `${this.playerInfo.name}`, { font: "bold", align: 'center' }).setOrigin(0.5)
    this.playerName.setDepth(9);
    this.playerNameBox = new Phaser.Geom.Rectangle(this.player.x - 3 - this.playerName.width / 2, this.playerName.y - this.playerName.height / 2, this.playerName.width + 6, this.playerName.height);
    
    this.gra = this.add.graphics({ fillStyle: { color: 0x000000 } });
    this.gra.alpha = .5;
    this.gra.setDepth(8);
    */
    this.physics.add.collider(this.playerContainer, this.groundLayer)
    this.physics.add.collider(this.playerContainer, this.cityObjLayer)
    
    //i would say that this is not need... but since we don't have a large user base right now... meh
    this.physics.add.collider(this.playerContainer, this.otherPlayers)
  }

  addOtherPlayers(playerInfo) {
    console.log(playerInfo)
    const player = this.physics.add.sprite(0, 0, "fm_02")
    player.play(`idle-d-${player.texture.key}`)
    player.setTint(Math.random() * 0xffffff)
    player.player_id = playerInfo.user_id
    player.player_name = playerInfo.username


    const playerName = this.add.text(0, 32, !(player.player_id) ? `GUEST\n${player.player_name}` : `${player.player_name}`, {font: "bold", align:'center'}).setOrigin(0.5)
    playerName.setDepth(6);

    const playerNameBox = new Phaser.Geom.Rectangle( -(playerName.width + 6) / 2 ,  32 -  playerName.height / 2, playerName.width + 6, playerName.height);
    const gra = this.add.graphics({ fillStyle: { color: 0x000000 } });
    gra.alpha= .5;
    gra.setDepth(5);

    const playerContainer = this.add.container(playerInfo.x, playerInfo.y);
    playerContainer.setSize(32,32);
    playerContainer.add(player)
    playerContainer.add(gra)
    playerContainer.add(playerName)
    gra.fillRectShape(playerNameBox);


    this.otherPlayers.add(playerContainer)

    player.play('walk-u')
    playerContainer.body.setImmovable(true);
    //Already handle by other users's PC 
    //this.physics.add.collider(this.otherPlayers, this.cityObjLayer)
    //this.physics.add.collider(this.otherPlayers, this.groundLayer)
    //playerContainer.body.setCollideWorldBounds(true)
  }

  updateCamera(){
    this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.playerContainer.body, true)
  }

  createSpriteAnimation(spriteName) {
    this.anims.create({
      key: `idle-u-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [10] }),
    });
    this.anims.create({
      key: `idle-d-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [1] }),
    });
    this.anims.create({
      key: `idle-l-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [4] }),
    });
    this.anims.create({
      key: `idle-r-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [7] }),
    });
    this.anims.create({
      key: `walk-u-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [9, 10, 11] }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: `walk-d-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [0, 1, 2] }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: `walk-l-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [3, 4, 5] }),
      frameRate: 7,
      repeat: -1
    });
    this.anims.create({
      key: `walk-r-${spriteName}`,
      frames: this.anims.generateFrameNumbers(`${spriteName}`, { frames: [6, 7, 8] }),
      frameRate: 7,
      repeat: -1
    });
  }

  addMiniMap(){
    this.miniCam = this.cameras.add(1030, 0, 250, 250);
    this.miniCam.setBounds(0, 0, 1920, 1920)
    this.miniCam.zoom = 0.35;
    this.miniCam.startFollow(this.playerContainer.body, true)
  }

  createMap(){
    this.enterStore = false;
    this.storeNameThisMap = {};
    let storeExist = {};
    this.storeExistThisMap = {};
    // get all store info to a more easy handle data type
    for (const store of this.storeInfo) {
      storeExist[store.id] = store
    }
    
    this.map = this.make.tilemap({ key: "map" });

    //add object layer first. 
    this.storesArea = this.map.getObjectLayer('StoreObj')['objects'];
    this.storeAreaGroup = this.physics.add.staticGroup({});
    this.storesArea.forEach(area => {
      let a = this.storeAreaGroup.create(area.x, area.y);
      a.setScale(area.width / 32, area.height / 32);
      a.setOrigin(0); //to replace auto offset
      a.body.width = area.width;
      a.body.height = area.height;
      a.name = area.properties[0].value //add store_id as name to do ajax call, 
      //please note, this store_id must be set as first custom_property in tile
      //overlap cb does not seems to return id for some reason, so use name

      if (storeExist[a.name]) {
        this.storeExistThisMap[a.name] = storeExist[a.name]; // only get store on this map
        this.storeNameThisMap[a.name] = { [a.name]: undefined };
        //add Store Name and helper Msg
        this.storeNameThisMap[a.name].storeName = this.add.text(a.x + 48, a.y - 32 * 3, `${this.storeExistThisMap[a.name].name}`, { font: "bold 28px Messiri", fill: "#fff" }).setOrigin(0.5);
        this.storeNameThisMap[a.name].storeName.setDepth(0);
        this.storeNameThisMap[a.name].helperMsg = this.helperMsg = this.add.text(a.x + 48, a.y + 16, `Press 'Space'\nto interact`, { font: "bold", align: 'center' }).setOrigin(0.5);
        this.storeNameThisMap[a.name].helperMsg.setDepth(0);
        //make graphic for this store
        this.storeNameThisMap[a.name].gra = this.add.graphics({ fillStyle: { color: 0x000000 } });
        this.storeNameThisMap[a.name].gra.alpha = .35;
        //Make Backdrop so text is easier to read
        this.storeNameThisMap[a.name].storeNameBox = new Phaser.Geom.Rectangle(this.storeNameThisMap[a.name].storeName.x - 5 - this.storeNameThisMap[a.name].storeName.width / 2, this.storeNameThisMap[a.name].storeName.y - this.storeNameThisMap[a.name].storeName.height / 2, this.storeNameThisMap[a.name].storeName.width + 10, this.storeNameThisMap[a.name].storeName.height);
        this.storeNameThisMap[a.name].helperMsgBox = new Phaser.Geom.Rectangle(this.storeNameThisMap[a.name].helperMsg.x - 5 - this.storeNameThisMap[a.name].helperMsg.width / 2, this.storeNameThisMap[a.name].helperMsg.y - this.storeNameThisMap[a.name].helperMsg.height / 2, this.storeNameThisMap[a.name].helperMsg.width + 10, this.storeNameThisMap[a.name].helperMsg.height);
        //fill in backdrop, and push it behide the screen
        this.storeNameThisMap[a.name].gra.fillRectShape(this.storeNameThisMap[a.name].storeNameBox)
        this.storeNameThisMap[a.name].gra.fillRectShape(this.storeNameThisMap[a.name].helperMsgBox).setDepth(-1)
      }
    });

    //physics body needs to refresh
    this.storeAreaGroup.refresh();
    
    //add other layer to overwrite obj layer
    this.tileset = this.map.addTilesetImage('vMarketTiles', 'tile')
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0)
    this.cityObjLayer = this.map.createLayer("CityObj", this.tileset, 0, 0)

    //grab collides tile from each map. Note: collides have NOT been set yet
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.cityObjLayer.setCollisionByProperty({ collides: true });

    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;
  }

  createOverlap(){
    this.physics.add.overlap(this.player, this.storeAreaGroup, (x, y) => {
      this.storeId = y.name;

      //if store exist, show it name by putting the name in the front layer
      if (this.storeExistThisMap[this.storeId] && !this.storeName) {
        this.storeName = `${this.storeExistThisMap[this.storeId].name}`
        this.storeNameThisMap[this.storeId].storeName.setDepth(4)
        this.storeNameThisMap[this.storeId].helperMsg.setDepth(4);
        this.storeNameThisMap[this.storeId].gra.setDepth(3)
      }

      this.overlap = true;
    }, undefined, this); //check overlap with store area, change overlap to true
  }

  storeOtherPlayersPositions() {
    this.otherPlayers.getChildren().forEach((player) => {
      this.sys.game.globals.globalVars.playersList[player.list[0].player_id].x = player.x
      this.sys.game.globals.globalVars.playersList[player.list[0].player_id].y = player.y
    })
  }
};

export { Game }