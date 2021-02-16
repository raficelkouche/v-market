const socket = io();
$(() => {
  $("#form").on('submit', (event) => {
    event.preventDefault();
    if ($('#input').val()) {
      socket.emit('send message', $('#input').val())
      $('#input').val('')
    }
  })

  socket.on('receive message', message => {
    $('#messages').append(`<li>${message}</li`)
  })
})

