

function makeInitiateChatLinkForEmail(email) {
  return $('<li />', {
    html: $('<a />', {
      text: email,
      click: function() {
        $.ajax({
          type: 'POST',
          url: '/chat/get_messages/',
          data: {
            'csrfmiddlewaretoken': window.CSRF_TOKEN,
            'email': email,
          },
          success: function(response) {
            $('#email_prefix').val('');
            $('#found_users').empty();
            $('#chat_pane').show();
            $('#chat_title').text('Chat with ' + email);
            $('#chat_messages')
                .html($.map(response.messages, function (message, i) {
                  return "(" + message.timestamp + ") "
                      + message.email
                      + ": "
                      + message.body
                      + "<br>";
                }));
            $('#post_message').submit(function(event) {
                event.preventDefault();
                $.ajax({
                    type: 'POST',
                    url: '/chat/post_message/',
                    data: {
                      'csrfmiddlewaretoken': window.CSRF_TOKEN,
                      'email': email,
                      'message_text': $('#message_text').text(),
                    },
                });
            });
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
