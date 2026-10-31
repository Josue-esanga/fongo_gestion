from django.db import models

# Create your models here.
class Devoir(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    limit_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
