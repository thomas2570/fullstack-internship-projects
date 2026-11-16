from django.urls import path
from .views import (
    WebhookListCreateView,
    WebhookDetailView,
    WebhookDeliveriesListView,
    WebhookPingTestView
)

app_name = 'webhooks'

urlpatterns = [
    path('', WebhookListCreateView.as_view(), name='webhook_list_create'),
    path('<uuid:id>/', WebhookDetailView.as_view(), name='webhook_detail'),
    path('<uuid:id>/ping/', WebhookPingTestView.as_view(), name='webhook_ping'),
    path('<uuid:webhook_id>/deliveries/', WebhookDeliveriesListView.as_view(), name='webhook_deliveries'),
]
