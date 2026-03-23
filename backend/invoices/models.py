from django.db import models
from django.utils import timezone


class Client(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    company = models.CharField(max_length=200, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'), ('Sent', 'Sent'), ('Paid', 'Paid'),
        ('Overdue', 'Overdue'), ('Cancelled', 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=30, unique=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='invoices')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year = timezone.now().year
            last = Invoice.objects.filter(invoice_number__startswith=f'INV-{year}-').order_by('-id').first()
            seq = int(last.invoice_number.split('-')[-1]) + 1 if last else 1
            self.invoice_number = f'INV-{year}-{seq:04d}'
        super().save(*args, **kwargs)

    def recalculate(self):
        self.subtotal = sum(item.total for item in self.items.all())
        self.tax_amount = self.subtotal * self.tax_rate / 100
        self.total = self.subtotal + self.tax_amount
        self.save()

    def __str__(self):
        return self.invoice_number


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=500)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('Office Supplies', 'Office Supplies'), ('Software', 'Software'),
        ('Travel', 'Travel'), ('Meals', 'Meals'), ('Equipment', 'Equipment'),
        ('Utilities', 'Utilities'), ('Marketing', 'Marketing'),
        ('Professional Services', 'Professional Services'), ('Other', 'Other'),
    ]

    date = models.DateField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    vendor = models.CharField(max_length=200)
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    receipt_url = models.URLField(blank=True)
    is_billable = models.BooleanField(default=False)
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.category} - {self.vendor} ${self.amount}'


class PaymentRecord(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'), ('Bank Transfer', 'Bank Transfer'),
        ('Credit Card', 'Credit Card'), ('Check', 'Check'),
    ]

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES)
    reference_number = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f'Payment for {self.invoice} - ${self.amount}'
