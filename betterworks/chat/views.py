from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.views.generic import TemplateView, View

from .models import Conversation, Participant

class AboutView(TemplateView):
    template_name = "chat/about.html"

@login_required(login_url='/chat/login/')
def index(request):
    return render(request, 'chat/index.html')

def login(request):
    print request.GET
    return render(request, 'chat/login.html')

class LoginView(View):

    def get(self, request, *args, **kwargs):
        return render(request, 'chat/login.html')

    def post(self, request, *args, **kwargs):
        email = request.POST['email']
        if not email:
            return self.login_failed(request, 'Email must not be blank.')

        password = request.POST['password']
        if not email:
            return self.login_failed(request, 'Password must not be blank.')

        if request.POST['action'] == 'Sign up':
            if User.objects.filter(username=email).exists():
                return self.login_failed(
                    request,
                    "The provided username already exists. Try logging in."
                )
            created_user = User.objects.create_user(
                username=email,
                password=password
            )
            Participant.objects.create(user=created_user)
        user = auth.authenticate(username=email, password=password)
        if user is None:
            return self.login_failed(
                request,
                "Your username and password didn't match. Please try again."
            )
        auth.login(request, user)
        return HttpResponseRedirect(reverse('chat:index'))

    def login_failed(self, request, error):
        return render(request, 'chat/login.html', {'error': error})

def logout(request):
    auth.logout(request)
    return HttpResponseRedirect(reverse('chat:index'))

def find_users(request):
    prefix = request.POST['email_prefix']
    if not prefix:
       return JsonResponse({'emails': []})
    return JsonResponse({
        'emails': [user.username for user in User.objects.filter(username__startswith=prefix)]
    })

@login_required(login_url='/chat/login/')
def get_messages(request):
    shared_conversations = [
        user_conversation
        for user_conversation in request.user.participant.conversation_set.all()
        if (set([participant.user.username for participant in user_conversation.participants.all()]) ==
            set([request.user.username, request.POST['email']]))
    ]
    if len(shared_conversations) > 0:
        shared_conversation = next(shared_conversations)
    else:
        # Create the new conversation
        shared_conversation = Conversation.objects.create()
        shared_conversation.participants.add(request.user.participant)
        shared_conversation.participants.add(
            User.objects.get(username=request.POST['email']).participant
        )
        shared_conversation.save()

    return JsonResponse({
        'messages': [
            {
                'email': message.participant.user.username,
                'body': message.text,
                'timestamp': message.timestamp.strftime('%I:%M%P, %m/%d/%Y'),
            } for message in shared_conversation.message_set.all()
        ]
    })
