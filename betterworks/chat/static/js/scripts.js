var pusher = new Pusher('f4e32bbd2ddcdaa5e41f', { authEndpoint: '/chat/pusher_auth/' });

var currentConversationEmail;

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
        currentConversationEmail = email;

        $('#chat_messages').empty().append($.map(response.messages, messageToHtml));
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
        window.scrollTo(0,document.body.scrollHeight);
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

function getRecipientEmailFromConversation(conversation) {
  return conversation.participant_emails.find(function(email) {
    return email != USER_EMAIL;
  });
}

function getConversationId(participantEmail) {
  return 'conversation-' + participantEmail.replace(/\W+/g, "_");
}

function renderConversation(conversation) {
  participantEmail = getRecipientEmailFromConversation(conversation);
  return $('<li />', {
    id: getConversationId(participantEmail),
    html: (conversation.last_message.email == USER_EMAIL ? "You: " :"")
        + conversation.last_message.body + '<br />'
        + '<b>' + participantEmail + '</b> - '
        + conversation.last_message.timestamp,
    click: createSetActiveConversationFunction(participantEmail),
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
  pusher
      .subscribe('private-participant-' + USER_EMAIL)
      .bind('conversation updated', function(conversation) {
        participantEmail = getRecipientEmailFromConversation(conversation);
        $('#' + getConversationId(participantEmail)).remove();
        $('#conversations').prepend(renderConversation(conversation));
        if (participantEmail == currentConversationEmail) {
          $('#chat_messages').append(messageToHtml(conversation.last_message));
          window.scrollTo(0, document.body.scrollHeight);
        }
      });
});
