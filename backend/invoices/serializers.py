from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Client, Invoice, InvoiceItem, Expense, PaymentRecord


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ClientSerializer(serializers.ModelSerializer):
    total_invoices = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    class Meta:
        model = Client
        fields = '__all__'
    def get_total_invoices(self, obj):
        return obj.invoices.count()
    def get_total_revenue(self, obj):
        from django.db.models import Sum
        return float(obj.invoices.filter(status='Paid').aggregate(total=Sum('total'))['total'] or 0)


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'total']
        read_only_fields = ['total']


class PaymentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentRecord
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    payments = PaymentRecordSerializer(many=True, read_only=True)
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'subtotal', 'tax_amount', 'total', 'created_at']

    def get_client_name(self, obj):
        return obj.client.name if obj.client else ''

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item)
        invoice.recalculate()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                InvoiceItem.objects.create(invoice=instance, **item)
        instance.recalculate()
        return instance


class InvoiceListSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'client', 'client_name', 'issue_date', 'due_date', 'status', 'total']
    def get_client_name(self, obj):
        return obj.client.name if obj.client else ''


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
