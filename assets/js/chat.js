//socket logic
let activeUser;
const socket = io('http://localhost:3000/')

socket.on('receive message', message => {
  $('#messages').append(`<li>${message}</li`)
})

socket.on('updated-users-list', usersList  => {
  console.log(usersList)
  usersList.users.forEach(user => {
    if (!document.getElementById(user)) {
      $("#active-users-container ul").append(`<li id="${user}">${user}</li>`)
      $("#active-users-container li").on("click", function (event) {
        $("#active-users-container ul").children().css("color", "black")
        $(this).css("color", "red")
        activeUser = event.target
        console.log(activeUser)
      })
    }
  })
})
//jQuery
$(() => {
  //chat form
  $("#form").on('submit', (event) => {
    event.preventDefault();
    if ($('#input').val()) {
      socket.emit('send message', $('#input').val())
      $('#input').val('')
    }
  })
})
  
  

