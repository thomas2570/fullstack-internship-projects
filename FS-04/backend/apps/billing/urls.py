from django.urls import path
from .views import (
    PlanListView,
    CurrentSubscriptionView,
    CreateCheckoutSessionView,
    CreateCustomerPortalView,
    StripeWebhookView
)

app_name = 'billing'

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='plan_list'),
    path('subscription/', CurrentSubscriptionView.as_view(), name='subscription_status'),
    path('checkout/', CreateCheckoutSessionView.as_view(), name='create_checkout_session'),
    path('portal/', CreateCustomerPortalView.as_view(), name='customer_portal'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
]
