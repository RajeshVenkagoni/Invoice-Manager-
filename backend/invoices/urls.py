from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, InvoiceViewSet, ExpenseViewSet, DashboardView, ProfitLossView

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/summary/', DashboardView.as_view()),
    path('reports/profit-loss/', ProfitLossView.as_view()),
]
