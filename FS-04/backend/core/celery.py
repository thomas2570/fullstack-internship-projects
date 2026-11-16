import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module for 'celery'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Periodic task schedules (Celery Beat)
app.conf.beat_schedule = {
    'send-weekly-sprint-digests': {
        'task': 'notifications.tasks.send_weekly_workspace_digest',
        'schedule': crontab(day_of_week='monday', hour=9, minute=0),
    },
    'sync-stripe-subscription-statuses': {
        'task': 'billing.tasks.sync_subscription_statuses',
        'schedule': crontab(hour='*/6', minute=0),
    },
    'prune-expired-invitations': {
        'task': 'workspaces.tasks.clean_expired_invitations',
        'schedule': crontab(hour=2, minute=30),
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
