from rest_framework import serializers
from .models import Issue, IssueComment, IssueAttachment, IssueType, Priority
from authentication.serializers import UserSerializer
from boards.serializers import BoardColumnSerializer


class IssueCommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = IssueComment
        fields = ['id', 'issue', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'issue', 'author', 'created_at', 'updated_at']


class IssueAttachmentSerializer(serializers.ModelSerializer):
    uploader = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = IssueAttachment
        fields = ['id', 'issue', 'uploader', 'file', 'filename', 'file_size', 'file_url', 'created_at']
        read_only_fields = ['id', 'issue', 'uploader', 'filename', 'file_size', 'created_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class IssueSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    board_column = BoardColumnSerializer(read_only=True)
    board_column_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    sprint_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    project = serializers.PrimaryKeyRelatedField(read_only=True)
    project_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    project_key = serializers.ReadOnlyField(source='project.key')
    project_name = serializers.ReadOnlyField(source='project.name')
    comments_count = serializers.SerializerMethodField()
    attachments_count = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 'project', 'project_id', 'project_key', 'project_name', 'key', 'sequence_number',
            'title', 'description', 'issue_type', 'priority', 'story_points',
            'board_column', 'board_column_id', 'sprint', 'sprint_id',
            'reporter', 'assignee', 'assignee_id', 'order', 'due_date',
            'comments_count', 'attachments_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project', 'sprint', 'key', 'sequence_number', 'created_at', 'updated_at']

    def get_comments_count(self, obj):
        return obj.comments.count() if hasattr(obj, 'comments') else 0

    def get_attachments_count(self, obj):
        return obj.attachments.count() if hasattr(obj, 'attachments') else 0

    def create(self, validated_data):
        assignee_id = validated_data.pop('assignee_id', None)
        sprint_id = validated_data.pop('sprint_id', None)
        validated_data.pop('board_column_id', None)
        validated_data.pop('project_id', None)

        if assignee_id:
            validated_data['assignee_id'] = assignee_id
        if sprint_id:
            validated_data['sprint_id'] = sprint_id

        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'assignee_id' in validated_data:
            instance.assignee_id = validated_data.pop('assignee_id')
        if 'sprint_id' in validated_data:
            instance.sprint_id = validated_data.pop('sprint_id')
        if 'board_column_id' in validated_data:
            instance.board_column_id = validated_data.pop('board_column_id')
        validated_data.pop('project_id', None)

        return super().update(instance, validated_data)


class MoveIssueSerializer(serializers.Serializer):
    column_id = serializers.UUIDField()
    order = serializers.FloatField(required=False)
    previous_order = serializers.FloatField(required=False)
    next_order = serializers.FloatField(required=False)
