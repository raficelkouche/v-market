class Login extends Phaser.Scene {
  constructor() {
    super('Login')
  }

  preload() {
    this.load.html('loginForm', 'templates/login.html')
    this.load.image('background', 'maps/farmersMarket.jpeg')
  }

  create() {
    this.add.image(140,0,'background').setOrigin(0).setDepth(0);

    const form = this.add.dom(640-150, 480-125).createFromCache('loginForm')

    $("#login").on("submit", (e) => { //need to replace
      e.preventDefault();
      $.ajax("/users/login", {method: 'POST', data: $("#login").serialize()})
        .then((res) => {

          this.scene.start('Game' , res)
        });
    })

  }

  update(){

  }
}

export { Login }