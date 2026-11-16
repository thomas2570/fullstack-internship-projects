from rest_framework import serializers
from django.db.models import Sum
from .models import Sprint


class SprintSerializer(serializers.ModelSerializer):
    project_key = serializers.ReadOnlyField(source='project.key')
    total_issues = serializers.SerializerMethodField()
    completed_issues = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    completed_points = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = [
            'id', 'workspace', 'project', 'project_key', 'name', 'goal',
            'start_date', 'end_date', 'status', 'sequence',
            'total_issues', 'completed_issues', 'total_points', 'completed_points',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'workspace', 'created_at', 'updated_at']

    def get_total_issues(self, obj):
        return obj.issues.count() if hasattr(obj, 'issues') else 0

    def get_completed_issues(self, obj):
        if not hasattr(obj, 'issues'):
            return 0
        return obj.issues.filter(board_column__is_done_column=True).count()

    def get_total_points(self, obj):
        if not hasattr(obj, 'issues'):
            return 0
        return obj.issues.aggregate(points=Sum('story_points'))['points'] or 0

    def get_completed_points(self, obj):
        if not hasattr(obj, 'issues'):
            return 0
        return obj.issues.filter(board_column__is_done_column=True).aggregate(points=Sum('story_points'))['points'] or 0

    def create(self, validated_data):
        workspace = self.context['request'].workspace
        return Sprint.objects.create(workspace=workspace, **validated_data)
