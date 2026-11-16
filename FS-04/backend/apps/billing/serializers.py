from rest_framework import serializers
from .models import SubscriptionPlan, BillingInvoice


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    price_formatted = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            'slug', 'name', 'description', 'price_cents', 'price_formatted',
            'currency', 'billing_interval', 'max_members', 'max_projects',
            'max_issues_per_project', 'features', 'is_active'
        ]

    def get_price_formatted(self, obj):
        return f"${obj.price_cents / 100:.2f}" if obj.price_cents > 0 else "Free"


class BillingInvoiceSerializer(serializers.ModelSerializer):
    amount_formatted = serializers.SerializerMethodField()

    class Meta:
        model = BillingInvoice
        fields = ['id', 'stripe_invoice_id', 'amount_paid_cents', 'amount_formatted', 'currency', 'status', 'invoice_pdf', 'created_at']

    def get_amount_formatted(self, obj):
        return f"${obj.amount_paid_cents / 100:.2f}"
