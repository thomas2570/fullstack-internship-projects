from rest_framework import serializers
from .models import Project, ProjectMember
from authentication.serializers import UserSerializer
from workspaces.models import Role


class ProjectMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'user_id', 'role', 'joined_at']
        read_only_fields = ['id', 'project', 'joined_at']


class ProjectSerializer(serializers.ModelSerializer):
    lead = UserSerializer(read_only=True)
    lead_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    members_count = serializers.SerializerMethodField()
    issues_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'workspace', 'name', 'key', 'description', 'lead',
            'lead_id', 'avatar_color', 'is_archived', 'created_at',
            'updated_at', 'members_count', 'issues_count'
        ]
        read_only_fields = ['id', 'workspace', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.members.count()

    def get_issues_count(self, obj):
        return obj.issues.count() if hasattr(obj, 'issues') else 0


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'key', 'description', 'avatar_color']
        read_only_fields = ['id']

    def validate_key(self, value):
        key = value.upper().strip()
        workspace = self.context['request'].workspace
        if Project.objects.filter(workspace=workspace, key=key).exists():
            raise serializers.ValidationError(f"Project with key '{key}' already exists in this workspace.")
        return key

    def create(self, validated_data):
        workspace = self.context['request'].workspace
        user = self.context['request'].user
        project = Project.objects.create(workspace=workspace, lead=user, **validated_data)
        
        # Add creator as project admin
        ProjectMember.objects.create(project=project, user=user, role=Role.ADMIN)

        # Default board with standard workflow stages
        from boards.models import Board, BoardColumn
        board = Board.objects.create(workspace=workspace, project=project, name=f"{project.name} Board")
        BoardColumn.objects.bulk_create([
            BoardColumn(board=board, name="Backlog", order=0, color="#94A3B8"),
            BoardColumn(board=board, name="To Do", order=1, color="#3B82F6"),
            BoardColumn(board=board, name="In Progress", order=2, color="#F59E0B"),
            BoardColumn(board=board, name="Code Review", order=3, color="#8B5CF6"),
            BoardColumn(board=board, name="Done", order=4, color="#10B981", is_done_column=True),
        ])

        return project
