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
    const form = this.add.dom(this.game.renderer.width / 2, this.game.renderer.height / 2).createFromCache('loginForm')

    form.addListener('click')
    form.on('click', (event) => {
      if (event.target.id === 'login-button'){
        this.scene.start('Game')
      }
      else if (event.target.id === 'error-button'){
        alert("Error has occured , try again!")
      }
    })
    
    //This is for testing only
    $("form").on('submit', (event) => {
      event.preventDefault()
      $.ajax({
        method: "POST",
        url: "/login",
        data: $('form').serialize()
      }).then((data) => {
        this.scene.start('Game',data)
      }).catch(result => alert(result.responseJSON.error))
    })
    
  }

  update(){

  }

}

export { Login }

