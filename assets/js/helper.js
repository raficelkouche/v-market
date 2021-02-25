let call = null;
let myPeer = null;
let peerID = null;
let chatRecieverID = null;
let offlineFriends = null;

const coordinates = {
  x: Math.floor(Math.random() * 500) + 32,
  y: 8 * 32 + Math.floor(Math.random() * 3.5 * 32)
}

const socket = io('/', {
  autoConnect: false,
  query: {
    x: coordinates.x,
    y: coordinates.y
  }
})

const inGameLocalVideo = document.createElement('video')
inGameLocalVideo.id = 'in-game-local-video'
inGameLocalVideo.muted = true;
inGameLocalVideo.autoplay = true;

const remoteVideo = document.createElement("video")
remoteVideo.id = "in-game-remote-video"
remoteVideo.autoplay = true;

//helper functions
function connectSocket() {
  socket.connect(); //delayed socket connection until all handlers have been registered

  myPeer = new Peer(undefined, { //peer connection for video chatting, has to be after socket.connect()
    host: '/',
    port: '3001'
  })

  myPeer.on('open', id => {
    peerID = id;
  })
}

function sendrecieveStreams(remoteUserID, stream) {
  //call the other user and send the local stream
  call = myPeer.call(remoteUserID, stream)

  //setup handlers to recieve the remote stream
  call.on('stream', remoteUserVideoStream => {
    call.off('stream')
    $('.in-game-video-call-container').append(remoteVideo)
    addVideoStream(remoteVideo, remoteUserVideoStream)
  })
}

function addVideoStream(video, stream) {
  video.srcObject = stream
}

function error(error) {
  console.warn("Error occured: ", error)
};

//Will get all the friends of a given user
async function getAllFriends(userID) {
  offlineFriends = await $.ajax(`/users/${userID}/friends`, { method: 'GET' })
  offlineFriends.forEach(friend => {
    $('#offline-friends ul').append(`<li>${friend}</li>`)
  })
}
//will take care of online/offline friends
function updateFriendsList(list){
  $("#friends-list ul").children().remove()
  $("#offline-friends ul").children().remove()

  offlineFriends.forEach((friend) => {
    if(list[friend] ){
      $("#friends-list ul").append(`
      <li class="friend-container" id="${list[friend].user_id}">
        ${list[friend].username}
        <button class="btn btn-secondary" id="start-call" style="height: auto;"><i class="fas fa-video"></i></button>
        <button class="btn btn-secondary" id="start-chat"><i class="far fa-comments"></i></button>
      </li>
      `)
    }else{
      $('#offline-friends ul').append(`<li>${friend}</li>`)
    }
  })
}

//Text chat feature
socket.on('recieve message', data => {
  //don't add a notification button if one exists already
  if (!$(`#${data.sender.user_id}`).children('#message-recieved').length) {
    $(`#${data.sender.user_id}`).append('<button class="btn btn-secondary" id="message-recieved"><i class="fas fa-exclamation"></i></button>')
  }
  //Add a new container only if it doesn't exist and hide it
  if (!document.getElementById(`messages-from-${data.sender.user_id}`)) {
    $('#offline-friends').after(`
    <div class="chat-container" id='messages-from-${data.sender.user_id}'>
      <div class="message-history">
        <ul></ul>
      </div>
      <form>
        <input type="text" name="chat-message" id="chat-message" autocomplete="off">
        <button>Send</button>
      </form>
    </div>
    `)

    $(`#messages-from-${data.sender.user_id}`).hide()
  }

  $(`#messages-from-${data.sender.user_id} .message-history ul`).append(`<li class="keep-left"><b>${data.sender.username}</b>: ${data.message}</li`)
  $('.message-history').scrollTop($('.message-history').height());
})

//event handler for clicking on a 'new message' notification
$('main').on('click', '#message-recieved', (event) => {
  chatRecieverID = $(event.target).closest('li').attr('id')
  
  $('#chat-side-bar').children('.chat-container').hide()

  $('#message-recieved').remove()

  $(`#messages-from-${chatRecieverID}`).slideToggle('medium', function () {
    $(`#messages-from-${chatRecieverID} form input`).focus()
  });

})

//event handler for clicking on 'chat' button
$('main').on('click', '#start-chat', (event) => {
  chatRecieverID = $(event.target).closest('li').attr('id')
  
  //add a container to hold messages and the texting-form if it doesn't exist
  if (!document.getElementById(`messages-from-${chatRecieverID}`)) {
    $('#offline-friends').after(`
    <div class="chat-container" id='messages-from-${chatRecieverID}'>
      <div class="message-history">
        <ul></ul>
      </div>
      <form>
        <input type="text" name="chat-message" id="chat-message" autocomplete="off">
        <button>Send</button>
      </form>
    </div>
    `)
    //hide all visible chats if any
    $('#chat-side-bar').children('.chat-container').hide()
  } else {}

  //$(`#messages-from-${chatRecieverID}`).toggle();
  $(`#messages-from-${chatRecieverID}`).slideToggle('medium', function() {  
    $(`#messages-from-${chatRecieverID} form input`).focus()
  });
})

//event handler for sending a new message
$('main').on('submit', "#chat-side-bar form", (event) => {
  event.preventDefault();

  let message = $(`#messages-from-${chatRecieverID} input`).val()

  if (message) {
    $(`#messages-from-${chatRecieverID} .message-history ul`).append(`<li class="keep-right"><b>Me</b>: ${message}</li>`)

    socket.emit('send message', {
      recipient: chatRecieverID,
      message
    })

    $(`#messages-from-${chatRecieverID} input`).val('')
    $('.message-history').scrollTop($('.message-history').height())

  } else {
    alert("select a user first and then type your message")
  }
});

//Video chat feature
$("main").on("click", "#start-call", (event) => {
  targetUser = $(event.target).closest('li').attr('id')
  if( !window.mute ) {
    $('#music').click()
  }
  //disable the call button if in a call
  $('.friend-container').children('#start-call').attr("disabled", true)

  //avoid calling the user while a call is ongoing
  if (!call) {
    socket.emit('call-request', {
      peerID,
      targetUser
    })
    //add a video container
    $('#game-chat-container').prepend(`<div class="in-game-video-call-container"></div>`)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        //add the local cam stream
        $('.in-game-video-call-container').append(inGameLocalVideo)
        $('.in-game-video-call-container').append(`<button class="btn btn-danger" id="end-call"> <i class="fas fa-phone-slash"> </i>End Call</button>`)
        addVideoStream(inGameLocalVideo, stream)

        //add the remote video stream
        socket.on("call-accepted", peerID => {
          sendrecieveStreams(peerID, stream)
          socket.off("call-accepted")
        })
      })
  } else {
    alert("already in another call!");
  }
});

socket.on('call-request-recieved', data => {
  //disable all the call button while the notification is on
  $('.friend-container').children('#start-call').attr("disabled", true)
  //mute music
  if( !window.mute ) {
    $('#music').click()
  }
  //add the notification to the screen
  $('main').append(`
        <div class="call-notification">
          <div><b>${data.username}</b> is calling ...</div>
          <button class="btn btn-success" id="accept-button">Accept</button>
          <button class="btn btn-danger" id="decline-button">Decline</button>
        </div>
      `)

  $('main').on('click', '#accept-button', () => {
    $('.call-notification').remove();
    $('#game-chat-container').prepend(`<div class="in-game-video-call-container"></div>`)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        //add the local video stream
        $('.in-game-video-call-container').append(inGameLocalVideo)
        addVideoStream(inGameLocalVideo, stream)
        $('.in-game-video-call-container').append(`<button class="btn btn-danger" id="end-call"> <i class="fas fa-phone-slash"></i> End Call</button>`)

        //event listener for recieving a call
        myPeer.on('call', recievedCall => {
          call = recievedCall
          call.answer(stream) //answer the call and send local stream

          //add the remote stream to the screen
          call.on('stream', remoteUserVideoStream => {
            $('.in-game-video-call-container').append(remoteVideo)
            addVideoStream(remoteVideo, remoteUserVideoStream)
            call.off('stream')
          })
          myPeer.off('call')
        })
        socket.emit('user-accepted-call', peerID)
      })

  })
});

$('main').on('click', '#decline-button', () => {
  $('.friend-container').children('#start-call').attr("disabled", false)
  if( mute ) {} 
  else { $('#music').click() }
  socket.emit('user-declined-call')
  $('.call-notification').remove()
  $('main').off('click', '#accept-button')
  //$('main').off('click', '#decline-button')
})

$('main').on('click', '#end-call', () => {
  socket.emit('call-ended')
  $('.friend-container').children('#start-call').attr("disabled", false)
  $('.in-game-video-call-container').remove()

})

//socket handlers
socket.on('disconnect', (user_id) => {
  socket.disconnect();
});

socket.on('connect_error', error => {
});

socket.on('updated-friends-list', usersList => {
  Object.keys(usersList).forEach((user_id) => {
    let username = usersList[user_id].username

    if (!document.getElementById(user_id)) {
      $("#friends-list ul").append(`
      <li class="friend-container" id="${user_id}">
        ${username}
        <button class="btn btn-secondary" id="start-call" style="height: auto;"><i class="fas fa-video"></i></button>
        <button class="btn btn-secondary" id="start-chat"><i class="far fa-comments"></i></button>
      </li>
      `)
    }

    if (offlineFriends.includes(username)) {
      $('#offline-friends ul').children(`li:contains("${username}")`).remove()
    }
  })
});

socket.on('call-ended', () => {
  //if the call was not picked up yet and user clickes on end call
  if( mute ) {
  } else {
    $('#music').click()
  }
  if (call) {
    call.close()
    call = null;
  }
  //enable all the call buttons
  $('.friend-container').children('#start-call').attr("disabled", false)
  //remove the call notification box if the caller end's the call
  $('.call-notification').remove();
  //stop the video and audio streaming
  if (inGameLocalVideo.srcObject) {
    inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
  }
  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach(track => track.stop())
  }
  //remove the local and remote video containers
  //$('.in-game-video-call-container').children().remove()
  $('.in-game-video-call-container').remove()
  $('main').off('click', '#accept-button')
  $('main').off('click', '#decline-button')
});

socket.on('call-declined', () => {
  if( mute ) {}
  else {
    $('#music').click()
  }
  //stop the local video stream and remove it's container
  if (inGameLocalVideo.srcObject) {
    inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
  }
  //$('.in-game-video-call-container').children().remove()
  $('.in-game-video-call-container').remove()
  //re-enable the call button for the caller
  $('.friend-container').children('#start-call').attr("disabled", false)
  $('main').off('click', '#accept-button')
  $('main').off('click', '#decline-button')
});

socket.on('delete user', userInfo => {
  $('#friends-list').find(`#${userInfo.user_id}`).remove()

  if (offlineFriends.includes(userInfo.username)) {
    $('#offline-friends ul').prepend(`<li>${userInfo.username}</li>`)
  }

})

//variables to be used by other modules
window.allGlobalVars = { socket, coordinates, connectSocket, getAllFriends, updateFriendsList }


//testing seller video call
$("main").on("click", "#customer-support", (event) => {
  targetUser = $(event.target).closest('li').attr('id')
 /*  if (!window.mute) {
    $('#music').click()
  } */
  //disable the call button if in a call
  $('.friend-container').children('#start-call').attr("disabled", true)

  //avoid calling the user while a call is ongoing
  if (!call) {
    socket.emit('call-request', {
      peerID,
      targetUser: 6,
      seller: true
    })
    //add a video container
    $('#game-chat-container').prepend(`<div class="in-game-video-call-container"></div>`)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        //add the local cam stream
        $('.in-game-video-call-container').append(inGameLocalVideo)
        $('.in-game-video-call-container').append(`<button class="btn btn-danger" id="end-call"> <i class="fas fa-phone-slash"> </i>End Call</button>`)
        addVideoStream(inGameLocalVideo, stream)

        //add the remote video stream
        socket.on("call-accepted", peerID => {
          sendrecieveStreams(peerID, stream)
          socket.off("call-accepted")
        })
      })
  } else {
    alert("already in another call!");
  }
});