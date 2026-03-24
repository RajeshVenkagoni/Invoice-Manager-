import csv
import io
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from django.http import HttpResponse, FileResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.contrib.auth.models import User
from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from .models import Client, Invoice, InvoiceItem, Expense, PaymentRecord
from .serializers import (
    ClientSerializer, InvoiceSerializer, InvoiceListSerializer,
    ExpenseSerializer, PaymentRecordSerializer, RegisterSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [AllowAny]
    search_fields = ['name', 'email', 'company']
    ordering = ['-created_at']


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('client').prefetch_related('items', 'payments')
    permission_classes = [AllowAny]
    filterset_fields = ['status', 'client']
    search_fields = ['invoice_number', 'client__name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFont("Helvetica-Bold", 24)
        p.drawString(1 * inch, height - 1 * inch, "INVOICE")
        p.setFont("Helvetica", 10)
        p.drawString(1 * inch, height - 1.4 * inch, "Your Company Name")
        p.drawString(1 * inch, height - 1.6 * inch, "123 Business Street, City, State 12345")

        # Invoice details
        p.setFont("Helvetica-Bold", 10)
        p.drawString(4.5 * inch, height - 1 * inch, f"Invoice #: {invoice.invoice_number}")
        p.setFont("Helvetica", 10)
        p.drawString(4.5 * inch, height - 1.2 * inch, f"Issue Date: {invoice.issue_date}")
        p.drawString(4.5 * inch, height - 1.4 * inch, f"Due Date: {invoice.due_date}")
        p.drawString(4.5 * inch, height - 1.6 * inch, f"Status: {invoice.status}")

        # Client
        p.setFont("Helvetica-Bold", 10)
        p.drawString(1 * inch, height - 2.2 * inch, "Bill To:")
        p.setFont("Helvetica", 10)
        p.drawString(1 * inch, height - 2.4 * inch, invoice.client.name)
        p.drawString(1 * inch, height - 2.6 * inch, invoice.client.company or '')
        p.drawString(1 * inch, height - 2.8 * inch, invoice.client.email)

        # Items table header
        y = height - 3.4 * inch
        p.setFont("Helvetica-Bold", 10)
        p.drawString(1 * inch, y, "Description")
        p.drawString(4 * inch, y, "Qty")
        p.drawString(4.8 * inch, y, "Unit Price")
        p.drawString(6 * inch, y, "Total")
        p.line(1 * inch, y - 5, 7 * inch, y - 5)

        # Items
        p.setFont("Helvetica", 10)
        y -= 0.3 * inch
        for item in invoice.items.all():
            p.drawString(1 * inch, y, str(item.description)[:50])
            p.drawString(4 * inch, y, str(item.quantity))
            p.drawString(4.8 * inch, y, f"${item.unit_price:,.2f}")
            p.drawString(6 * inch, y, f"${item.total:,.2f}")
            y -= 0.25 * inch

        # Totals
        p.line(5 * inch, y, 7 * inch, y)
        y -= 0.25 * inch
        p.drawString(5 * inch, y, f"Subtotal: ${invoice.subtotal:,.2f}")
        y -= 0.2 * inch
        p.drawString(5 * inch, y, f"Tax ({invoice.tax_rate}%): ${invoice.tax_amount:,.2f}")
        y -= 0.2 * inch
        p.setFont("Helvetica-Bold", 11)
        p.drawString(5 * inch, y, f"Total: ${invoice.total:,.2f}")

        # Notes
        if invoice.notes:
            y -= 0.5 * inch
            p.setFont("Helvetica-Bold", 10)
            p.drawString(1 * inch, y, "Notes:")
            p.setFont("Helvetica", 10)
            p.drawString(1 * inch, y - 0.2 * inch, invoice.notes[:200])

        p.showPage()
        p.save()
        buffer.seek(0)
        return FileResponse(buffer, as_attachment=True, filename=f'{invoice.invoice_number}.pdf', content_type='application/pdf')

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'Sent'
        invoice.save()
        return Response({'status': 'Sent'})

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'Paid'
        invoice.paid_date = date.today()
        invoice.save()
        PaymentRecord.objects.create(
            invoice=invoice,
            amount=invoice.total,
            payment_date=date.today(),
            payment_method=request.data.get('payment_method', 'Bank Transfer'),
            reference_number=request.data.get('reference_number', '')
        )
        return Response({'status': 'Paid'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['category', 'is_billable', 'client']
    ordering = ['-date']

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="expenses.csv"'
        writer = csv.writer(response)
        writer.writerow(['Date', 'Category', 'Vendor', 'Description', 'Amount', 'Billable', 'Client'])
        for exp in self.filter_queryset(self.get_queryset()):
            writer.writerow([exp.date, exp.category, exp.vendor, exp.description,
                             exp.amount, exp.is_billable, exp.client.name if exp.client else ''])
        return response


class DashboardView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = date.today()
        total_revenue = Invoice.objects.filter(status='Paid').aggregate(total=Sum('total'))['total'] or 0
        outstanding = Invoice.objects.filter(status__in=['Sent']).aggregate(total=Sum('total'))['total'] or 0
        overdue = Invoice.objects.filter(status='Overdue').count()
        monthly_expenses = Expense.objects.filter(date__month=today.month, date__year=today.year).aggregate(total=Sum('amount'))['total'] or 0

        # Monthly income vs expenses (last 6 months)
        monthly_data = []
        for i in range(5, -1, -1):
            d = today - relativedelta(months=i)
            income = Invoice.objects.filter(status='Paid', paid_date__month=d.month, paid_date__year=d.year).aggregate(total=Sum('total'))['total'] or 0
            expenses = Expense.objects.filter(date__month=d.month, date__year=d.year).aggregate(total=Sum('amount'))['total'] or 0
            monthly_data.append({'month': d.strftime('%b %Y'), 'income': float(income), 'expenses': float(expenses)})

        expense_by_category = dict(
            Expense.objects.values_list('category').annotate(total=Sum('amount'))
        )

        return Response({
            'total_revenue': float(total_revenue),
            'outstanding': float(outstanding),
            'overdue_count': overdue,
            'monthly_expenses': float(monthly_expenses),
            'monthly_data': monthly_data,
            'expense_by_category': {k: float(v) for k, v in expense_by_category.items()},
        })


class ProfitLossView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        today = date.today()
        data = []
        for i in range(11, -1, -1):
            d = today - relativedelta(months=i)
            income = float(Invoice.objects.filter(status='Paid', paid_date__month=d.month, paid_date__year=d.year).aggregate(t=Sum('total'))['t'] or 0)
            expenses = float(Expense.objects.filter(date__month=d.month, date__year=d.year).aggregate(t=Sum('amount'))['t'] or 0)
            data.append({'month': d.strftime('%b %Y'), 'income': income, 'expenses': expenses, 'profit': income - expenses})
        return Response(data)
