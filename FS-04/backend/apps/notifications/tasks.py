import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task
def send_in_app_notification(user_id, workspace_id, title, message, link=''):
    """Create in-app notification entry."""
    from .models import Notification
    from workspaces.models import Workspace

    try:
        user = User.objects.get(id=user_id)
        ws = Workspace.objects.get(id=workspace_id)
        Notification.objects.create(
            recipient=user,
            workspace=ws,
            title=title,
            message=message,
            link=link
        )
        return f"Notification delivered to {user.email}"
    except Exception as e:
        logger.error(f"Failed to create in-app notification: {e}")
        return str(e)


@shared_task
def send_weekly_workspace_digest():
    """
    Periodic Monday morning report summarizing workspace velocity and active sprint health.
    """
    from workspaces.models import Workspace
    from issues.models import Issue
    from sprints.models import Sprint, SprintStatus

    workspaces = Workspace.objects.all()
    count = 0

    for ws in workspaces:
        active_sprints = Sprint.objects.filter(project__workspace=ws, status=SprintStatus.ACTIVE)
        total_open = Issue.objects.filter(project__workspace=ws, board_column__is_done_column=False).count()
        total_done = Issue.objects.filter(project__workspace=ws, board_column__is_done_column=True).count()

        subject = f"[Digest] Weekly Sprint Update for {ws.name}"
        body = (
            f"Hello Team {ws.name},\n\n"
            f"Here is your weekly agile digest:\n"
            f"- Active Sprints: {active_sprints.count()}\n"
            f"- Open Issues: {total_open}\n"
            f"- Completed Issues: {total_done}\n\n"
            f"Keep shipping great software!\n"
            f"SaaS Project Management Platform"
        )

        member_emails = list(ws.memberships.values_list('user__email', flat=True))
        if member_emails:
            try:
                send_mail(
                    subject=subject,
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=member_emails,
                    fail_silently=True
                )
                count += 1
            except Exception as e:
                logger.warning(f"Could not send email digest for {ws.name}: {e}")

    return f"Weekly digest sent for {count} workspaces."
