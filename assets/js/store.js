class Store extends Phaser.Scene {
  constructor() {
    super('store');
  }

  store() {
    //call on login/register scence to get data
    Phaser.Scene.call(this, { key: 'game' });
  }

  init(data) {
    //pass var from login scence
    this.playerInfo = {
      name: data.name.replace(/%20/g, " ").trim(),
      guest: data.guest || false,
      id: data.id,
      x: data.x,
      y: data.y,
      storeInfo: data.storeInfo
    }
    this.storeName = data.storeName;
    this.storeId = data.store_id;
    this.storeEmail = data.storeEmail;
    this.storePhone = data.storePhone;
  }

  static initload;
  static seller;

  preload() {
    //load all texture
    this.load.tilemapTiledJSON("map", "maps/vMarket2.json");
    this.load.image('tile', 'maps/vMarketTilesCROPPED.png');
    //load store html
    this.load.html('store_window', 'templates/store_window.html');
    this.key = this.input.keyboard.addKeys("ESC")

    this.seller = true;
  }

  create() {  

    this.initload = true;
    let endOfStore = false;
    let storeProducts = [];
    let cart = [];
    let storeLoadCount = 0;
    let storeID = this.storeId;

    const exit = function (cam, info, scene) {
      cam.main.fadeOut(150, 0, 0, 0)
      $('#backdrop').addClass('fadeout')
      cam.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam,   effect) => {
        scene.start('Game', info);
      })
    }

    //addMoreItem, to run a html for Jquery to add
    const addMoreItem = function (result, reload = false) {
      let outOfItem = `<p>There is no more listing from this vendor at the moment...</p>
      <p>Thanks for your support!</p>`;
      let pendingHTML = `<tr>`;
      if (result.length === 0) { //if no more item change button to msg
        endOfStore = true;
        $("#request-data").parent().html(outOfItem);
        return
      }
      if (!reload) { //if not call from product detail back
        storeProducts = storeProducts.concat(result);
        for (let i = 0; i < 4; i++) {
          if (result[i]) { // assign product_id to td as value for later calling 
            pendingHTML += `
            <td class="single-product" value=${result[i].id}>
              <img class="thumbnail" src="${result[i].thumbnail}"/>
              <div class="description">
                <div class="product-name">
                  ${result[i].name}
                </div>
                <div class="price">
                  $${result[i].price}
                </div>
                <div class="product-card-buttons">
                  <button id="add-to-cart${result[i].id}" class='btn btn-outline-success' onclick="event.stopPropagation(); console.log('add cart to ${result[i].name}')"> <i class="fas fa-cart-plus"></i></button>
                  <button id="add-to-fave" class='btn btn-outline-info' onclick="event.stopPropagation(); console.log('add fave to ${result[i].name}')"> <i class="fas fa-star"></i> </button>
                </div>
              </div>
            </td>`
          } else {
            pendingHTML += `<td></td>`;
            if ($("#request-data")) {
              endOfStore = true;
              $("#request-data").parent().html(outOfItem);
            }
          }
        }
      } else { //if reloading from product detail
        $('table').append(`
        <colgroup>
          <col class="product">
          <col class="product">
          <col class="product">
          <col class="product">
          <col class="product">
        </colgroup>`);
        for (let x = 0; x < result.length / 4; x++) { //push item out 4 per line
          for (let i = 0; i < 4; i++) {
            if (result[i + x * 4]) {
              pendingHTML += `
              <td class="single-product" value=${result[i + x * 4].id}>
                <img class="thumbnail" src="${result[i + x * 4].thumbnail}"/>
                <div class="description">
                  <div class="product-name">
                    ${result[i + x * 4].name}
                  </div>
                  <div class="price">
                    $${result[i + x * 4].price}
                  </div>
                  <div class="product-card-buttons">
                    <button id="add-to-cart${result[i + x * 4].id}" class='btn btn-outline-success' onclick="event.stopPropagation(); console.log('add cart to ${result[i + x * 4].name}')"> <i class="fas fa-cart-plus"></i></button>
                    <button id="add-to-fave" class='btn btn-outline-info' onclick="event.stopPropagation(); console.log('add fave to ${result[i + x * 4].name}')"> <i class="fas fa-star"></i> </button>
                  </div>
                </div>
              </td>`
            } else {
              pendingHTML += `<td></td>`;
              if ($("#request-data")) $("#request-data").parent().html(outOfItem);
            }
          }
          pendingHTML += `</tr>`;
          $("table").append(pendingHTML);
          pendingHTML = `<tr>`;
        }
        if (endOfStore) {
          $("#request-data").parent().html(outOfItem);
        }
      }
      return pendingHTML;
    }

    const requestItemData = function () {
      $.ajax(`/stores/${storeID}/${storeLoadCount}`, { method: 'GET' })//use ajax to handle request to the server
        .then(function (result) {
          $("table").append(addMoreItem(result))
          // to be able to add to cart
          for (let product of result) {
            $(`#add-to-cart${product.id}`).off().on('click', function () {
              addToCart(product)
            })
          }
        })
      storeLoadCount++;
    }

    const back = function (fromCart = false) {
      // remove the product-container and rebuild the products grid
      if (fromCart) {
        $('#checkout').css("visibility", "visible");
        // remove the product-container and rebuild the products grid
        $("#checkout-table").remove()
      }
      $("#products").html("<div id='products-grid'></div>")
      $("#products-grid").html("<table></table><div><button id='request-data' class='btn btn-primary'>Load More Products</button></div>")
      addMoreItem(storeProducts, true) // need to make helper to get the amount 
      for (let product of storeProducts) {
        $(`#add-to-cart${product.id}`).on('click', function () {
          addToCart(product)
        })
      }
    }

    const addToCart = function (product) {
      cart.push(product);
      $('#checkout-cart-count').html(cart.length)
    }

    const removeFromCart = function (index) {
      let newCart = []
      for (let i = 0; i < cart.length; i++) {
        if (i !== index) {
          newCart.push(cart[i])
        }
      }
      cart = newCart;
      $('#checkout-cart-count').html(cart.length)
    }

    const cartTotal = function (cart) {
      let total = 0;
      cart.forEach(item => total += parseFloat(item.price))
      return total;
    }

    const checkOutList = function (cart) {
      let pendingHTML = ``;
      for (let product of cart) {
        pendingHTML += `
        <tr id="line-item-row">
          <td class="line-item-thumbnail" style="width: 10%; text-align: center;"><img src="${product.thumbnail}" style="width: 50px; height:50px;"/></td>
          <td style="width: 20%">${product.name}</td>
          <td style="width: 40%">${product.description}</td>
          <td style="width: 20%">${product.price}</td>
          <td id="remove-cart" style="width: 10%"><button id="remove-cart${cart.indexOf(product)}" onclick="console.log('${cart.indexOf(product)}')"><i class="far fa-trash-alt fa-2x "></i></button> </td>
        </tr>
        `
      }
      return pendingHTML
    }

    const orderList = function (orderItems) {
      let pendingHTML = ``;
      for (let product of orderItems) {
        pendingHTML += `
        <tr id="line-item-row">
          <td class="line-item-thumbnail" style="width: 20%; text-align: center;"><img src="${product.thumbnail}" style="width: 50px; height:50px;"/></td>
          <td style="width: 20%">${product.name}</td>
          <td style="width: 40%">${product.description}</td>
          <td style="width: 20%">${product.price}</td>
        </tr>
        `
      }
      return pendingHTML
    }

    //set up background image
    this.map = this.make.tilemap({ key: "map" });
    this.tileset = this.map.addTilesetImage('vMarketTiles', 'tile');
    this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
    this.cityObjLayer = this.map.createLayer("CityObj", this.tileset, 0, 0);

    //set cam
    this.cameras.main.setBounds(320, 480, 1920, 1920);
    this.cameras.main.fadeIn(150, 0, 0, 0)  
    
    this.add.dom(960, 960).createFromCache('store_window'); //place dom in center/
    if ($("#customer-support")) {
      $("#backdrop").css('visibility', 'visible');
    }

    //if this is init loading
    if (this.initload) {
      this.initload = false;
      $.ajax(`/stores/${storeID}/${storeLoadCount}`, { method: 'GET' })//load init 4 items
        .then(function (result) {
          if (result[0]) { //need to add helper to check if store exist but no product and rewrite
            // store view 
            $('table').append(addMoreItem(result))
            $('#store_banner').css('background-image', `url(${result[0].banner_img})`)
            $('h1').text(`${result[0].s_name}`);
            $('h1').css('font-size', '80px')
            $('h1').css('color', 'white')
            // to add to cart from the store view -> different data structure from product view
            for (let product of result) {
              $(`#add-to-cart${product.id}`).on('click', function () {
                addToCart(product)
              })
            }
          } else {
            $('#checkout').css("visibility", "hidden");
            $('#customer').remove();
            $("#request-data").parent().html('');
            $('#products').append('<img id="closedImg" src="https://images-na.ssl-images-amazon.com/images/I/61s6wHsXOqL._AC_SL1000_.jpg"/>')
            $('h1').text(`Sorry! This store is currently closed. Come back again later.`)
            $('h1').css(`color`, 'black')
          }
        });
      storeLoadCount++;
    }

    //if click load more item
    $("#request-data").off().on("click", () => { //wait for helper
      requestItemData(storeID);
    })

    //take user back to game.js if click top left to close
    $("#close-button").on("click", () => {
      exit(this.cameras, this.playerInfo, this.scene);
      //this.scene.start('Game', this.playerInfo);
    })

    //customer support button action
    $("#customer-support").on("click", () => { //need to replace
      if(!this.seller){
        $('#checkout').css("visibility", "hidden");
        $('#products').html(`
        <div id='support-message'>
        <h3> Customer Support</h3>
        <p> Hello ${this.playerInfo.name}, </p>
        <p> Thank you for reaching out to us. </p>
        <p> Currently, we do not have a representative online right now. Please refer to the contact information below if you require any assistance. </p>
        <p> <b>Email</b>: <a href="mailto:${this.storeEmail}">${this.storeEmail}</a></p>
        <p> <b>Phone</b>: <a href="tel:${this.storePhone}">${this.storePhone}</a></p>
        <ul id="hours-op">
        Hours of Operation 
        <li> Monday: 9:00 am - 5:00 pm </li>
        <li> Tuesday: 9:00 am - 5:00 pm </li>
        <li> Wednesday: 9:00 am - 5:00 pm </li>
        <li> Thursday: 9:00 am - 5:00 pm </li>
        <li> Friday: 9:00 am - 5:00 pm </li>
        <li> Saturday: Closed </li>
        <li> Sunday: Closed </li>
        </ul>
        <button id='back-button' class='btn btn-outline-warning'><i class="fas fa-chevron-circle-left"></i> Back </button>
        </div>
        `)
        $("#back-button").off().on("click", () => {
          back();
          $('#checkout').css("visibility", "visible");
          $("#request-data").off().on("click", () => { //wait for helper
            requestItemData(storeID);
          })
        })
      }
  
    })

    $(document).off().on("click", '.single-product', (x) => { // use document, so newly add item have listener
      $("#products-grid").remove(); //remove info from products page and start to load detail
      $.ajax(`/stores/${storeID}/products/${$(x.currentTarget).attr('value')}`, { method: 'GET' })
        .then(function (result) {
          let pendingHTML = `
        <div id="product-container">
          <div id='products-img'>
            <img class="thumbnail" src="${result.thumbnail}"/>
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
              <button id='back-button' class='btn btn-outline-warning'><i class="fas fa-chevron-circle-left"></i> Back </button>
              <button id='add-to-cart' class='btn btn-outline-success' onclick="console.log('add cart${result.name}');"> <i class="fas fa-cart-plus"></i> Add to Cart</button>
              <button id='add-to-fave' class='btn btn-outline-info' onclick="console.log('add fave ${result.name}');"> <i class="fas fa-star"></i> Favorite</button>
            </div>
          </div>
        </div>
        `;
          $("#products").html(pendingHTML)
          // when clicking back to view the store again
          $("#back-button").off().on("click", () => {
            back();
            $("#request-data").off().on("click", () => { //wait for helper
              requestItemData(storeID);
            })
            // to load more products
            // console.log('go back!!')
          })
          // to add to cart from product view -> diff format from store view
          $('#add-to-cart').off().on('click', function () {
            // console.log('add to cart button clicked')
            addToCart(result)
          })
          // console.log(result)
        })
    })


    // view cart
    $("#checkout").off().on("click", () => { //need to replace
      // cart info available - show page
      // console.log(cart)
      const total = cartTotal(cart)
      // checkout page set up
      $('#checkout').css("visibility", "hidden");
      $('#products-grid').remove();
      $('#product-container').remove();
      // if cart has items
      if (cart.length > 0) {
        $('#products').append(`
          <div id="checkout-table">
            <h1>Review Order</h1>
            <table class="table table-bordered">
              <thead class="table-dark">
                <tr id="line-item-row">
                  <td style="width: 50px; height:50px;"></td>
                  <td>Name</td>
                  <td>Description</td>
                  <td>Price</td>
                  <td>Remove</td>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
            <div id="proceed">
              <button id='back-button' class='btn btn-outline-warning'><i class="fas fa-chevron-circle-left"></i> Back </button>
              <form id="checkout-button">
                <script
                  src="https://checkout.stripe.com/checkout.js"
                  class="stripe-button"
                  data-key="pk_test_TYooMQauvdEDq54NiTphI7jx"
                  data-name="V-Market"
                  data-description="Purchase for ${this.storeName}"
                  data-amount="{${total}}"
                  data-currency="cad">
                </script>
              </form>
            </div>
          </div>
        
          `)
        $('tbody').append(checkOutList(cart))
        $('tbody').append(`<tr id="line-item-row"><td colspan="3" id="order-total">Order Total</td><td style="width: 20%">$${total}</td></tr>`)
        $('form').submit(function (event) {
          event.preventDefault();
        })
        // add remove function
        for (let product of cart) {
          $(`#remove-cart${cart.indexOf(product)}`).on("click", () => {
            removeFromCart(cart.indexOf(product))
            // rerender the page with update
            $('#back-button').click()
            $("#checkout").click() //need to replace
          })
        }
        // checkout button function
        $('#checkout-button').on('click', () => {
          const data = {
            user_id: this.playerInfo.id,
            store_id: this.storeId,
            total_price: total,
            cart: cart
          }
          //  -----------------------------------
          // COMPLETE ORDER AND RENDER CONFIMRATION PAGE
          $.ajax(`/users/${this.playerInfo.id}/orders`, { method: 'POST', data: { data: data } })
            .then((order) => {
              if (order) { // sucessful and returns the order
                //  FINALLY !!!! order received back as obj
                const orderItems = cart;
                // empty cart
                cart = [];
                $('#checkout-cart-count').html(cart.length)
                // rerender with order details
                $('#checkout-table').remove()
                $('#products').append(`
                <div id="checkout-table">
                  <h1>Order Confirmation</h1>
                  <p style="font-size: medium"> Hello ${this.playerInfo.name}. Thank you for your purchase!<p>
                  <p style="font-size: medium"> Your Order Number is <b> ${order.order.id}.</b>
                  <br>
                    <table class="table table-bordered">
                      <thead class="table-dark">
                        <tr id="line-item-row">
                          <td style="width: 50px; height:50px;"></td>
                          <td>Name</td>
                          <td>Description</td>
                          <td>Price</td>
                        </tr>
                      </thead>
                      <tbody></tbody>
                    </table>
                  <div id="proceed">
                    <button id='back-button' class='btn btn-outline-warning'><i class="fas fa-chevron-circle-left"></i> Back </button>
                    <button id='exit-button' class='btn btn-outline-danger'> Exit </button>
                  </div>
                </div>
              `)
                $('tbody').append(orderList(orderItems))
                $('tbody').append(`<tr id="line-item-row"><td colspan="3" id="order-total">Order Total</td><td style="width: 20%">$${total}</td></tr>`)
                // hide order confirmation until after credit card
                $('#products').css('visibility', 'hidden')
                // once the credit form opens, keep checking unttil it closes
                const checkoutRefresh = setInterval(() => {
                  const stripe = $('iframe')
                  // console.log(stripe.length)
                  if(stripe.length === 1) {
                    $('#products').css('visibility', 'visible')
                    clearInterval(checkoutRefresh)
                  }  
                }, 500)
                
                // add exit function for order confirmation page
                $("#exit-button").on("click", () => {
                  exit(this.cameras, this.playerInfo, this.scene);
                  //this.scene.start('Game', this.playerInfo);
                })

                // // add back function for order confimration page
                $("#back-button").off().on("click", () => {
                  back(true);
                  // to load more products
                  $("#request-data").on("click", () => { //wait for helper
                    requestItemData(storeID);
                  })
                })
                // if order was not processed
              } else {
                res.json('Oops! something went wrong?')
              }
            })
        }) // end of the checkout function 

      } else {
        $('#products').append(`
          <div id="checkout-table">
            <h1>Review Order</h1>
            <p>Hello! You have no items in the cart. Go back to the store page to view the our products. </p>
            <button id='back-button' class='btn btn-outline-warning'><i class="fas fa-chevron-circle-left"></i> Back </button>
          </div>
        `)
      }

      // return button to take back to store front
      $("#back-button").off().on("click", () => {
        back(true);
        // to load more products
        $("#request-data").on("click", () => { //wait for helper
          requestItemData(storeID);
        })
      })
    })
    $('#mini-map').on('click', () => {
      this.miniCam.setVisible(!this.miniCam.visible)
    })

    //close shop with ESC
    this.input.keyboard.on('keydown', function (event) {
      if (event.key === 'Escape') {
        exit(this.cameras, this.playerInfo, this.scene);
        //this.scene.start('Game', this.playerInfo);
      }
    }, this);
  }

  update() {

  }
}

export { Store }
