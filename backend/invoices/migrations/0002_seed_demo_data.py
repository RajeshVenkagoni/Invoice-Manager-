from django.db import migrations
from datetime import date


CLIENTS_DATA = [
    ('Acme Corp', 'acme@example.com', 'TechCorp Inc.'),
    ('Beta Solutions', 'beta@example.com', 'Beta Solutions LLC'),
    ('Gamma Tech', 'gamma@example.com', 'Gamma Technologies'),
    ('Delta Services', 'delta@example.com', 'Delta Services Ltd'),
    ('Epsilon Labs', 'epsilon@example.com', 'Epsilon Research'),
]

# Fixed demo invoices: (client_idx, days_ago_issued, term_days, status, tax_rate, items)
# items: list of (description, qty, unit_price)
INVOICES_DATA = [
    (0, 90, 30, 'Paid',    10, [('Web Development', 8, 150), ('UI/UX Design', 4, 100)]),
    (1, 75, 30, 'Paid',     8, [('API Integration', 6, 200), ('Consulting', 2, 250)]),
    (2, 60, 30, 'Paid',     0, [('Database Setup', 5, 150), ('Deployment', 2, 100)]),
    (3, 50, 15, 'Overdue',  0, [('Support', 10, 75)]),
    (4, 45, 30, 'Overdue',  0, [('Training', 3, 200), ('Consulting', 1, 250)]),
    (0, 40, 30, 'Sent',    10, [('Web Development', 12, 150)]),
    (1, 35, 30, 'Sent',     8, [('API Integration', 4, 200)]),
    (2, 30, 15, 'Paid',    10, [('UI/UX Design', 6, 100), ('Consulting', 2, 250)]),
    (3, 25, 30, 'Paid',     0, [('Deployment', 3, 100), ('Support', 5, 75)]),
    (4, 20, 30, 'Draft',    0, [('Training', 4, 200)]),
    (0, 15, 30, 'Sent',    10, [('Web Development', 5, 150), ('Database Setup', 2, 150)]),
    (1, 10, 15, 'Draft',    8, [('API Integration', 3, 200)]),
    (2,  5, 30, 'Overdue',  0, [('Consulting', 4, 250)]),
    (3,  3, 30, 'Draft',    0, [('Support', 8, 75), ('Training', 2, 200)]),
    (4,  1, 30, 'Sent',    10, [('UI/UX Design', 10, 100)]),
]

EXPENSES_DATA = [
    # (days_ago, category, vendor, description, amount, is_billable, client_idx_or_None)
    (85, 'Software',        'Adobe',     'Creative Suite subscription',  54.99,  False, None),
    (80, 'Software',        'Zoom',      'Zoom Pro monthly',             14.99,  False, None),
    (78, 'Office Supplies', 'Amazon',    'Office supplies',              89.50,  False, None),
    (70, 'Travel',          'Uber',      'Client meeting travel',        32.00,  True,  0),
    (65, 'Software',        'Slack',     'Slack Pro annual',            299.00,  False, None),
    (60, 'Equipment',       'Amazon',    'External hard drive',          79.99,  False, None),
    (55, 'Meals',           'Uber',      'Team lunch',                   65.00,  False, None),
    (50, 'Software',        'Microsoft', 'Microsoft 365',                99.99,  False, None),
    (48, 'Travel',          'Uber',      'Client site visit',            44.50,  True,  1),
    (45, 'Marketing',       'Google',    'Google Ads',                  200.00,  False, None),
    (40, 'Office Supplies', 'Amazon',    'Printer paper and ink',        45.75,  False, None),
    (35, 'Software',        'Adobe',     'Adobe Acrobat',                24.99,  False, None),
    (30, 'Travel',          'Uber',      'Airport transfer',             55.00,  True,  2),
    (28, 'Meals',           'Uber',      'Client dinner',               120.00,  True,  0),
    (25, 'Marketing',       'Google',    'SEO tools subscription',       49.00,  False, None),
    (20, 'Utilities',       'WeWork',    'Coworking membership',        350.00,  False, None),
    (18, 'Software',        'Zoom',      'Webinar addon',                40.00,  False, None),
    (15, 'Equipment',       'Amazon',    'Webcam upgrade',               89.00,  False, None),
    (12, 'Travel',          'Uber',      'Client office visit',          28.75,  True,  3),
    (10, 'Meals',           'Uber',      'Team coffee meeting',          35.00,  False, None),
    ( 8, 'Software',        'Slack',     'Extra workspace',              15.00,  False, None),
    ( 6, 'Marketing',       'Google',    'Paid ads campaign',           150.00,  False, None),
    ( 4, 'Office Supplies', 'Amazon',    'Stationery',                   22.50,  False, None),
    ( 2, 'Software',        'Microsoft', 'Azure credits',               100.00,  True,  4),
    ( 1, 'Travel',          'Uber',      'Proposal meeting travel',      19.00,  True,  1),
]


def seed_demo_data(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Client = apps.get_model('invoices', 'Client')
    Invoice = apps.get_model('invoices', 'Invoice')
    InvoiceItem = apps.get_model('invoices', 'InvoiceItem')
    Expense = apps.get_model('invoices', 'Expense')

    # Skip if data already exists
    if Client.objects.exists():
        return

    # Create superuser
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@invoicepro.com', 'admin123')

    # Create clients
    clients = []
    for name, email, company in CLIENTS_DATA:
        client = Client.objects.create(name=name, email=email, company=company)
        clients.append(client)

    today = date(2026, 3, 24)  # fixed reference date

    # Create invoices + items
    inv_counter = 1
    for client_idx, days_ago, term, status, tax_rate, items in INVOICES_DATA:
        issue = date(today.year - (1 if today.timetuple().tm_yday - days_ago < 1 else 0),
                     1, 1)  # simplified: just subtract days from reference
        from datetime import timedelta
        issue = today - timedelta(days=days_ago)
        due = issue + timedelta(days=term)
        paid_date = due if status == 'Paid' else None

        inv_number = f'INV-2026-{inv_counter:04d}'
        inv_counter += 1

        invoice = Invoice.objects.create(
            invoice_number=inv_number,
            client=clients[client_idx],
            issue_date=issue,
            due_date=due,
            status=status,
            tax_rate=tax_rate,
            paid_date=paid_date,
        )

        subtotal = 0
        for desc, qty, price in items:
            item_total = qty * price
            InvoiceItem.objects.create(
                invoice=invoice,
                description=desc,
                quantity=qty,
                unit_price=price,
                total=item_total,
            )
            subtotal += item_total

        tax_amount = round(subtotal * tax_rate / 100, 2)
        Invoice.objects.filter(pk=invoice.pk).update(
            subtotal=subtotal,
            tax_amount=tax_amount,
            total=subtotal + tax_amount,
        )

    # Create expenses
    from datetime import timedelta
    for days_ago, category, vendor, description, amount, is_billable, client_idx in EXPENSES_DATA:
        Expense.objects.create(
            date=today - timedelta(days=days_ago),
            category=category,
            vendor=vendor,
            description=description,
            amount=amount,
            is_billable=is_billable,
            client=clients[client_idx] if client_idx is not None else None,
        )


def reverse_seed(apps, schema_editor):
    # Reversible: remove seeded data only if it matches exactly
    Client = apps.get_model('invoices', 'Client')
    seeded_names = [name for name, _, _ in CLIENTS_DATA]
    Client.objects.filter(name__in=seeded_names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_demo_data, reverse_seed),
    ]
