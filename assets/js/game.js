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
      //name: data.name.replace(/%20/g, " ").trim(), 
      //guest: data.guest || false,
      //id: data.user_id,
      name: sessionStorage.getItem("IGN"),
      id: sessionStorage.getItem("user_id"),
      x: data.x || undefined,
      y: data.y || undefined
    }
  }

  static player = Phaser.Physics.Arcade.Sprite;
  static playerName;
  static playerNameBox;
  static overlap = true;
  static inshop = false;
  static enterStore; //to prevent scence change fire more then once
  static storeInfo = [];
  static storeExistThisMap;
  static storeId;
  static storeLoadCount
  static storeNameThisMap;
  static storeName;
  static helperMsg;
  static user_id;
  static username;
  static gra;

  preload() {
    //load all texture
    this.load.tilemapTiledJSON("map", "maps/vMarket2.json")
    this.load.image('tile', 'maps/vMarketTilesCROPPED.png')
    this.load.spritesheet('fm_01', 'characters/fm_01.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('fm_02', 'characters/fm_02.png', { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet('m_01', 'characters/m_01.png', { frameWidth: 32, frameHeight: 32 })
    this.load.html('store_window', 'templates/store_window.html');
    this.load.audio('background', 'audio/TownTheme.mp3')
    this.key = this.input.keyboard.addKeys("W, A, S, D, LEFT, UP, RIGHT, DOWN, SPACE, SHIFT X, M") //WASD to move, M to toggle minimap
    this.storeLoadCount = 0;
  }

  create() {
    console.log(this.playerInfo.id)
    // works but not after a while
    this.sound.pauseOnBlur = false;
    this.music = this.sound.add('background', {
      loop: true,
    })
    // toggle music off or on
    this.music.play();
    this.music.setMute(this.sys.game.globals.globalVars.musicIsMute)

    $('#music').off().on('click', () => {
      this.music.setMute(!this.sys.game.globals.globalVars.musicIsMute);
      this.sys.game.globals.globalVars.musicIsMute = !this.sys.game.globals.globalVars.musicIsMute;
      if(!this.music.mute) {
        $('#music').html('<i class="fas fa-volume-mute"></i>')
      } else {
        $('#music').html('<i class="fas fa-volume-up"></i>')
      }
    })
    this.storeInfo = this.sys.game.globals.globalVars.storeData
    
    const socket = io('http://localhost:8000', {
      autoConnect: false,
      query: {
        user_id: this.playerInfo.id,
        username: this.playerInfo.name
      }
    })
    if (this.playerInfo.id) {
      socket.connect();
    
    socket.on('success', () => {
      let activeUser;
      $("#chat-side-bar form").on('submit', (event) => {
        event.preventDefault();
        let message = $('#chat-message').val()
        if ($('#chat-message').val() && activeUser) {
          $('#messages').append(`<li>${this.username}: ${message}</li`)
          socket.emit('send message', {
            recipient: activeUser,
            message
          })
          $('#chat-message').val('')
        } else {
          alert("select a user first and then type your message")
        }
      })
      
      socket.on('updated-friends-list', usersList => {
        console.log("users List: ", usersList)
        Object.keys(usersList).forEach((user_id) => {
          if (!document.getElementById(user_id) && user_id !== this.user_id) {
            $("#friends-list ul").append(`<li id="${user_id}">${usersList[user_id].username}</li>`)
            $("#friends-list li").on("click", function (event) {
              $('#friends-list ul').children().removeAttr('style')
              $("#friends-list ul").children().css("color", "black")
              // $(this).css("color", "red")
              $(this).css("font-weight", "bold")
              // $(this).addClass('selected-user')
              // $(this).css("text-shadow", '#0C0 1px 0 px')
              $(this).css("text-shadow", '0px 5px 5px #53B051')
              activeUser = event.target.id
            })
            $('#chat-message').val('')
          } else {
            alert("select a user first and then type your message")
          }
        })
      })

      
        socket.on('receive message', data => {
          $('#messages').append(`<li>${data.sender}: ${data.message}</li`)
        })

        socket.on('delete user', user_id => {
          console.log("delete: ", user_id)
          $(`#${user_id}`).remove()
        })
      
        /* socket.on('all players', playersList => {
          Object.keys(playersList).forEach((player) => {
            if(player !== this.user_id) {
              this.addOtherPlayers(playersList[player])
              } else {
              this.createPlayer(playersList[player])
            }
          })
        })
      */
      })

      socket.on('connect_error', (x) => {
        console.log("server refused connection")
      })

      socket.on('disconnect', () => {
        console.log("server shutdown")
        socket.disconnect();
      })
    }

    
   //disable key cap on all element so it would not steal the focus
    this.input.on('pointerdownoutside', () => {
      this.input.keyboard.disableGlobalCapture();
      for (const k of Object.keys(this.key)) {
        this.key[k].enabled = false;
      } 
    })
    
    $('canvas').off().on('click', ()=>{ 
      $(document.activeElement).blur();
      this.input.keyboard.enableGlobalCapture();
      for (const k of Object.keys(this.key)) {
        this.key[k].enabled = true;
      } 
    })
    

    //draw back drop for player name, will refresh
    this.gra = this.add.graphics({ fillStyle: { color: 0x000000 } });
    this.gra.alpha= .5;

    this.enterStore = false;
    this.storeNameThisMap = {};
    let storeExist = {};
    this.storeExistThisMap = {};
    // get all store info to a more easy handle data type
    for (const store of this.storeInfo) { 
      storeExist[store.id] = store
    }

    //make the map of this scence
    this.map = this.make.tilemap({ key: "map" });

    function hashCode(str) { // java String#hashCode
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
         hash = str.charCodeAt(i) + ((hash << 5) - hash); //get Char ASCII code + hash left shift 5 bit - origin
      }
      return hash;
    } 
  
    function intToRGB(i){
      let c = (i & 0x00FFFFFF) //bitwise and operator to get when when both binary = 1
          .toString(16)
          .toUpperCase();

      return "00000".substring(0, 6 - c.length) + c; //if not enough padding, add 0 to that place
    }

    //add object layer first. 
    let storesArea = this.map.getObjectLayer('StoreObj')['objects'];
    let storeAreaGroup = this.physics.add.staticGroup({});
    storesArea.forEach(area => {
      let a = storeAreaGroup.create(area.x, area.y);
      a.setScale(area.width / 32, area.height / 32);
      a.setOrigin(0); //to replace auto offset
      a.body.width = area.width;
      a.body.height = area.height;
      a.name = area.properties[0].value //add store_id as name to identify which store, 
      //please note, this store_id must be set as first custom_property in tile
      //overlap cb does not seems to return id for some reason, so use name

      if (storeExist[a.name]) {
        this.storeExistThisMap[a.name] = storeExist[a.name]; // only get store on this map
        this.storeNameThisMap[a.name] = {[a.name]: undefined};
        //add Store Name and helper Msg
        this.storeNameThisMap[a.name].storeName = this.add.text(a.x + 48, a.y - 32*3 , `${this.storeExistThisMap[a.name].name}`, { font: "bold 28px Messiri", fill: "#fff"}).setOrigin(0.5);
        this.storeNameThisMap[a.name].storeName.setDepth(0);
        this.storeNameThisMap[a.name].helperMsg = this.helperMsg = this.add.text(a.x + 48, a.y + 16, `Press 'Space'\nto interact`, {font: "bold", align: 'center'} ).setOrigin(0.5);
        this.storeNameThisMap[a.name].helperMsg.setDepth(0);
        //make graphic for this store
        let color = '0x' + intToRGB(hashCode(`${this.storeExistThisMap[a.name].name}`));
        this.storeNameThisMap[a.name].gra = this.add.graphics({ fillStyle: { color: `${color}` } });
        this.storeNameThisMap[a.name].gra.alpha= .35; 
        //Make Backdrop so text is easier to read
        this.storeNameThisMap[a.name].storeNameBox = new Phaser.Geom.Rectangle(this.storeNameThisMap[a.name].storeName.x - 5 - this.storeNameThisMap[a.name].storeName.width / 2, this.storeNameThisMap[a.name].storeName.y - this.storeNameThisMap[a.name].storeName.height / 2, this.storeNameThisMap[a.name].storeName.width + 10 , this.storeNameThisMap[a.name].storeName.height);
        this.storeNameThisMap[a.name].helperMsgBox = new Phaser.Geom.Rectangle(this.storeNameThisMap[a.name].helperMsg.x - 5 - this.storeNameThisMap[a.name].helperMsg.width / 2, this.storeNameThisMap[a.name].helperMsg.y - this.storeNameThisMap[a.name].helperMsg.height / 2, this.storeNameThisMap[a.name].helperMsg.width + 10, this.storeNameThisMap[a.name].helperMsg.height);
        //fill in backdrop, and push it behide the screen
        this.storeNameThisMap[a.name].gra.fillRectShape(this.storeNameThisMap[a.name].storeNameBox)
        this.storeNameThisMap[a.name].gra.fillRectShape(this.storeNameThisMap[a.name].helperMsgBox).setDepth(-1)
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

    //rand to be del, just for showcasing
    let rand = Math.floor(Math.random() * 3);
    switch (rand) {
      case 0:
        rand = 'fm_01'
        break;
      case 1:
        rand = 'fm_02'
        break;
      case 2:
        rand = 'm_01'
        break;
    }

    //add player sprite, animation and name
    this.player = this.physics.add.sprite( this.playerInfo.x ||400, this.playerInfo.y || 300, rand)
    //make sprite anime for added sprite
    this.createSpriteAnimation(this.player.texture.key)

    this.player.play(`idle-d-${this.player.texture.key}`)
    this.playerName = this.add.text(this.player.x -60, this.player.y+32, !(this.playerInfo.id) ? `GUEST\n${this.playerInfo.name}` : `${this.playerInfo.name}`, {font: "bold", align:'center'}).setOrigin(0.5)
    this.playerName.setDepth(9);
    this.playerNameBox = new Phaser.Geom.Rectangle(this.player.x - 3 - this.playerName.width / 2, this.playerName.y - this.playerName.height / 2, this.playerName.width + 6, this.playerName.height);
    this.gra.setDepth(8);

    //add 3 camera, 1st to follow player, mini(2nd) for mini map, and 3rd for background when pause 
    //set camera to size of map, zoom in for better view, then make this follow player
   /*  this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true) */
    this.updateCamera()

    //make 'mini map' and place to top RIGHT, set bound of map, zoom out so it is mini, and set to follow player
    this.miniCam = this.cameras.add(1030, 0, 250, 250);
    this.miniCam.setBounds(0, 0, 1920, 1920)
    this.miniCam.zoom = 0.35;
    this.miniCam.startFollow(this.player, true)
    
    //add overlapArea detect
    this.physics.add.overlap(this.player, storeAreaGroup, (x, y) => { 
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

    //add collider with player
    // this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.groundLayer)
    this.physics.add.collider(this.player, this.cityObjLayer)

    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;
    this.player.body.setCollideWorldBounds(true); 
    
    // toggle mini map
    this.input.keyboard.on('keydown', function (event) {
      if(event.key === 'm') {
        this.miniCam.setVisible(!this.miniCam.visible)
      }
    }, this);
    // on navbar
    $('#mini-map').off().on('click', () => {
      this.miniCam.setVisible(!this.miniCam.visible)
    })

    // show nav bar after login
    $('#top-nav-bar').css('visibility', 'visible')

    if (!this.playerInfo.id) {
      //set up shown name
      $('#IGN').removeClass() 
      $('#IGN').addClass("btn btn-outline-secondary")
      $('#IGN').attr("data-bs-toggle", '')
      document.getElementById('IGN').innerHTML = 'Guest';
      document.getElementById('user-session').innerHTML = 'Disable';
      $('#chat-side-bar').empty()
      let login = `
        <div id="friends-list" class="disable">
          <h3 id='Please-login'>Please login to enjoy the full functionality</h3>
        </div>
        <div id="messages" class='disable'>
          <form id='login' class='in-game'>
            <label for="name">User Name</label>
            <input type="text" id="name" name="name" placeholder="Your user name" required></input>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Your password" required></input>
            <p class="err-msg"></p>
            <div>
              <button type="submit" class="btn btn-primary btn-lg" id="login-button">Login</button>
              <button type="button" class="btn btn-success btn-lg" id="register-button">Register</button>
            </div>
          </form>
        </div>
        `
      $('#chat-side-bar').append(login)
      $('input').on('focus', (x) => $('.err-msg').html(''))
      $("#login").off().on("submit", (e) => {
        e.preventDefault();
        let scene = this.scene
        let music = this.music
        this.playerInfo.x = this.player.x
        this.playerInfo.y = this.player.y
        let cam = this.cameras.main
        let playerInfo = this.playerInfo
        this.sys.game.globals.globalVars.login('Game')
        .then((x) => {
          if (x) {
            music.destroy(); 
            cam.fadeOut(150, 0, 0, 0)
            cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
                scene.start('Game', playerInfo);
              })
            }
          }
        )
      })
      $("#register-button").off().on("click", () => {
        sessionStorage.clear();
        $('#top-nav-bar').css('visibility', 'hidden')
        $('#chat-side-bar').css('visibility', 'hidden')
        this.music.destroy();
        this.cameras.main.fadeOut(150, 0, 0, 0)
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
            this.scene.start('register');
          })
      })
    } else {
      $('#IGN').removeClass() 
      $('#IGN').addClass("btn btn-outline-secondary dropdown-toggle")
      $('#IGN').attr("data-bs-toggle", 'dropdown')
      if(!$('#chat-message').length)  {
        $('#chat-side-bar').empty()
        let chat = `
        <div id="friends-list">
            <h3>Friends</h3>
            <ul>
            </ul>
          </div>
          <div id="messages">
            <ul>
            </ul>
          </div>
          <form>
            <input type="text" name="chat-message" id="chat-message" autocomplete="off">
            <button>Send</button>
        </form>`;
        $('#chat-side-bar').append(chat)
      }
      document.getElementById('IGN').innerHTML = sessionStorage.getItem('IGN');
      document.getElementById('user-session').innerHTML = 'Logout';
      $('#user-session').off().on('click', () => {
        socket.disconnect(true)
        console.log('logout clicked')
        $.ajax('users/logout', { method: 'POST'})
          .then( (res) => {
            sessionStorage.clear();
            $('#top-nav-bar').css('visibility', 'hidden')
            $('#chat-side-bar').css('visibility', 'hidden')
            this.music.destroy();
            this.scene.start('Login')
          })
      })
    }

    // show chat bar after login
    $('#chat-side-bar').css('visibility', 'visible')

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

  update() {
    
    //take player into store if space is press when overlap
    if (this.overlap && this.key.SPACE.isDown && !this.enterStore && this.playerInfo.id) {
      this.enterStore = true; //prevent event fire twice
      this.playerInfo.store_id = this.storeId;
      this.playerInfo.x = this.player.x;
      this.playerInfo.y = this.player.y;
      this.playerInfo.storeInfo = this.storeInfo;
      this.storeName
        ? this.playerInfo.storeName = this.storeName
        : this.playerInfo.storeName = null;
      this.music.destroy();
      this.scene.start('store', this.playerInfo);
    }

    this.player.setVelocity(0);
    //update player movement
    if (this.key.LEFT.isDown || this.key.A.isDown) {
      this.player.setVelocityX(-150);if (this.player.anims.currentAnim.key === `walk-l-${this.player.texture.key}`) { }
      else if (this.key.UP.isDown || this.key.DOWN.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
        this.player.play(`walk-l-${this.player.texture.key}`)
        console.log(this.anims)
      }
    }
    else if (this.key.RIGHT.isDown || this.key.D.isDown) {
      this.player.setVelocityX(150);
      if (this.player.anims.currentAnim.key === `walk-r-${this.player.texture.key}`) { }
      else if (this.key.UP.isDown || this.key.DOWN.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
        this.player.play(`walk-r-${this.player.texture.key}`)
      }
    }
    if (this.key.UP.isDown || this.key.W.isDown) {
      this.player.setVelocityY(-150);
      if (this.player.anims.currentAnim.key === `walk-u-${this.player.texture.key}`) { }
      else {
        this.player.play(`walk-u-${this.player.texture.key}`)
      }
    }
    else if (this.key.DOWN.isDown || this.key.S.isDown) {
      this.player.setVelocityY(150);
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
    this.updatePlayerGra()
  }
  
  updatePlayerGra() {
    this.playerName.x = this.player.x;  
    this.playerName.y = !(this.playerInfo.id) ? this.player.y + 34 : this.player.y + 28; 
    this.playerNameBox.x = this.playerName.x - 3 - this.playerName.width / 2
    this.playerNameBox.y = this.playerName.y - this.playerName.height / 2
    this.overlap = false; //update overlap check
    this.gra.clear() //redraw the backdrop on name
    this.gra.fillRectShape(this.playerNameBox);
  }

  createPlayer(playerInfo) {
    this.player = this.physics.add.sprite(0, 0, "fm_02")
    this.container = this.add.container(playerInfo.x, playerInfo.y);
    this.container.setSize(32,32);
    this.physics.world.enable(this.container)
    this.updateCamera();
    this.container.body.setCollideWorldBounds(true);
  }

  updateCamera(){ //setup cam to follow player
    this.cameras.main.fadeIn(150, 0, 0, 0)
    this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true)
  }

}

export { Game }