from django.contrib.auth.models import User
from django.db import models

import uuid

class Participant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __repr__(self):
        return "Participant(" + str(self.user) + ")"

class Conversation(models.Model):
    participants = models.ManyToManyField(Participant)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)

    def __repr__(self):
        return "Conversation(" + str(self.participants) + ")"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    participant = models.ForeignKey(Participant)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def as_dict(self):
        '''Converts to dict representation'''
        return {
            'email': self.participant.user.username,
            'body': self.text,
            'timestamp': self.timestamp.strftime('%I:%M%P, %m/%d/%Y'),
        }

    def __repr__(self):
        return "Message(text=" + self.text + ", timestamp=" + str(self.timestamp) + ")"
