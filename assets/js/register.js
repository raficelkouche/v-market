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
      } else if ($('#password').val().length < 6 || $('#confirm_password').val().length < 6) { //if 1 field is empty err
        err = `
          <div class="box err register">
            <div>Invalid password length(Min. 6)</div>
          </div>`
        $(`#RegisterInsert`).append(err);
      } else if ($('#password').val() != $('#confirm_password').val()) {//if password does not match
        err = `
          <div class="box err register">
            <div>Password does not match</div>
          </div>`
        $(`#RegisterInsert`).append(err);
      } else {
        $.ajax("/users/new", {method: 'POST', data: $("#register").serialize()})
          .then((res) => {
            if(res.err === 'special character') { //special characyer in user name
              err = `
              <div class="box err register">
                <div>No special character in user name</div>
              </div>`
              $(`#RegisterInsert`).append(err)
            } else if (res.err === 'email'){ // if email is invalid
              err = `
              <div class="box err register">
                <div>Please use valid email</div>
              </div>`
              $(`#RegisterInsert`).append(err)
            } else if (res.err === 'full name'){ // if name have number / special c
              err = `
              <div class="box err register">
                <div>No special/number in full name</div>
              </div>`
              $(`#RegisterInsert`).append(err)
            } else if (res.err){ // if password does not match. NOTE: should not happen on normal cases
              err = `
              <div class="box err register">
                <div>Password does not match</div>
              </div>`
              $(`#RegisterInsert`).append(err)
            } else { // let user in game
              sessionStorage.setItem("IGN", res.name.replace(/%20/g, " ").trim())
              sessionStorage.setItem("user_id", res.user_id)
              sessionStorage.setItem("guest", false) //will always be false cause user have register
              this.scene.start('Game' , res)
            }
          });
        }
    })
  }
}
/*
No special/number in full name X
Special C in name X
Password not match X
Empty field not allow X
check email valid X
*/
export { Register }