from django.conf.urls import url

from . import views

app_name = 'chat'
urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^about/', views.AboutView.as_view(), name='about'),
    # url(r'^login/$', views.login, name='login'),
    url(r'^login/$', views.LoginView.as_view(), name='login'),
    url(r'^logout/$', views.logout, name='logout'),
    url(r'^find_users/$', views.find_users, name='find_users'),
    url(r'^get_messages/$', views.get_messages, name='get_messages'),
    url(r'^post_message/$', views.post_message, name='post_message'),
    url(r'^get_conversations/$', views.get_conversations, name='get_conversations'),
    # url(r'^login_or_sign_up/$', views.login_or_sign_up, name='login_or_sign_up'),
    # url(r'^login$', views.login, name='login'),
]
