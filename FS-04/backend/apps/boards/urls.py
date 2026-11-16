from django.urls import path
from .views import (
    BoardListCreateView,
    BoardDetailView,
    BoardColumnListCreateView,
    BoardColumnDetailView,
    ReorderColumnsView
)

app_name = 'boards'

urlpatterns = [
    path('', BoardListCreateView.as_view(), name='board_list_create'),
    path('<uuid:id>/', BoardDetailView.as_view(), name='board_detail'),
    path('<uuid:board_id>/columns/', BoardColumnListCreateView.as_view(), name='board_columns'),
    path('<uuid:board_id>/columns/reorder/', ReorderColumnsView.as_view(), name='reorder_columns'),
    path('columns/<uuid:id>/', BoardColumnDetailView.as_view(), name='column_detail'),
]
