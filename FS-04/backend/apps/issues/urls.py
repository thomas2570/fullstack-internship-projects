from django.urls import path
from .views import (
    IssueListCreateView,
    IssueDetailView,
    MoveIssueView,
    IssueCommentListCreateView,
    IssueAttachmentListCreateView
)

app_name = 'issues'

urlpatterns = [
    path('', IssueListCreateView.as_view(), name='issue_list_create'),
    path('<uuid:id>/', IssueDetailView.as_view(), name='issue_detail'),
    path('<uuid:id>/move/', MoveIssueView.as_view(), name='move_issue'),
    path('<uuid:issue_id>/comments/', IssueCommentListCreateView.as_view(), name='issue_comments'),
    path('<uuid:issue_id>/attachments/', IssueAttachmentListCreateView.as_view(), name='issue_attachments'),
]
