class Register extends Phaser.Scene {
  constructor() {
    super('register')
  }

  preload() {
    this.load.html('registerForm', 'templates/register.html')
    this.load.image('background', 'maps/farmersMarket.jpeg')
  }

  create() {

    this.add.image(140,0,'background').setOrigin(0).setDepth(0);
    const form = this.add.dom(640,480).createFromCache('registerForm')

  }

  update(){

    //if user focus field remove the err msg
    $('input').off().on('focus', () => {
      if($('.box').length) $('.box').remove();
    })

    //when user click login on register
    $("#login-button").off().on("click", () => {
      this.scene.start('Login')
    })
    //user sub the login info
    $("#register").off().on("submit", (e) => {
      e.preventDefault();
      if ($('.box').length) {
        $('.box').remove()
      }
      let err = `
      <div class="box err register">
        <div>Please input all field</div>
      </div>`;
      if (!$('#name').val() || !$('#full_name').val() || !$('#password').val() || !$('#confirm_password').val()) {
        $(`#RegisterInsert`).append(err);
        console.log('a')
      } else if ($('#password').val().length < 6 || $('#confirm_password').val().length < 6) {
        err = `
          <div class="box err register">
            <div>Invalid password length(Min. 6)</div>
          </div>`
        $(`#RegisterInsert`).append(err);
        console.log('b')
      } else if ($('#password').val() != $('#confirm_password').val()) {
        err = `
          <div class="box err register">
            <div>Password does not match</div>
          </div>`
        $(`#RegisterInsert`).append(err);
        console.log('c')
      } else {
        console.log('d')
        $.ajax("/users/new", {method: 'POST', data: $("#register").serialize()})
          .then((res) => {
            if(res.err) {
              err = `
              <div class="box err register">
                <div>Invalid password & user combination</div>
              </div>`
              //add animation for box appear if have time
              $(`#RegisterInsert`).append(err)
            } else {
              this.scene.start('Game' , {name: res.name})
            }
          });
        }
    })
  }
}

export { Register }