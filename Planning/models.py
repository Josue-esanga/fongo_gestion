from django.db import models
from fongo_user.models import User  

# Create your models here.
class Event(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    date = models.DateTimeField()
    dirigent = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='event_dirigent', 
        limit_choices_to={'role': 'admin' or 'super_admin'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
