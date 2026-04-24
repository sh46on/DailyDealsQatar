import os
from celery import Celery
from kombu import Queue

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dailydeals.settings')

app = Celery('dailydeals')

app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.update(
    task_track_started=True,
    task_time_limit=30 * 60,

    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

# TASK ROUTING
app.conf.task_routes = {
    "deals_app.tasks.process_flyer_task": {"queue": "ai"},
}

# QUEUES
app.conf.task_queues = (
    Queue("default"),
    Queue("email"),
    Queue("analytics"),
    Queue("ai"),
)