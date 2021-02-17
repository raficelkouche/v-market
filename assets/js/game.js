class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }
  static player = Phaser.Physics.Arcade.Sprite;
  static overlap = true;
  static inshop = false;
  static storeInfo = [];
  static storeExistThisMap;
  static storeId;
  static storeLoadCount;
  static storeName;
  static helper;
  static camX;
  static camY;
  static miniMapBorder;

  preload() {
    this.load.tilemapTiledJSON("map", "maps/vMarket2.json")
    this.load.image('tile', 'maps/vMarketTilesCROPPED.png')
    this.load.spritesheet('fm_02', 'characters/fm_02.png', { frameWidth: 32, frameHeight: 32 })
    this.load.html('store_window', 'templates/store_window.html');
    this.cursors = this.input.keyboard.createCursorKeys();
    this.key = this.input.keyboard.addKeys("W, A, S, D, ESC")
    $.ajax(`/stores`, {method: 'GET'})
      .then((res) => this.storeInfo = Array.from(res))// copy store info to storeInfo
  }

  create() {
    let storeExist = {};
    this.storeExistThisMap = {};
    for (const sotre of this.storeInfo) { // get all store info to a more easy handle data type
      storeExist[sotre.id] = sotre
    }
    delete this.storeInfo // remove for reason
    this.map = this.make.tilemap({ key: "map" });
    //add object layer first. 
    let storesArea = this.map.getObjectLayer('StoreObj')['objects'];
    let storeAreaGroup = this.physics.add.staticGroup({});
    storesArea.forEach(area => {
      let a = storeAreaGroup.create(area.x, area.y);
      a.setScale(area.width / 32, area.height / 32);
      a.setOrigin(0); //to replace auto offset
      a.body.width = area.width; //body of the physics body
      a.body.height = area.height;
      a.name = area.properties[0].value //add store_id as name to do ajax call, 
      //please note, this store_id must be set as first custom_property in tile
      //overlap cb does not return id for some reason, so use name
      if (storeExist[a.name]) {
        this.storeExistThisMap[a.name] = storeExist[a.name]; // only get store on this map
      }
    });

    this.storeLoadCount = 0; //init
    storeAreaGroup.refresh(); //physics body needs to refresh
    console.log(storeAreaGroup.children.entries[0].name);//example of storeArea's store_id path

    //add other layer to overwrite obj layer
    this.tileset = this.map.addTilesetImage('vMarketTiles', 'tile')
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0)
    this.cityObjLayer = this.map.createLayer("CityObj", this.tileset, 0, 0)


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
    //add player sprite
    this.player = this.physics.add.sprite(400, 300, "fm_02")
    this.player.play('idle-d') // play idle-d as default 

    //add camera
    this.cameras.main.setBounds(0, 0, 1920, 1920); //set camera to size of map
    this.cameras.main.setZoom(3); //zoom in
    this.cameras.main.startFollow(this.player, true)
    this.miniCam = this.cameras.add(1030, 0, 250, 250);
    this.miniCam.setBounds(0, 0, 1920, 1920)
    this.miniCam.zoom = 0.35;
    this.miniCam.startFollow(this.player, true)
    
    
    //add overlapArea detect
    this.physics.add.overlap(this.player, storeAreaGroup, (x, y) => { 
      this.storeId = y.name;
      // if have access to db then can assign it here, or hardcode it?
      // let storeNameCall = null;
      if (this.storeExistThisMap[this.storeId] && !this.storeExistThisMap[this.storeId].display) {
        this.storeName = this.add.text(y.x, y.y - 32*3 , `${this.storeExistThisMap[this.storeId].name}`, { font: " 32px Arial Black", fill: "#fff"});
        this.helper = this.add.text(y.x -32, y.y, `Space to interact`);
        this.storeExistThisMap[this.storeId].display = true;
      } else if (this.storeExistThisMap[this.storeId] && !this.storeName) {
        this.storeName = this.add.text(y.x, y.y - 32*3 , `${this.storeExistThisMap[this.storeId].name}`, { font: " 32px Arial Black", fill: "#fff" });
        this.helper = this.add.text(y.x -32, y.y, `Space to interact`);
        this.add.text(y.x -32, y.y, `Space to interact`);
      } 
      if(this.storeName){
        this.storeName._text
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
    if (!this.overlap && this.storeName) {
      for (const x of Object.keys(this.storeExistThisMap)) {
        if (this.storeExistThisMap[x].name === this.storeName._text) this.storeExistThisMap[x].display = false;
      }
      this.storeName.destroy();
      this.helper.destroy();
    }
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

    if (this.inshop) { //when in shop stop
      if (this.key.ESC.isDown) {
        $("canvas").prev().children().remove()
        this.inshop = false;
        this.miniCam.setVisible(true);
        this.storeLoadCount = 0;
      }
      this.cameras.main.setZoom(1); //while in shop, stay zoom out
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
      console.log(this.cursors.space.isDown)
      $.ajax(`/stores/${this.storeId}/${this.storeLoadCount}`, {method: 'GET'})//load init 4 items
      .then(function (result) {
        // console.log(result)
        if (result[0]) { //need to add helper to check if store exist but no product and rewrite
          $("table").append(addMoreItem(result))
          $('#store_banner').css('background-image', `url(${result[0].banner_img})`)
          $('h1').text(`${result[0].s_name}`)
        } else {
          $('#customer-support').remove();
          $("#request-data").parent().html('');
          $('#products').append('<img id="closedImg" src="https://images-na.ssl-images-amazon.com/images/I/61s6wHsXOqL._AC_SL1000_.jpg"/>')
          $('h1').text(`Sorry! This store is currently closed. Come back again later.`)
          $('h1').css(`color`, 'black')
        }
      });
      this.storeLoadCount++;
      let newAnim = this.player.anims.currentAnim.key.split('-') // change anime to idle
      this.player.play("idle-" + newAnim[1])
      if ($("#store-data").length === 0) { // allow user to open 1 window only
        this.miniCam.setVisible(false);
        this.inshop = true //set inshop true, to 'pause' game
        this.cameras.main.setZoom(1); //zoom out cause phaser dom is weird
        if (this.player.x < 640){
          this.camX = 640
        } else if (this.player.x > 1280){
          this.camX = 1280
        } else {
          this.camX = this.player.x
        }
        if (this.player.y < 480){
          this.camY = 480
        } else if (this.player.y > 1440){
          this.camY = 1440
        } else {
          this.camY = this.player.y
        }
        this.add.dom(this.camX, this.camY).createFromCache('store_window'); //place dom in center
      }
      if ($("#customer-support")) {
        $("#backdrop").css('visibility', 'visible');
      }
      $("#close-button").on("click", () => {
        $("canvas").prev().children().remove() //remove the added dom
        this.inshop = false; //'unpause' game
        this.miniCam.setVisible(true);
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
        this.inshop = false; 
        this.miniCam.setVisible(true);
        this.storeLoadCount = 0;
      })
      $(document).off().on("click", '.single-product', (x) => { // use document, so newly add item have listener
        console.log(this.storeId)
        console.log($(x.currentTarget).attr('value'))
        $("#products-grid").remove(); //remove info from products page and start to load detail
        $.ajax(`/stores/${this.storeId}/products/${$(x.currentTarget).attr('value')}`, {method: 'GET'})
        .then(function (result) {
          console.log(result)
          let pendingHTML = `
          <div id="product-container">
            <div id='products-img'>
              <img class="thumbnail" src=${result.thumbnail};/>
            </div>
            <div id='product-des'>
              <h2>${result.name}</h2>
              <p>Description</p>
              <p>${result.description}</p>
              <div id='product-price'>
                <p>Price: $${result.price}</p>
                <p>Only ${result.quantity} left</p>
              </div>
              <div id='product-buttons'>
                <button class='btn btn-outline-success'> Add to Cart </button>
                <button id='back-button' class='btn btn-outline-warning'> Go back </button>
              </div>
            </div>
          </div>
          `;
          $("#products").html(pendingHTML)
          // when clicking back to view the store again
          $("#back-button").on("click", () => {
          //   $("#product-container").css("background-color", "red").remove() //remove the added dom

          // $("#products").add('div').text("HELLOOO") //remove the added dom

          //   // $("#products").append($("products-grid")); //remove info from products page and start to load detail
          //   // $("table").append(addMoreItem(result))

          //   $.ajax(`/stores/${this.storeId}/${this.storeLoadCount}`, {method: 'GET'})//load init 4 items
          //   .then(function (result) {
          //     console.log('inside the back ajax call?')
          //     console.log(result)
          //     if (result[0]) { //need to add helper to check if store exist but no product and rewrite
          //       $("table").append(addMoreItem(result))
          //       $('#store_banner').css('background-image', `url(${result[0].banner_img})`)
          //       $('h1').text(`${result[0].s_name}`)
          //   }})
            console.log('go back!!')
          })
          console.log(result)
        }
        )
      })
    }
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
    if (!this.cursors.down.isDown && !this.cursors.up.isDown && !this.cursors.right.isDown && !this.cursors.left.isDown && !this.key.W.isDown && !this.key.A.isDown && !this.key.S.isDown && !this.key.D.isDown) {//if no arrow input, change to idle anime
      if (!this.player.anims.currentAnim.key.includes('idle')) {
        let newAnim = this.player.anims.currentAnim.key.split('-')
        this.player.play("idle-" + newAnim[1])
      }
    }
    this.cameras.main.setZoom(3);
    this.overlap = false; //update overlap check
  }
}

export { Game }