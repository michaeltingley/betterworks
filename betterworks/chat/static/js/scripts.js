var pusher = new Pusher('f4e32bbd2ddcdaa5e41f');

var currentlySubscribedConversation;

function messageToHtml(message) {
  var isUserMe = message.email == user_email;
  message_display = "<li class=\"" 
    + (isUserMe ? "message-outgoing" : "message-incoming") + "\">"
    + "<span class=\"bubble panel "
    + (isUserMe ? "bubble-outgoing" : "bubble-incoming") + "\">"
    + message.body + "</span>"
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
        $('#page_header').text(email);
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
