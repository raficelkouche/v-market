class Login extends Phaser.Scene {
  constructor() {
    super('Login')
  }

  init() {

    
  }
  preload() {
    
    this.load.html('loginForm', 'templates/login.html')
    this.load.image('background', 'maps/farmersMarket.jpeg')
    
  }

  create() {
    
    //check if a user is already logged in
    $.ajax({
      method: 'GET',
      url: '/users/login'
    }).then(res => {
      if (res.user_ID) {
        this.scene.start('Game')
      }else{
        this.add.image(140, 0, 'background').setOrigin(0).setDepth(0);
        const form = this.add.dom(640, 480).createFromCache('loginForm')
      }
    }).catch(err => console.log(err))

}

  update(){

    //if user focus field remove the err msg
    $('input').off().on('focus', () => {
      if($('.box').length) $('.box').remove();
    })

    //target the log in as guest button
    $(document).off().on("click", '#confirm-button', () => {
      let name = {guest: true, name: $("#login").serialize().slice(5,-1).slice(0,-9)}
      this.scene.start('Game' , name)
    })

    //when user click register on login
    $("#register-button").off().on("click", () => {
      this.scene.start('register')
    })

    //user sub the login info
    $("#login").off().on("submit", (e) => {
      e.preventDefault();
      if ($('.box').length) {
        $('.box').remove()
      }
      let err = `
      <div class="box err">
        <div>Please input both field</div>
      </div>`;
      if (!$('#name').val()) { //User doesn't enter name
        $(`#loginInsert`).append(err);
      } else {
        $.ajax("/users/login", {method: 'POST', data: $("#login").serialize()})
          .then((res) => {
            if(res.guest) { 
              let confirm = `
              <div class="box confirm">
                <div>You sure you want to login as Guest?</div>
                <button type="button" class="btn btn-primary btn-lg" id="confirm-button">Just let me in!</button>
              </div>`
              $(`#loginInsert`).append(confirm)
            } else if(res.err === "user exist") { //Guest use already existed username
              err = `
              <div class="box err">
                <div>User name already taken</div>
              </div>`
              $(`#loginInsert`).append(err);
            } else if(res.err === "special character is not allow") { //Guest use special character in the name
              err = `
              <div class="box err">
                <div>Special character is not allow</div>
              </div>`
              $(`#loginInsert`).append(err);
            }else if(res.err) { // User name/password not match
              err = `
              <div class="box err">
                <div>Invalid password & user combination</div>
              </div>`
              //add animation for box appear if have time
              $(`#loginInsert`).append(err);
            } else { //let user in game
              sessionStorage.setItem("IGN", res.name.replace(/%20/g, " ").trim())
              sessionStorage.setItem("user_id", res.user_id)
              sessionStorage.setItem("guest", res.guest || false)
              this.scene.start('Game');
            }
          });
        }
    })
  }

}

export { Login }

