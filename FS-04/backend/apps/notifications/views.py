from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """List recent notifications for the logged-in user in active workspace."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        workspace = getattr(self.request, 'workspace', None)
        qs = Notification.objects.filter(recipient=self.request.user)
        if workspace:
            qs = qs.filter(workspace=workspace)
        return qs[:50]


class MarkNotificationReadView(APIView):
    """Mark a specific notification as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id):
        Notification.objects.filter(id=id, recipient=request.user).update(is_read=True)
        return Response({"status": "marked as read"})


class MarkAllNotificationsReadView(APIView):
    """Mark all notifications as read for current user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        workspace = getattr(request, 'workspace', None)
        qs = Notification.objects.filter(recipient=request.user)
        if workspace:
            qs = qs.filter(workspace=workspace)
        qs.update(is_read=True)
        return Response({"status": "all marked as read"})
