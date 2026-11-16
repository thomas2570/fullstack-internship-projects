import logging

logger = logging.getLogger(__name__)


def log_audit_event(workspace, actor, action, target_type, target_id, target_title='', changes=None, ip_address=None):
    """
    Standard utility to record an immutable audit trail entry and dispatch
    associated webhook event.
    """
    from .models import AuditLog

    if not workspace:
        return None

    try:
        log = AuditLog.objects.create(
            workspace=workspace,
            actor=actor if (actor and actor.is_authenticated) else None,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            target_title=str(target_title)[:255],
            changes=changes or {},
            ip_address=ip_address
        )

        # Trigger Webhooks asynchronously
        try:
            from webhooks.tasks import trigger_workspace_webhooks
            trigger_workspace_webhooks.delay(
                workspace_id=str(workspace.id),
                event_name=action.lower().replace('_', '.'),
                payload={
                    "event": action.lower().replace('_', '.'),
                    "target_type": target_type,
                    "target_id": str(target_id),
                    "target_title": str(target_title),
                    "actor_id": str(actor.id) if actor and actor.is_authenticated else None,
                    "changes": changes or {},
                    "timestamp": log.created_at.isoformat()
                }
            )
        except Exception as webhook_err:
            logger.warning(f"Could not enqueue webhook dispatch: {webhook_err}")

        return log
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
        return None
