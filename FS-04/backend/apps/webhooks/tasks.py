import json
import time
import hmac
import hashlib
import requests
import logging
from celery import shared_task
from .models import WebhookEndpoint, WebhookDelivery

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def send_webhook_dispatch(self, webhook_id, event_name, payload):
    """
    Executes HTTP POST delivery to subscriber with HMAC-SHA256 signature header.
    """
    try:
        webhook = WebhookEndpoint.objects.get(id=webhook_id, is_active=True)
    except WebhookEndpoint.DoesNotExist:
        return f"Webhook {webhook_id} not found or inactive."

    payload_json = json.dumps(payload, default=str)
    # Compute cryptographic HMAC-SHA256 signature
    signature = hmac.new(
        webhook.secret.encode('utf-8'),
        payload_json.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'SaaS-ProjectManager-Webhooks/1.0',
        'X-SaaS-Signature-256': f"sha256={signature}",
        'X-SaaS-Event': event_name,
    }

    start_time = time.time()
    try:
        response = requests.post(
            webhook.target_url,
            data=payload_json,
            headers=headers,
            timeout=8
        )
        duration = int((time.time() - start_time) * 1000)
        success = (200 <= response.status_code < 300)

        WebhookDelivery.objects.create(
            webhook=webhook,
            event_type=event_name,
            payload=payload,
            response_status_code=response.status_code,
            response_body=response.text[:1000],
            duration_ms=duration,
            success=success
        )
        return f"Dispatched {event_name} to {webhook.target_url} with status {response.status_code}"
    except Exception as exc:
        duration = int((time.time() - start_time) * 1000)
        WebhookDelivery.objects.create(
            webhook=webhook,
            event_type=event_name,
            payload=payload,
            response_status_code=None,
            response_body=f"Connection Error: {str(exc)}"[:1000],
            duration_ms=duration,
            success=False
        )
        logger.warning(f"Webhook dispatch failed to {webhook.target_url}: {exc}")
        # Retry with exponential backoff
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            return f"Max retries exceeded for webhook {webhook_id}"


@shared_task
def trigger_workspace_webhooks(workspace_id, event_name, payload):
    """
    Finds all active webhooks for the workspace subscribed to this event
    and enqueues dispatch tasks.
    """
    webhooks = WebhookEndpoint.objects.filter(workspace_id=workspace_id, is_active=True)
    dispatched = 0

    for wh in webhooks:
        # Match wildcard '*' or exact event or event prefix e.g. 'issue.*'
        sub_events = wh.events or ['*']
        matched = False
        for pattern in sub_events:
            if pattern == '*' or pattern == event_name or pattern.endswith('.*') and event_name.startswith(pattern[:-2]):
                matched = True
                break

        if matched:
            send_webhook_dispatch.delay(str(wh.id), event_name, payload)
            dispatched += 1

    return f"Triggered {dispatched} webhooks for event {event_name}"
