class Global {
  constructor() {
    this.storeData;
    this.connectionEstablished = false;
    this.playersList = {};
    this.friendsList;
    this.getStoreData();
    this.musicIsMute = false;
    this.login()
  }

  getStoreData = async () => {
    this.storeData = await $.ajax(`/stores`, { method: 'GET' })
    return Array.from(this.storeData)
  }

  login = async (scene = 'login') => {
    const appendIfOnLogin = function (err) {
      if (scene === 'login') {
        $(`#loginInsert`).append(err);
        return true;
      } else {
        return false
      }
    }

    if ($('.box').length) {
      $('.box').remove()
    }
    let err = `
    <div class="box err">
      <div>Please fill in both field</div>
    </div>`;
    if (!$('#name').val()) { //User doesn't enter name
      appendIfOnLogin(err);
      return;
    } else {
      return ($.ajax("/users/login", { method: 'POST', data: $("#login").serialize() })
        .then((res) => {
          if (!res.user_id && !res.err && !res.owner) {
            let confirm = `
              <div class="box confirm">
                <div>You sure you want to login as Guest?</div>
                <button type="button" class="btn btn-primary btn-lg" id="confirm-button">Just let me in!</button>
              </div>`
            appendIfOnLogin(confirm)
          } else if (res.err === "user exist") { //Guest use already existed username
            err = `
              <div class="box err">
                <div>User name already taken</div>
              </div>`
            appendIfOnLogin(err);
          } else if (res.err === "special character is not allow") { //Guest use special character in the name
            err = `
              <div class="box err">
                <div>Special character is not allow</div>
              </div>`
            appendIfOnLogin(err);
          } else if (res.err) { // User name/password not match
            err = `
              <div class="box err">
                <div>Invalid password & user combination</div>
              </div>`
            //add animation for box appear if have time
            if (!appendIfOnLogin(err)) {
              $('.err-msg').html('Invalid password & user combination')
            };
          } else if (res.owner) { // User name/password not match
            return res
          } else { //let user in game
            //store user information in the session
            sessionStorage.setItem("IGN", res.name.replace(/%20/g, " ").trim())
            sessionStorage.setItem("user_id", res.user_id)
            return true;
          }
        }))
    }
  }
}

export { Global }