from django.urls import path
from .views import (
    WorkspaceListCreateView,
    WorkspaceDetailView,
    WorkspaceMembersView,
    WorkspaceMemberDetailView,
    InviteMemberView,
    AcceptInvitationView,
    WorkspaceOverviewStatsView,
    WorkspaceInvitationsListView,
    RevokeInvitationView,
)

app_name = 'workspaces'

urlpatterns = [
    path('', WorkspaceListCreateView.as_view(), name='workspace_list_create'),
    path('stats/', WorkspaceOverviewStatsView.as_view(), name='workspace_stats'),
    path('<uuid:id>/', WorkspaceDetailView.as_view(), name='workspace_detail'),
    path('members/', WorkspaceMembersView.as_view(), name='workspace_members'),
    path('members/<uuid:id>/', WorkspaceMemberDetailView.as_view(), name='workspace_member_detail'),
    path('invite/', InviteMemberView.as_view(), name='workspace_invite'),
    path('invitations/', WorkspaceInvitationsListView.as_view(), name='workspace_invitations'),
    path('invitations/<uuid:id>/revoke/', RevokeInvitationView.as_view(), name='revoke_invitation'),
    path('invitations/<uuid:token>/', AcceptInvitationView.as_view(), name='invitation_detail'),
    path('invitations/<uuid:token>/accept/', AcceptInvitationView.as_view(), name='accept_invitation'),
]
