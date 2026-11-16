import threading
from django.utils.deprecation import MiddlewareMixin
from .models import Workspace, WorkspaceMembership

_thread_locals = threading.local()


def get_current_workspace():
    """Retrieve active workspace from thread-local storage."""
    return getattr(_thread_locals, 'workspace', None)


def set_current_workspace(workspace):
    """Set active workspace in thread-local storage."""
    _thread_locals.workspace = workspace


def resolve_workspace(request):
    """
    Dynamically resolves and caches the active workspace for the requesting user.
    Works seamlessly across both Django Middlewares and DRF View lifecycle.
    """
    if getattr(request, 'workspace', None):
        return request.workspace

    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None

    # Support all header variants (direct, meta, lowercase)
    headers = getattr(request, 'headers', {})
    meta = getattr(request, 'META', {})
    get_params = getattr(request, 'GET', {})

    workspace_identifier = (
        headers.get('X-Workspace-ID')
        or headers.get('x-workspace-id')
        or headers.get('X-Tenant-ID')
        or headers.get('x-tenant-id')
        or meta.get('HTTP_X_WORKSPACE_ID')
        or meta.get('HTTP_X_TENANT_ID')
        or get_params.get('workspace')
    )

    resolved_workspace = None
    resolved_membership = None

    if workspace_identifier:
        try:
            ws_id_str = str(workspace_identifier).strip()
            if len(ws_id_str) == 36 and '-' in ws_id_str:
                workspace = Workspace.objects.filter(id=ws_id_str).first()
            else:
                workspace = Workspace.objects.filter(slug=ws_id_str).first()

            if workspace:
                membership = WorkspaceMembership.objects.filter(
                    workspace=workspace,
                    user=user
                ).first()
                if membership:
                    resolved_workspace = workspace
                    resolved_membership = membership
        except Exception:
            pass

    # If no valid workspace matched via header, fallback to user's first joined workspace
    if not resolved_workspace:
        first_membership = WorkspaceMembership.objects.filter(
            user=user
        ).select_related('workspace').first()
        if first_membership:
            resolved_workspace = first_membership.workspace
            resolved_membership = first_membership

    request.workspace = resolved_workspace
    request.workspace_membership = resolved_membership
    if resolved_workspace:
        set_current_workspace(resolved_workspace)

    return resolved_workspace


class TenantContextMiddleware(MiddlewareMixin):
    """
    Middleware that establishes tenant context on incoming requests.
    """

    def process_request(self, request):
        request.workspace = None
        request.workspace_membership = None
        set_current_workspace(None)
        resolve_workspace(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Re-verify once DRF or session auth has fully resolved request.user
        resolve_workspace(request)
        return None

    def process_response(self, request, response):
        set_current_workspace(None)
        return response
