from django.urls import path
from .views import (
    SprintListCreateView,
    SprintDetailView,
    StartSprintView,
    CompleteSprintView,
    SprintBurndownMetricsView
)

app_name = 'sprints'

urlpatterns = [
    path('', SprintListCreateView.as_view(), name='sprint_list_create'),
    path('<uuid:id>/', SprintDetailView.as_view(), name='sprint_detail'),
    path('<uuid:id>/start/', StartSprintView.as_view(), name='start_sprint'),
    path('<uuid:id>/complete/', CompleteSprintView.as_view(), name='complete_sprint'),
    path('<uuid:id>/burndown/', SprintBurndownMetricsView.as_view(), name='sprint_burndown'),
]
