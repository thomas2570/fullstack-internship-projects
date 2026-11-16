from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'display_name', 'avatar', 'job_title', 'bio', 'timezone',
            'created_at'
        ]
        read_only_fields = ['id', 'email', 'username', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    workspace_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'workspace_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        workspace_name = validated_data.pop('workspace_name', None)
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # If workspace_name was supplied during signup, auto-create their initial workspace!
        if workspace_name:
            from workspaces.models import Workspace, WorkspaceMembership, Role
            from projects.models import Project
            from boards.models import Board, BoardColumn
            
            slug_base = workspace_name.lower().replace(' ', '-')
            slug = slug_base
            counter = 1
            while Workspace.objects.filter(slug=slug).exists():
                slug = f"{slug_base}-{counter}"
                counter += 1
                
            ws = Workspace.objects.create(
                name=workspace_name,
                slug=slug,
                owner=user
            )
            WorkspaceMembership.objects.create(
                workspace=ws,
                user=user,
                role=Role.OWNER
            )
            # Create a sample starter project with board and default workflow columns
            proj = Project.objects.create(
                workspace=ws,
                name="First Project",
                key="PRJ",
                description="Your initial project workspace.",
                lead=user
            )
            board = Board.objects.create(
                workspace=ws,
                project=proj,
                name="Main Board"
            )
            BoardColumn.objects.bulk_create([
                BoardColumn(board=board, name="To Do", order=0, color="#4F46E5"),
                BoardColumn(board=board, name="In Progress", order=1, color="#F59E0B"),
                BoardColumn(board=board, name="In Review", order=2, color="#8B5CF6"),
                BoardColumn(board=board, name="Done", order=3, color="#10B981", is_done_column=True),
            ])
            
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that embeds user profile and workspace memberships."""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        
        # Attach user's active workspaces for instant client selection
        memberships = self.user.workspace_memberships.select_related('workspace').all()
        data['workspaces'] = [
            {
                'id': str(m.workspace.id),
                'name': m.workspace.name,
                'slug': m.workspace.slug,
                'role': m.role,
                'plan': m.workspace.plan
            }
            for m in memberships
        ]
        return data
