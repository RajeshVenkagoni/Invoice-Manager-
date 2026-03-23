import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Clock, AlertCircle, TrendingDown, Plus, Eye } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../api/axios'
import { formatCurrency, formatDate } from '../utils/format'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dashboard/summary/'), api.get('/invoices/?ordering=-created_at')])
      .then(([d, inv]) => { setData(d.data); setRecentInvoices(inv.data.results || []) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl" />)}</div>

  const expenseCategories = Object.entries(data?.expense_by_category || {}).map(([name, value], i) => ({ name, value }))
  const STATUS_BADGE = { Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-blue-100 text-blue-700', Paid: 'bg-green-100 text-green-700', Overdue: 'bg-red-100 text-red-700' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex gap-2">
          <Link to="/invoices/new" className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600">
            <Plus size={15} /> New Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(data?.total_revenue), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Outstanding', value: formatCurrency(data?.outstanding), icon: Clock, color: 'text-blue-600 bg-blue-50' },
          { label: 'Overdue Invoices', value: data?.overdue_count || 0, icon: AlertCircle, color: 'text-red-500 bg-red-50' },
          { label: 'Monthly Expenses', value: formatCurrency(data?.monthly_expenses), icon: TrendingDown, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">{label}</span>
              <span className={`p-1.5 rounded-lg ${color}`}><Icon size={15} /></span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Monthly Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.monthly_data || []}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} name="Expenses" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={expenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {expenseCategories.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">Recent Invoices</h3>
          <Link to="/invoices" className="text-sm text-emerald-600 hover:underline">View all</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['Invoice #', 'Client', 'Amount', 'Status', 'Due Date', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentInvoices.slice(0, 5).map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-emerald-700 font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3">{inv.client_name}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(inv.total)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status] || ''}`}>{inv.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                <td className="px-4 py-3">
                  <Link to={`/invoices/${inv.id}`} className="text-gray-400 hover:text-emerald-600"><Eye size={14} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
