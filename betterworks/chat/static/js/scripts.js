var pusher = new Pusher('f4e32bbd2ddcdaa5e41f', { authEndpoint: '/chat/pusher_auth/' });

var currentlySubscribedConversation;

function messageToHtml(message) {
  var isUserMe = message.email == USER_EMAIL;
  message_display = "<li class=\""
    + (isUserMe ? "message-outgoing" : "message-incoming") + "\">"
    + "<span class=\"bubble panel panel-default\">" + message.body + "</span>"
    + "<br>"
    + "<span class=\"bubble-details\">" + (isUserMe ? "me" : message.email)
    + " - " + message.timestamp + "</span>"
    + "</li>";
  return message_display;
}

function createSetActiveConversationFunction(email) {
  return function() {
    $.ajax({
      type: 'POST',
      url: '/chat/get_messages/',
      data: {
        'csrfmiddlewaretoken': CSRF_TOKEN,
        'email': email,
      },
      success: function(response) {
        pusher.unsubscribe('private-conversation-' + currentlySubscribedConversation);

        $('#chat_messages')
            .empty()
            .append($.map(response.messages, messageToHtml));

        currentlySubscribedConversation = response.id;
        pusher
            .subscribe('private-conversation-' + currentlySubscribedConversation)
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
                      'csrfmiddlewaretoken': CSRF_TOKEN,
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
    return email != USER_EMAIL;
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
      'csrfmiddlewaretoken': CSRF_TOKEN,
    },
    success: function(response) {
      $('#conversations').html($.map(response.conversations, renderConversation));
    }
  });
});
