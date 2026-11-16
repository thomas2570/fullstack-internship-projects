from rest_framework import permissions
from .models import Role
from .middleware import resolve_workspace


class IsWorkspaceMember(permissions.BasePermission):
    """Requires user to be a valid member of the resolved tenant workspace."""
    message = "You must be an active member of this workspace to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        workspace = resolve_workspace(request)
        return bool(workspace and getattr(request, 'workspace_membership', None))


class IsWorkspaceAdmin(permissions.BasePermission):
    """Requires user to be an Admin or Owner in the resolved workspace."""
    message = "Administrator or Owner role required to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        workspace = resolve_workspace(request)
        membership = getattr(request, 'workspace_membership', None)
        return bool(workspace and membership and membership.role in [Role.ADMIN, Role.OWNER])


class IsWorkspaceOwner(permissions.BasePermission):
    """Requires user to be the Owner of the resolved workspace."""
    message = "Only workspace owner can perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        workspace = resolve_workspace(request)
        membership = getattr(request, 'workspace_membership', None)
        return bool(workspace and membership and membership.role == Role.OWNER)
