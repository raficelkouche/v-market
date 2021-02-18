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

    const form = this.add.dom(640,480).createFromCache('loginForm')
    
    //if user focus field remove the err msg
    $('input').on('focus', () => {
      console.log('focus')
      console.log($('.box').length)
      if($('.box')) $('.box').remove();
    })
    
    //target the log in as guest button
    $(document).off().on("click", '#confirm-button', () => {
      let name = {guest: true, name: $("#login").serialize().slice(5,-1).slice(0,-9)}
      this.scene.start('Game' , name)
    })
    
    $("#login").on("submit", (e) => { //need to replace
      e.preventDefault();
      $.ajax("/users/login", {method: 'POST', data: $("#login").serialize()})
        .then((res) => {
          /* uncomment the following if guest is allow
          if(res.guest) { 
            let confirm = `
            <div class="box confirm">
              <div>You sure you want to login as Guest?</div>
              <button type="button" class="btn btn-primary btn-lg" id="confirm-button">Just let me in!</button>
            </div>`
            //add animation for box appear if have time
            $(`#loginInsert`).append(confirm)
          } else */if(res.err) {
            let err = `
            <div class="box err">
              <div>Error :  Invalid ${res.err}</div>
            </div>`
            //add animation for box appear if have time
            $(`#loginInsert`).append(err)
          } else {
            this.scene.start('Game' , res)
          }
        });
    })

  }

  update(){

  }
}

export { Login }