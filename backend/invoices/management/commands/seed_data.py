import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from invoices.models import Client, Invoice, InvoiceItem, Expense


CLIENTS_DATA = [
    ('Acme Corp', 'acme@example.com', 'TechCorp Inc.'),
    ('Beta Solutions', 'beta@example.com', 'Beta Solutions LLC'),
    ('Gamma Tech', 'gamma@example.com', 'Gamma Technologies'),
    ('Delta Services', 'delta@example.com', 'Delta Services Ltd'),
    ('Epsilon Labs', 'epsilon@example.com', 'Epsilon Research'),
]

EXPENSE_CATEGORIES = ['Office Supplies', 'Software', 'Travel', 'Meals', 'Equipment', 'Utilities', 'Marketing', 'Other']
VENDORS = ['Amazon', 'Google', 'Microsoft', 'WeWork', 'Uber', 'Zoom', 'Slack', 'Adobe']
SERVICES = ['Web Development', 'UI/UX Design', 'API Integration', 'Database Setup', 'Consulting', 'Support', 'Training', 'Deployment']


class Command(BaseCommand):
    help = 'Seed invoice manager with sample data'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')

        clients = []
        for name, email, company in CLIENTS_DATA:
            client, _ = Client.objects.get_or_create(name=name, defaults={'email': email, 'company': company})
            clients.append(client)

        statuses = ['Draft', 'Sent', 'Paid', 'Paid', 'Paid', 'Overdue']
        for i in range(20):
            issue_date = date.today() - timedelta(days=random.randint(5, 120))
            due_date = issue_date + timedelta(days=random.choice([15, 30, 45]))
            status = random.choice(statuses)
            invoice = Invoice(
                client=random.choice(clients),
                issue_date=issue_date,
                due_date=due_date,
                status=status,
                tax_rate=random.choice([0, 8, 10, 15]),
                paid_date=due_date if status == 'Paid' else None,
            )
            invoice.save()
            for _ in range(random.randint(1, 4)):
                InvoiceItem.objects.create(
                    invoice=invoice,
                    description=random.choice(SERVICES),
                    quantity=random.randint(1, 20),
                    unit_price=random.choice([50, 75, 100, 150, 200, 250]),
                )
            invoice.recalculate()

        for i in range(50):
            Expense.objects.create(
                date=date.today() - timedelta(days=random.randint(1, 90)),
                category=random.choice(EXPENSE_CATEGORIES),
                vendor=random.choice(VENDORS),
                description='Business expense',
                amount=round(random.uniform(10, 500), 2),
                is_billable=random.random() > 0.6,
                client=random.choice(clients) if random.random() > 0.5 else None,
            )

        self.stdout.write(self.style.SUCCESS('Seeded invoice manager data successfully'))
