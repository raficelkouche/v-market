class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }
  
  static player = Phaser.Physics.Arcade.Sprite;
  static playerName;
  static overlap = true;
  static inshop = false;
  static storeInfo = [];
  static storeExistThisMap;s
  static storeId;
  static storeLoadCount
  static storeName;
  static helperMsg;
  static user_id;
  static username;
  
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
    $.ajax(`/stores`, {method: 'GET'})
      .then((res) => {
        this.storeInfo = Array.from(res)
      })
  }

  create() {
    this.username = sessionStorage.getItem("IGN")
    this.user_id = sessionStorage.getItem("user_id");

    const socket = io('192.168.0.12:3000', {
      query: {
        user_id: this.user_id,
        username: this.username
      }
    })

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
        if (!document.getElementById(user_id)) {
          $("#friends-list ul").append(`<li id="${user_id}">${usersList[user_id].username}</li>`)
          $("#friends-list li").on("click", function (event) {
            $("#friends-list ul").children().css("color", "black")
            $(this).css("color", "red")
            activeUser = event.target.id
            console.log(activeUser)
          })
        }
      })
    });

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
    
    let storeExist = {};
    this.storeExistThisMap = {};

    // get all store info to a more easy handle data type
    for (const store of this.storeInfo) { 
      storeExist[store.id] = store
    }
    //remove as no longer needed, unless we make an other map
    delete this.storeInfo 

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
    this.player = this.physics.add.sprite(400, 300, "fm_02")
    this.player.play('idle-d')
    this.playerName = this.add.text(this.player.x, this.player.y + 32, `${this.username}`)
    //add 3 camera, 1st to follow player, mini(2nd) for mini map, and 3rd for background when pause 
    //set camera to size of map, zoom in for better view, then make this follow player
   /*  this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(3);
    this.cameras.main.startFollow(this.player, true) */
    this.updateCamera()

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
        this.storeName = this.add.text(y.x, y.y - 32*3 , `${this.storeExistThisMap[this.storeId].name}`, { font: " 32px Arial Black", fill: "#fff"});
        this.helperMsg = this.add.text(y.x -32, y.y, `Space to interact`);
        this.storeExistThisMap[this.storeId].display = true;
      } else if (this.storeExistThisMap[this.storeId] && !this.storeName) {
        this.storeName = this.add.text(y.x, y.y - 32*3 , `${this.storeExistThisMap[this.storeId].name}`, { font: " 32px Arial Black", fill: "#fff" });
        this.helperMsg = this.add.text(y.x -32, y.y, `Space to interact`);
        this.add.text(y.x -32, y.y, `Space to interact`);
      } 
      this.overlap = true;
      /*
      $.ajax(`/stores/${this.storeId}/${this.storeLoadCount}`, {method: 'GET'})//load init 4 items
      .then( res => {
        // console.log(res)
        if (res.length){
          this.add.text(y.x, y.y - 32*3 , `${res[0].s_name}`);
        } 
      });
      */
    }, undefined, this); //check overlap with store area, change overlap to true

    //add collider with player
    // this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.groundLayer)
    this.physics.add.collider(this.player, this.cityObjLayer)

    this.physics.world.bounds.width = this.map.widthInPixels;
    this.physics.world.bounds.height = this.map.heightInPixels;
    this.player.body.setCollideWorldBounds(true); 
  }

  update() {

    //function to 'pause' the game when open shop
    const shopPause = function (pCam, mCam, Cam){
      pCam.setVisible(true)
      mCam.setVisible(false)
      Cam.setVisible(false)
    }

    //function to 'resume' the game when close shop
    const shopResume = function (pCam, mCam, Cam){
      mCam.setVisible(true)
      Cam.setVisible(true)
      pCam.setVisible(false)
    }

    //logic when player want more listing in a store
    const addMoreItem = function(result) {
      let outOfItem = `<p>There is no more listing from this vendor at the moment...</p>
      <p>Thanks for your support!</p>`;
      let pendingHTML = `<tr>`;
      for (let i = 0; i < 4; i++) {
        if(result[i]) { // assign product_id to td as value for later calling 
          pendingHTML += `
          <td class="single-product" value=${result[i].id}>
            <img class="thumbnail" src="${result[i].thumbnail};"/>
            <div class="description">
              <div class="product-name">
                ${result[i].description}
              </div>
              <div class="price">
                $${result[i].price}
              </div>
            </div>
          </td>`
        } else  {
          pendingHTML += `<td></td>`;
          if ($("#request-data")) $("#request-data").parent().html(outOfItem);
        }
      }
      return pendingHTML
    }

    //if player is shopping, restrict movement
    if (this.inshop) { //when in shop stop
      if (this.key.ESC.isDown) { //if ESC is press close shop
        $("canvas").prev().children().remove()
        shopResume(this.pauseCam, this.miniCam, this.cameras.main)
        this.inshop = false;
        this.storeLoadCount = 0;
      }
      this.player.setVelocity(0); //no player movement allow
      return; //end update
    }
    // if (this.overlap === true) {
    //   const storeName = this.add.text(this.storeX, this.storeY - 32*3 , 'Hello World');
    //   // console.log(this.storeName)
    // } 
    // if (this.overlap === false && storeName) {
    //   storeName.destroy()
    // }
    if (this.overlap === true && this.cursors.space.isDown) {//if player is on interact area and press space
      $.ajax(`/stores/${this.storeId}/${this.storeLoadCount}`, {method: 'GET'})//load init 4 items
      .then(function (result) {
        if (result[0]) { //need to add helper to check if store exist but no product and rewrite
          $("table").append(addMoreItem(result))
          $('#store_banner').css('background-image', `url(${result[0].banner_img})`)
          $('h1').text(`${result[0].s_name}`)
        } else {
          $('#customer-support').remove();
          $("#request-data").parent().html('');
          $('h1').text(`Sorry! This store is currently closed. Come back again later.`)
          $('h1').css(`color`, 'black')
        }
      });
      this.storeLoadCount++;
      let newAnim = this.player.anims.currentAnim.key.split('-') // change anime to idle
      this.player.play("idle-" + newAnim[1])
      if ($("#store-data").length === 0) { // allow user to open 1 window only
        shopPause(this.pauseCam, this.miniCam, this.cameras.main)
        this.inshop = true
        this.add.dom(960,960).createFromCache('store_window'); //place dom in center
      }
      if ($("#customer-support")) {
        $("#backdrop").css('visibility', 'visible');
      }
      $("#close-button").on("click", () => {
        $("canvas").prev().children().remove() //remove the added dom
        shopResume(this.pauseCam, this.miniCam, this.cameras.main)
        this.inshop = false;
        this.storeLoadCount = 0;
      })
      $("#request-data").on("click", () => { //wait for helper
        $.ajax(`/stores/${this.storeId}/${this.storeLoadCount}`, {method: 'GET'})//use ajax to handle request to the server
          .then(function (result) {
            $("table").append(addMoreItem(result))
          })
        this.storeLoadCount++;
      })
      $("#customer-support").on("click", () => { //need to replace
        $("canvas").prev().children().remove() 
        shopResume(this.pauseCam, this.miniCam, this.cameras.main)
        this.inshop = false;
        this.storeLoadCount = 0;
      })
      $(document).off().on("click", '.single-product', (x) => { // use document, so newly add item have listener
        //console.log(this.storeId)
        //console.log($(x.currentTarget).attr('value'))
        $("#products-grid").remove(); //remove info from products page and start to load detail
        $.ajax(`/stores/${this.storeId}/products/${$(x.currentTarget).attr('value')}`, {method: 'GET'})
        .then(function (result) {
          let pendingHTML = `
          <div id="product-container">
            <div id='products-img'>
              <img class="thumbnail" src=${result.thumbnail};/>
            </div>
            <div id='product-des'>
              ${result.name}
              ${result.description}
            </div>
            <div id='product-price'>
              ${result.price}
              Only ${result.quantity} left
            </div>
          </div>
          `;
          $("#products").html(pendingHTML)
          //console.log(result)
        })
      })
    }

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
    this.playerName.x = this.player.x;  
    this.playerName.y = this.player.y+20;
    this.overlap = false; //update overlap check
  }
  
  createPlayer(playerInfo) {
    this.player = this.physics.add.sprite(0, 0, "fm_02")
    this.container = this.add.container(playerInfo.x, playerInfo.y);
    this.container.setSize(32,32);
    this.physics.world.enable(this.container)
    this.updateCamera();
    this.container.body.setCollideWorldBounds(true);
  }

  updateCamera(){
    this.cameras.main.setBounds(0, 0, 1920, 1920);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.player, true)
  }

}



export { Game }