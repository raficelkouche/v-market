class Login extends Phaser.Scene {
  constructor() {
    super('Login')
  }
  
  preload() {
    
    this.load.html('loginForm', 'templates/login.html')
    this.load.image('background', 'maps/farmersMarket.jpeg')
 
  }

  create() {
    this.cameras.main.setBounds(0, 0, 1280, 960);
    //check if a user is already logged in
    $.ajax({
      method: 'GET',
      url: '/users/login'
    }).then(res => {
      if (res.user_ID) {
        let scene = this.scene;
        $('#loginInsert').addClass('fadeout')
        this.cameras.main.fadeOut(150, 0, 0, 0)
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam,   effect) => {
          scene.start('Game')
        })
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
      let name = $("#login").serialize().slice(5,-1).slice(0,-9)
      let scene = this.scene;
      sessionStorage.setItem("IGN", name)
      sessionStorage.setItem("user_id", "")
      $('#loginInsert').addClass('fadeout')
      this.cameras.main.fadeOut(150, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam,   effect) => {
        scene.start('Game')
      })
    })

    //when user click register on login
    $("#register-button").off().on("click", () => {
      this.scene.start('register')
    })

    //user sub the login info
    $("#login").off().on("submit", (e) => {
      e.preventDefault();
      console.log('login click')
      let scene = this.scene;
      let cam = this.cameras.main
      this.sys.game.globals.globalVars.login()
      .then(res => {
        console.log(res)
        if (res === true) {
          $('#LoginInsert').addClass('fadeout')
          cam.fadeOut(150, 0, 0, 0)
          cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, (cam, effect) => {
            scene.start('Game')
          })
        } else if (res && res.owner) {
          window.location.href = `/users/${res.id}`;
        }
      })
    })
  }

}

export { Login }

