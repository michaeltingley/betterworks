var pusher = new Pusher('f4e32bbd2ddcdaa5e41f');

var currentlySubscribedConversation;

function messageToHtml(message) {
  message_display = "<div>" + message.body + "</div>"
    + "<div>";
  if (message.from_current_user) {
    message_display += "me";
  } else {
    message_display += message.email;
  }
  message_display += " - " + message.timestamp + "<br>";
  return message_display;
}

function createSetActiveConversationFunction(email) {
  return function() {
    $.ajax({
      type: 'POST',
      url: '/chat/get_messages/',
      data: {
        'csrfmiddlewaretoken': window.CSRF_TOKEN,
        'email': email,
      },
      success: function(response) {
        pusher.unsubscribe(currentlySubscribedConversation);

        $('#chat_messages')
            .empty()
            .append($.map(response.messages, messageToHtml));

        currentlySubscribedConversation = response.uuid;
        pusher
            .subscribe(currentlySubscribedConversation)
            .bind('message posted', function(message) {
              $('#chat_messages').append(messageToHtml(message));
            });
        $('#email_prefix').val('');
        $('#found_users').empty();
        $('#chat_pane').show();
        $('#chat_title').text('Chat with ' + email);
        $('#post_message')
            .unbind()
            .submit(function(event) {
                event.preventDefault();
                $.ajax({
                    type: 'POST',
                    url: '/chat/post_message/',
                    data: {
                      'csrfmiddlewaretoken': window.CSRF_TOKEN,
                      'email': email,
                      'message_text': $('#message_text').val(),
                    },
                });
                $('#message_text').val('');
            });
      }
    });
  };
}

function makeInitiateChatLinkForEmail(email) {
  return $('<li />', {
    html: $('<a />', {
      text: email,
      click: createSetActiveConversationFunction(email),
    })
  });
}

function renderConversation(conversation) {
  participant_email = conversation.participant_emails.find(function(email) {
    return email != user_email;
  });
  return $('<li />', {
    html: conversation.last_message_text + '<br />'
        + '<b>' + participant_email + '</b> - '
        + conversation.last_message_timestamp,
    click: createSetActiveConversationFunction(participant_email),
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
        $('#found_users').html($.map(response.emails, makeInitiateChatLinkForEmail));
      }
    });
  });
  $.ajax({
    type: 'POST',
    url: '/chat/get_conversations/',
    data: {
      'csrfmiddlewaretoken': window.CSRF_TOKEN,
    },
    success: function(response) {
      $('#conversations').html($.map(response.conversations, renderConversation));
    }
  });
});
