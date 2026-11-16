from django.urls import path
from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    ProjectMembersView
)

app_name = 'projects'

urlpatterns = [
    path('', ProjectListCreateView.as_view(), name='project_list_create'),
    path('<uuid:id>/', ProjectDetailView.as_view(), name='project_detail'),
    path('<uuid:project_id>/members/', ProjectMembersView.as_view(), name='project_members'),
]
