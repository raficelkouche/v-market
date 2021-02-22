
window.globalVariables = {
  testVariable: 123
}
let targetUser = null;
let peerID = null;
let myPeer = null;
let call = null;

const coordinates = {
  x: Math.floor(Math.random() * 500) + 40,
  y: Math.floor(Math.random() * 600) + 50
}

const socket = io('/', {
  autoConnect: false,
  query: {
    x: coordinates.x,
    y: coordinates.y
  }
}) 

socket.on('updated-friends-list', usersList => {
  Object.keys(usersList).forEach((user_id) => {
    if (!document.getElementById(user_id)) {
      $("#friends-list ul").append(`<li id="${user_id}">${usersList[user_id].username}</li>`)
      $("#friends-list li").on("click", (event) => {
        $("#friends-list ul").children().css("color", "black")
        $(event.target).css("color", "red")
        targetUser = event.target.id
        console.log(targetUser)
      })
    }
  })
});

socket.on('recieve message', data => {
  $('#messages').append(`<li>${data.sender}: ${data.message}</li`)
})

socket.on('disconnect', (user_id) => {
  console.log("server shutdown")
  socket.disconnect();
})

socket.on('connect_error', error => {
  console.log("server error: ", error)
})

$("#chat-side-bar form").on('submit', (event) => {
  event.preventDefault();
  let message = $('#chat-message').val()
  if ($('#chat-message').val() && targetUser) {
    $('#messages').append(`<li>${sessionStorage.getItem("IGN")}: ${message}</li`)
    socket.emit('send message', {
      recipient: targetUser,
      message
    })
    $('#chat-message').val('')
  } else {
    alert("select a user first and then type your message")
  }
})

function sendRecieveStreams(remoteUserID, stream) {
  //call the other user and send the local stream
  call = myPeer.call(remoteUserID, stream)

  //setup handlers to recieve the remote stream
  const remoteVideo = document.getElementById("in-game-remote-video")
  call.on('stream', remoteUserVideoStream => {
    addVideoStream(remoteVideo, remoteUserVideoStream)
  })  
}

function addVideoStream(video, stream){
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}

function error(error) {
  console.warn("Error occured: ", error)
};


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
    this.createAnimations()
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
        if (player.player_id === data.user_id) {
          player.setPosition(data.x, data.y)
        }
      })
    })

    socket.on('delete user', user_id => {
      $(`#${user_id}`).remove()
      this.otherPlayers.getChildren().forEach((player) => {
        if (user_id === player.player_id) {
          player.destroy()
        }
      })
    })

    socket.connect(); //delayed socket connection until all handlers have been registered

    socket.emit("update-user-details", {
      username: this.playerInfo.name,
      user_id: this.playerInfo.id
    })

    myPeer = new Peer(undefined, { //peer connection for video chatting, has to be after socket.connect()
      host: '/',
      port: '3001'
    })

    myPeer.on('open', id => {
      peerID = id;
    })

    const inGameLocalVideo = document.getElementById("in-game-local-video")
    const remoteVideo = document.getElementById("in-game-remote-video")

    socket.on('call-request-recieved', data => {
      console.log("call request recieved: ", data)
      $('main').append(`
            <div class="call-notification"> 
              <div> User ${data.username} is calling ...</div>
              <button id="accept-button">accept</button>
              <button id="decline-button">decline</button>
            </div>
          `)
      $('main').on('click', '#accept-button', () => {
        $('.call-notification').remove();
        
        navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then(stream => {
          addVideoStream(inGameLocalVideo, stream)
          
          myPeer.on('call', call => {
            call.answer(stream) //answer the call and send local stream

            call.on('stream', remoteUserVideoStream => {
              addVideoStream(remoteVideo, remoteUserVideoStream)
            })
          })
          socket.emit('user-accepted-call', peerID)
        })
      })

    })

    $('main').on('click', '#decline-button', () => {
      socket.emit('user-declined-call')
      $('.call-notification').remove()
    })
    
    $('#end-call').on('click', () => {
      socket.emit('call-ended')
    })

    socket.on('call-ended', () => {
      console.log("ending call")
      myPeer.destroy()
      inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
      remoteVideo.srcObject.getTracks().forEach(track => track.stop())
      inGameLocalVideo.remove()
      remoteVideo.remove()
    })

    socket.on('call-declined', () => {
      inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
      inGameLocalVideo.remove()
    })
    
    $("#start-call").on("click", (event) => {
      if (!call) {      //avoid calling the user while a call is ongoing
        if (targetUser) {
          socket.emit('call-request', {
            peerID,
            targetUser
          })
          
          navigator.mediaDevices.getUserMedia({ video: true, audio: true})
          .then(stream => {
            addVideoStream(inGameLocalVideo, stream)
            
            socket.on("call-accepted", peerID => {
              sendRecieveStreams(peerID, stream)
            })
          })
          
        }
        else {
          alert("click on user first")
        }
      }
      else {
        alert("already in another call!")
      }
    });


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
    //draw back drop for player name, will refresh
    

    

    //make the map of this scence
    

    //make sprite anime
    

    //add player sprite, animation and name
   /*  this.player = this.physics.add.sprite( this.playerInfo.x ||400, this.playerInfo.y || 300, "fm_02")
    console.log(`adding sprite at x:${this.playerInfo.x} and y: ${this.playerInfo.y}`)
    this.player.play('idle-d')
    this.playerName = this.add.text(this.player.x -60, this.player.y+32, this.playerInfo.guest ? `GUEST\n${this.playerInfo.name}` : `${this.playerInfo.name}`, {font: "bold", align:'center'}).setOrigin(0.5)
    this.playerName.setDepth(9);
    this.playerNameBox = new Phaser.Geom.Rectangle(this.player.x - 3 - this.playerName.width / 2, this.playerName.y - this.playerName.height / 2, this.playerName.width + 6, this.playerName.height);
    this.gra.setDepth(8); */

    //add 3 camera, 1st to follow player, mini(2nd) for mini map, and 3rd for background when pause 
    //set camera to size of map, zoom in for better view, then make this follow player
   /*  this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true) */
    //this.updateCamera()

    //make 'mini map' and place to top RIGHT, set bound of map, zoom out so it is mini, and set to follow player
    
    
    //add overlapArea detect
    

   
    // toggle mini map
    this.input.keyboard.on('keydown', function (event) {
      if(event.key === 'm') {
        this.miniCam.setVisible(!this.miniCam.visible)
      }
    }, this);
  }

  update() {
    if (true) {
      //take player into store if space is press when overlap
      if (this.overlap && this.key.SPACE.isDown && !this.enterStore) {
        this.enterStore = true; //prevent event fire twice
        this.playerInfo.store_id = this.storeId;
        coordinates.x = this.player.x;
        coordinates.y = this.player.y;
        this.playerInfo.storeInfo = this.storeInfo;
        this.storeName
          ? this.playerInfo.storeName = this.storeName
          : this.playerInfo.storeName = null;
        this.sys.game.globals.globalVars.connectionEstablished = true;
        this.storeOtherPlayersPositions()
        this.scene.start('store', this.playerInfo);

      }
  
      this.player.setVelocity(0);
      //update player movement
      if (this.key.LEFT.isDown || this.key.A.isDown) {
        this.player.setVelocityX(-150);
        if (this.player.anims.currentAnim.key === 'walk-l') { }
        else if (this.key.UP.isDown || this.key.DOWN.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
          this.player.play('walk-l')
        }
      }
      else if (this.key.RIGHT.isDown || this.key.D.isDown) {
        this.player.setVelocityX(150);
        if (this.player.anims.currentAnim.key === 'walk-r') { }
        else if (this.key.UP.isDown || this.key.DOWN.isDown || this.key.W.isDown || this.key.S.isDown) { } else {
          this.player.play('walk-r')
        }
      }
      if (this.key.UP.isDown || this.key.W.isDown) {
        this.player.setVelocityY(-150);
        if (this.player.anims.currentAnim.key === 'walk-u') { }
        else {
          this.player.play('walk-u')
        }
      }
      else if (this.key.DOWN.isDown || this.key.S.isDown) {
        this.player.setVelocityY(150);
        if (this.player.anims.currentAnim.key === 'walk-d') { }
        else {
          this.player.play('walk-d')
        }
      }
  
      //if player does not move, play idle anime
      if (!this.key.DOWN.isDown && !this.key.UP.isDown && !this.key.RIGHT.isDown && !this.key.LEFT.isDown && !this.key.W.isDown && !this.key.A.isDown && !this.key.S.isDown && !this.key.D.isDown) {
        if (!this.player.anims.currentAnim.key.includes('idle')) {
          let newAnim = this.player.anims.currentAnim.key.split('-')
          this.player.play("idle-" + newAnim[1])
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
      this.playerName.x = this.player.x;  
      this.playerName.y = this.playerInfo.guest ? this.player.y + 34 : this.player.y + 28; 
      this.playerNameBox.x = this.playerName.x - 3 - this.playerName.width / 2
      this.playerNameBox.y = this.playerName.y - this.playerName.height / 2
      this.overlap = false; //update overlap check
      this.gra.clear() //redraw the backdrop on name
      this.gra.fillRectShape(this.playerNameBox);

      //emit the player's movement to other clients
      if (this.player.currentPosition){
        const x = this.player.x
        const y = this.player.y
        if(x !== this.player.currentPosition.x || y !== this.player.currentPosition.y) {
          socket.emit('user movement', { x,y })
        }
      }
  
      //store the current player's position
      this.player.currentPosition = {
        x: this.player.x,
        y: this.player.y
      }
    }
  }
  
  createPlayer(playerInfo){
    console.log("Adding player at: ", playerInfo.x, playerInfo.y)
    this.player = this.physics.add.sprite(playerInfo.x, playerInfo.y, "fm_02")
    this.player.play('idle-d')
    this.playerName = this.add.text(this.player.x - 60, this.player.y + 32, this.playerInfo.guest ? `GUEST\n${this.playerInfo.name}` : `${this.playerInfo.name}`, { font: "bold", align: 'center' }).setOrigin(0.5)
    this.playerName.setDepth(9);
    this.playerNameBox = new Phaser.Geom.Rectangle(this.player.x - 3 - this.playerName.width / 2, this.playerName.y - this.playerName.height / 2, this.playerName.width + 6, this.playerName.height);
    
    this.gra = this.add.graphics({ fillStyle: { color: 0x000000 } });
    this.gra.alpha = .5;
    this.gra.setDepth(8);
    
    this.physics.add.collider(this.player, this.groundLayer)
    this.physics.add.collider(this.player, this.cityObjLayer)
    this.physics.add.collider(this.player, this.otherPlayers)
  }


  addOtherPlayers(playerInfo) {
    const player = this.physics.add.sprite(playerInfo.x, playerInfo.y, "fm_02")
    player.setTint(Math.random() * 0xffffff)
    player.player_id = playerInfo.user_id
    player.player_name = playerInfo.username
    this.otherPlayers.add(player)
    this.physics.add.collider(this.otherPlayers, this.cityObjLayer)
    this.physics.add.collider(this.otherPlayers, this.groundLayer)
    player.body.setImmovable(true);
    player.body.setCollideWorldBounds(true)
  }

  updateCamera(){
    this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true)
  }

  createAnimations(){
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
  }

  addMiniMap(){
    this.miniCam = this.cameras.add(1030, 0, 250, 250);
    this.miniCam.setBounds(0, 0, 1920, 1920)
    this.miniCam.zoom = 0.35;
    this.miniCam.startFollow(this.player, true)
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
    //console.log(storeAreaGroup.children.entries[0].name) < Example of storeArea's store_id path
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
    //console.log("player positions:", this.sys.game.globals.globalVars.playersList)
    this.otherPlayers.getChildren().forEach((player) => {
      this.sys.game.globals.globalVars.playersList[player.player_id].x = player.x
      this.sys.game.globals.globalVars.playersList[player.player_id].y = player.y
    })
  }
};

export { Game }