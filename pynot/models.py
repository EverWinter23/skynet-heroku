from django.db import models

# Create your models here.
class Event(models.Model):
    action = models.CharField(max_length=200)
    source = models.CharField(max_length=600)
    status = models.BooleanField(default=1)
    not_date = models.DateTimeField('Notification Time')

    def get_status(self):
        return bool(self.status)
    
    def __str__(self):
        return ", ".join([self.action, self.source, str(self.status), str(self.not_date)])
    
class Lock(models.Model):
    status = models.BooleanField(default=1)
    lock_time = models.DateTimeField('Lock Time')
    
    def get_status(self):
        return bool(self.status)
    
    def __str__(self):
        return ", ".join([str(self.status), str(self.lock_time)])