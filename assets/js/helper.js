let call = null;
let myPeer = null;
let peerID = null;
let chatRecieverID = null;

const coordinates = {
  x: Math.floor(Math.random() * 500) + 40,
  y: Math.floor(Math.random() * 600) + 50
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

//Text chat feature
socket.on('recieve message', data => {
  //don't add a notification button if one exists already
  if(!$(`#${data.sender.user_id}`).children('#message-recieved').length){
    $(`#${data.sender.user_id}`).append('<button id="message-recieved">New Message</button>')
  }
  //Add a new container only if it doesn't exist and hide it
  if (!document.getElementById(`messages-from-${data.sender.user_id}`)){
    $('#friends-list').after(`
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
    
  $(`#messages-from-${data.sender.user_id} .message-history ul`).append(`<li>${data.sender.username}: ${data.message}</li`)
  
})

//event handler for clicking on a 'new message' notification
$('main').on('click', '#message-recieved', (event) => {
  chatRecieverID = $(event.target).parent().attr("id")
  
  $('#chat-side-bar').children('.chat-container').hide()
  
  $('#message-recieved').remove()
  
  $(`#messages-from-${chatRecieverID}`).show()
})

//event handler for clicking on 'chat' button
$('main').on('click', '#start-chat', (event) => {
  chatRecieverID = $(event.target).parent().attr('id')
  //hide all visible chats if any
  $('#chat-side-bar').children('.chat-container').hide()
  
  //add a container to hold messages and the texting-form if it doesn't exist
  if (!document.getElementById(`messages-from-${chatRecieverID}`)) {
    $('#friends-list').after(`
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
  } else {
    $(`#messages-from-${chatRecieverID}`).toggle();
  }
})

//event handler for sending a new message
$('main').on('submit', "#chat-side-bar form" , (event) => {
  event.preventDefault();

  let message = $(`#messages-from-${chatRecieverID} input`).val()

  if (message) {
    $(`#messages-from-${chatRecieverID} .message-history ul`).append(`<li>${sessionStorage.getItem("IGN")}: ${message}</li`)

    socket.emit('send message', {
      recipient: chatRecieverID,
      message
    })

    $(`#messages-from-${chatRecieverID} input`).val('')

  } else {
    alert("select a user first and then type your message")
  }
});

//Video chat feature
$("main").on("click", "#start-call", (event) => {
  targetUser = $(event.target).parent().attr('id')
  //disable the call button if in a call
  $('.friend-container').children('#start-call').attr("disabled", true)
  
  //avoid calling the user while a call is ongoing
  if (!call) {      
    socket.emit('call-request', {
      peerID,
      targetUser
    })

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        //add the local cam stream
        $('.in-game-video-call-container').append(inGameLocalVideo)
        $('.in-game-video-call-container').append(`<button id="end-call">End Call</button>`)
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
  
  //add the notification to the screen
  $('main').append(`
        <div class="call-notification">
          <div> User ${data.username} is calling ...</div>
          <button id="accept-button">accept</button>
          <button id="decline-button">decline</button>
        </div>
      `)
  
  $('main').on('click', '#accept-button', () => {
    $('.call-notification').remove();
    
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
    .then(stream => {
      //add the local video stream
      $('.in-game-video-call-container').append(inGameLocalVideo)
      addVideoStream(inGameLocalVideo, stream)
      $('.in-game-video-call-container').append(`<button id="end-call">End Call</button>`)

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
  socket.emit('user-declined-call')
  $('.call-notification').remove()
  $('main').off('click', '#accept-button')
  $('main').off('click', '#decline-button')
})

$('main').on('click', '#end-call', () => {
  socket.emit('call-ended')
  $('.friend-container').children('#start-call').attr("disabled", false)

})

//socket handlers
socket.on('disconnect', (user_id) => {
  socket.disconnect();
});

socket.on('connect_error', error => {
});

socket.on('updated-friends-list', usersList => {
  Object.keys(usersList).forEach((user_id) => {
    
    if (!document.getElementById(user_id)) {
      $("#friends-list").append(`
      <div class="friend-container" id="${user_id}" style="display: flex;">
        <div>${usersList[user_id].username}</div>
        <button id="start-call">call</button>
        <button id="start-chat">chat</button>
      </div>
      `)
    }
  })
});

socket.on('call-ended', () => {
  //if the call was not picked up yet and user clickes on end call
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
  $('.in-game-video-call-container').children().remove()
  $('main').off('click', '#accept-button')
  $('main').off('click', '#decline-button')
});

socket.on('call-declined', () => {
  //stop the local video stream and remove it's container
  if(inGameLocalVideo.srcObject){
    inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
  }
  $('.in-game-video-call-container').children().remove()
  //re-enable the call button for the caller
  $('.friend-container').children('#start-call').attr("disabled", false)
  $('main').off('click', '#accept-button')
  $('main').off('click', '#decline-button')
});

//variables to be used by other modules
window.allGlobalVars = { socket, coordinates, connectSocket }