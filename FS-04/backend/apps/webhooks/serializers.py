from rest_framework import serializers
from .models import WebhookEndpoint, WebhookDelivery


class WebhookDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookDelivery
        fields = [
            'id', 'webhook', 'event_type', 'payload',
            'response_status_code', 'response_body', 'duration_ms',
            'success', 'created_at'
        ]
        read_only_fields = fields


class WebhookEndpointSerializer(serializers.ModelSerializer):
    deliveries_count = serializers.SerializerMethodField()
    last_delivery_status = serializers.SerializerMethodField()

    class Meta:
        model = WebhookEndpoint
        fields = [
            'id', 'workspace', 'target_url', 'description', 'secret',
            'events', 'is_active', 'deliveries_count', 'last_delivery_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'workspace', 'secret', 'created_at', 'updated_at']

    def get_deliveries_count(self, obj):
        return obj.deliveries.count()

    def get_last_delivery_status(self, obj):
        last = obj.deliveries.first()
        return last.response_status_code if last else None

    def create(self, validated_data):
        workspace = self.context['request'].workspace
        return WebhookEndpoint.objects.create(workspace=workspace, **validated_data)
