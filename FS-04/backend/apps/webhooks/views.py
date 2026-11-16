from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import WebhookEndpoint, WebhookDelivery
from .serializers import WebhookEndpointSerializer, WebhookDeliverySerializer
from .tasks import send_webhook_dispatch
from workspaces.permissions import IsWorkspaceAdmin
from audit.utils import log_audit_event


class WebhookListCreateView(generics.ListCreateAPIView):
    """List or register webhooks for the active workspace."""
    serializer_class = WebhookEndpointSerializer
    permission_classes = [IsWorkspaceAdmin]

    def get_queryset(self):
        return WebhookEndpoint.objects.filter(workspace=self.request.workspace).prefetch_related('deliveries')

    def perform_create(self, serializer):
        webhook = serializer.save()
        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="WEBHOOK_CREATED",
            target_type="WebhookEndpoint",
            target_id=str(webhook.id),
            target_title=webhook.target_url
        )


class WebhookDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a webhook configuration."""
    serializer_class = WebhookEndpointSerializer
    permission_classes = [IsWorkspaceAdmin]
    lookup_field = 'id'

    def get_queryset(self):
        return WebhookEndpoint.objects.filter(workspace=self.request.workspace)

    def perform_destroy(self, instance):
        log_audit_event(
            workspace=self.request.workspace,
            actor=self.request.user,
            action="WEBHOOK_DELETED",
            target_type="WebhookEndpoint",
            target_id=str(instance.id),
            target_title=instance.target_url
        )
        instance.delete()


class WebhookDeliveriesListView(generics.ListAPIView):
    """View historical deliveries and HTTP responses for an endpoint."""
    serializer_class = WebhookDeliverySerializer
    permission_classes = [IsWorkspaceAdmin]

    def get_queryset(self):
        webhook_id = self.kwargs['webhook_id']
        return WebhookDelivery.objects.filter(
            webhook__id=webhook_id,
            webhook__workspace=self.request.workspace
        )


class WebhookPingTestView(APIView):
    """Send an immediate test event ping to verify subscriber receipt."""
    permission_classes = [IsWorkspaceAdmin]

    def post(self, request, id):
        webhook = get_object_or_404(WebhookEndpoint, id=id, workspace=request.workspace)
        test_payload = {
            "event": "ping.test",
            "message": "Webhook test event verification from Multi-Tenant SaaS PM",
            "workspace": {
                "id": str(request.workspace.id),
                "name": request.workspace.name,
                "slug": request.workspace.slug
            },
            "timestamp": "2026-11-14T10:00:00Z"
        }
        send_webhook_dispatch.delay(str(webhook.id), "ping.test", test_payload)
        return Response({"message": f"Ping event scheduled for delivery to {webhook.target_url}"})
