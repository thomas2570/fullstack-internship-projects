from rest_framework import serializers
from .models import AuditLog
from authentication.serializers import UserSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'workspace', 'actor', 'action', 'target_type',
            'target_id', 'target_title', 'changes', 'ip_address', 'created_at'
        ]
        read_only_fields = fields
