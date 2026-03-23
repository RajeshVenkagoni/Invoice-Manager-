import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import api from '../api/axios'
import { formatCurrency } from '../utils/format'

export default function Reports() {
  const [plData, setPlData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/reports/profit-loss/').then(r => setPlData(r.data)).finally(() => setLoading(false)) }, [])

  const totalRevenue = plData.reduce((s, r) => s + r.income, 0)
  const totalExpenses = plData.reduce((s, r) => s + r.expenses, 0)
  const netProfit = totalRevenue - totalExpenses

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-xl" />

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Reports</h2>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '12-Month Revenue', value: formatCurrency(totalRevenue), color: 'text-emerald-700' },
          { label: '12-Month Expenses', value: formatCurrency(totalExpenses), color: 'text-red-600' },
          { label: 'Net Profit', value: formatCurrency(netProfit), color: netProfit >= 0 ? 'text-emerald-700' : 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Profit & Loss — Last 12 Months</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={plData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Revenue" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" fill="#f87171" name="Expenses" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-700 mb-4">Monthly Profit Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={plData}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} dot={false} name="Net Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-700">Monthly P&L Statement</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{['Month', 'Revenue', 'Expenses', 'Net Profit', 'Margin'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {plData.map(row => (
              <tr key={row.month} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{row.month}</td>
                <td className="px-4 py-3 text-emerald-700">{formatCurrency(row.income)}</td>
                <td className="px-4 py-3 text-red-600">{formatCurrency(row.expenses)}</td>
                <td className={`px-4 py-3 font-medium ${row.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatCurrency(row.profit)}</td>
                <td className="px-4 py-3 text-gray-500">{row.income > 0 ? `${((row.profit / row.income) * 100).toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
