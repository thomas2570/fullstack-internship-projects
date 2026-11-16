from rest_framework import serializers
from .models import Board, BoardColumn


class BoardColumnSerializer(serializers.ModelSerializer):
    issues_count = serializers.SerializerMethodField()

    class Meta:
        model = BoardColumn
        fields = ['id', 'board', 'name', 'order', 'color', 'wip_limit', 'is_done_column', 'issues_count', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_issues_count(self, obj):
        return obj.issues.count() if hasattr(obj, 'issues') else 0


class BoardSerializer(serializers.ModelSerializer):
    columns = BoardColumnSerializer(many=True, read_only=True)
    project_key = serializers.ReadOnlyField(source='project.key')
    project_name = serializers.ReadOnlyField(source='project.name')

    class Meta:
        model = Board
        fields = ['id', 'workspace', 'project', 'project_key', 'project_name', 'name', 'description', 'columns', 'created_at']
        read_only_fields = ['id', 'workspace', 'created_at']

    def create(self, validated_data):
        workspace = self.context['request'].workspace
        board = Board.objects.create(workspace=workspace, **validated_data)
        
        # Populate standard initial columns if none provided
        BoardColumn.objects.bulk_create([
            BoardColumn(board=board, name="To Do", order=0, color="#3B82F6"),
            BoardColumn(board=board, name="In Progress", order=1, color="#F59E0B"),
            BoardColumn(board=board, name="Review", order=2, color="#8B5CF6"),
            BoardColumn(board=board, name="Done", order=3, color="#10B981", is_done_column=True),
        ])
        return board


class ReorderColumnsSerializer(serializers.Serializer):
    column_orders = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )
