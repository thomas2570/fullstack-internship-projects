from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Obtain JWT tokens with embedded user profile and available workspaces."""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """Public registration endpoint with optional initial workspace creation."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens immediately upon signup for frictionless onboarding
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data
        
        memberships = user.workspace_memberships.select_related('workspace').all()
        workspaces_data = [
            {
                'id': str(m.workspace.id),
                'name': m.workspace.name,
                'slug': m.workspace.slug,
                'role': m.role,
                'plan': m.workspace.plan
            }
            for m in memberships
        ]

        return Response({
            'user': user_data,
            'workspaces': workspaces_data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'Account created successfully.'
        }, status=status.HTTP_201_CREATED)


class CurrentUserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update currently authenticated user profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserDirectoryView(generics.ListAPIView):
    """List users belonging to current workspace for assignment and mentions."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        workspace = getattr(self.request, 'workspace', None)
        if not workspace:
            return User.objects.filter(id=self.request.user.id)
        return User.objects.filter(workspace_memberships__workspace=workspace).distinct()
