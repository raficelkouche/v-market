let id = 1;
const socket = io('http://localhost:3000', {
  query: id++
});

let my_id;

$(() => {
  $("#form").on('submit', (event) => {
    event.preventDefault();
    if ($('#input').val()) {
      socket.emit('send message', $('#input').val())
      $('#input').val('')
    }
  })

})

socket.on("your-id", id => {
  my_id = id
  console.log("my id: ", id)
})

socket.on('receive message', message => {
  $('#messages').append(`<li>${message}</li`)
})

socket.on('updated-users-list', usersList  => {
  console.log(usersList)
  usersList.users.forEach(user => {
    if (!document.getElementById(user)) {
      console.log(`${user} does not exist`)
      $("#active-users-container ul").append(`<li id="${user}">${user}</li>`)
      $("#active-users-container li").on("click", function (event) {
        $("#active-users-container ul").children().css("color", "black")
        $(this).css("color", "red")
      })
    }
  })
})

