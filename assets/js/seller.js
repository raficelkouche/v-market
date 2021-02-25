const socket = io('/', {
  autoConnect: false,
  query: {
    x: 289, //would be replaced by x and y for seller from db
    y: 305
  }
}) 

socket.connect()

socket.emit("update-user-details", {
  user_id: 6,
  username: "Rafic",
  seller: true
})

socket.on('receive message', data => {
  
})

socket.on('disconnect', (user_id) => {
  socket.disconnect();
})

socket.on('connect_error', error => {
  console.log("server error: ", error)
})

let peerID;

myPeer = new Peer(undefined, { //peer connection for video chatting, has to be after socket.connect()
  host: '/',
  port: '3001'
})

myPeer.on('open', id => {
  peerID = id;
})

const inGameLocalVideo = document.getElementById("seller-local-video")
const remoteVideo = document.getElementById("customer-remote-video")

socket.on('call-request-received', data => {
  $('.content-container').append(`
            <div class="call-notification"> 
              <div> User ${data.username} is calling ...</div>
              <button id="accept-button">accept</button>
              <button id="decline-button">decline</button>
            </div>
          `)
  $('.content-container').on('click', '#accept-button', () => {
    $('.call-notification').remove();

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        addVideoStream(inGameLocalVideo, stream)

        myPeer.on('call', call => {
          call.answer(stream) //answer the call and send local stream

          call.on('stream', remoteUserVideoStream => {
            addVideoStream(remoteVideo, remoteUserVideoStream)
          })
        })
        socket.emit('user-accepted-call', peerID)
      })
  })

})

$('main').on('click', '#decline-button', () => {
  socket.emit('user-declined-call')
  $('.call-notification').remove()
})

$('#end-call').on('click', () => {
  socket.emit('call-ended')
})

socket.on('call-ended', () => {
  call.close()
  inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
  remoteVideo.srcObject.getTracks().forEach(track => track.stop())
  inGameLocalVideo.remove()
  remoteVideo.remove()
})

socket.on('call-declined', () => {
  inGameLocalVideo.srcObject.getTracks().forEach(track => track.stop())
  inGameLocalVideo.remove()
})


$("#start-call").on("click", (event) => {
  if (!call) {      //avoid calling the user while a call is ongoing
    if (targetUser) {
      socket.emit('call-request', {
        peerID,
        targetUser
      })

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          addVideoStream(inGameLocalVideo, stream)

          socket.on("call-accepted", peerID => {
            sendReceiveStreams(peerID, stream)
          })
        })

    }
    else {
      alert("click on user first")
    }
  }
  else {
    alert("already in another call!")
  }
});


function sendReceiveStreams(remoteUserID, stream) {
  //call the other user and send the local stream
  call = myPeer.call(remoteUserID, stream)

  //setup handlers to receive the remote stream
  const remoteVideo = document.getElementById("in-game-remote-video")
  call.on('stream', remoteUserVideoStream => {
    addVideoStream(remoteVideo, remoteUserVideoStream)
  })
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}