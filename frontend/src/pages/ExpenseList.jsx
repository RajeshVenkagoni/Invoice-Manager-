import { useState, useEffect } from 'react'
import { Plus, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatDate, formatCurrency } from '../utils/format'

const CATEGORIES = ['Office Supplies', 'Software', 'Travel', 'Meals', 'Equipment', 'Utilities', 'Marketing', 'Professional Services', 'Other']

const INITIAL = { date: new Date().toISOString().split('T')[0], category: 'Software', vendor: '', description: '', amount: '', is_billable: false }

export default function ExpenseList() {
  const [expenses, setExpenses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = () => {
    const q = categoryFilter ? `?category=${categoryFilter}` : ''
    api.get(`/expenses/${q}`).then(r => setExpenses(r.data.results || r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { fetchExpenses() }, [categoryFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/expenses/', form)
      setExpenses(p => [res.data, ...p])
      toast.success('Expense added')
      setShowForm(false)
      setForm(INITIAL)
    } catch { toast.error('Failed to add expense') }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} expense(s)?`)) return
    await Promise.all(selected.map(id => api.delete(`/expenses/${id}/`)))
    toast.success(`Deleted ${selected.length} expense(s)`)
    setSelected([])
    fetchExpenses()
  }

  const exportCSV = async () => {
    const q = categoryFilter ? `?category=${categoryFilter}` : ''
    const res = await api.get(`/expenses/export_csv/${q}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click()
  }

  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
        <div className="flex gap-2">
          {selected.length > 0 && <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100"><Trash2 size={14} /> Delete ({selected.length})</button>}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100"><Download size={14} /> Export</button>
          <button onClick={() => setShowForm(p => !p)} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600"><Plus size={15} /> Add Expense</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoryFilter('')} className={`px-3 py-1.5 rounded-full text-sm ${!categoryFilter ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
        {CATEGORIES.map(c => <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-full text-sm ${categoryFilter === c ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{c}</button>)}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
              <input value={form.vendor} onChange={e => setForm(p => ({ ...p, vendor: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" /></div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.is_billable} onChange={e => setForm(p => ({ ...p, is_billable: e.target.checked }))} className="accent-emerald-500" />
                Billable
              </label>
              <button type="submit" className="ml-auto px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600">Add</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="animate-pulse h-64 bg-white rounded-xl" /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                {['Date', 'Category', 'Vendor', 'Description', 'Amount', 'Billable'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map(exp => (
                <tr key={exp.id} className={`hover:bg-gray-50 ${selected.includes(exp.id) ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(exp.id)} onChange={() => toggleSelect(exp.id)} className="accent-emerald-500" /></td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{exp.category}</span></td>
                  <td className="px-4 py-3 font-medium">{exp.vendor}</td>
                  <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{exp.description}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3">{exp.is_billable ? <span className="text-emerald-600 text-xs font-medium">Billable</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
