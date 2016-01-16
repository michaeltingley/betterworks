function makeInitiateChatLinkForEmail(email) {
  return $('<li />', {
    html: $('<a />', {
      text: email,
      click: function() {
        $.ajax({
          type: 'POST',
          url: '/chat/get_messages/',
          data: {
            email: email,
            csrfmiddlewaretoken: window.CSRF_TOKEN
          },
          success: function(response) {
            $('#email_prefix').val('');
            $('#found_users').empty();
            $('#chat_title').text('Chat with ' + email);
            $('#chat_messages')
                .html($.map(response.messages, function (message, i) {
                  return "(" + message.timestamp + ") "
                      + message.email
                      + ": "
                      + message.body
                      + "<br>";
                }));
          }
        });
      }
    })
  });
}

$(function() {
  $('#find_users').submit(function(event) {
    event.preventDefault();
    $.ajax({
      type: 'POST',
      url: '/chat/find_users/',
      data: $('#find_users').serialize(),
      success: function(response) {
        $('#found_users')
            .html($.map(response.emails, function (email, i) {
              return makeInitiateChatLinkForEmail(email);
            }));
      }
    });
  });
});
