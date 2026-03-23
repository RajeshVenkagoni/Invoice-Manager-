import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatCurrency } from '../utils/format'

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0 }

export default function InvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [clients, setClients] = useState([])
  const [form, setForm] = useState({ client: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', status: 'Draft', tax_rate: 0, notes: '' })
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/clients/').then(r => setClients(r.data.results || r.data))
    if (isEdit) {
      api.get(`/invoices/${id}/`).then(r => {
        const d = r.data
        setForm({ client: d.client, issue_date: d.issue_date, due_date: d.due_date, status: d.status, tax_rate: d.tax_rate, notes: d.notes || '' })
        setItems(d.items.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })))
      })
    }
  }, [id])

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0)
  const taxAmount = subtotal * Number(form.tax_rate) / 100
  const total = subtotal + taxAmount

  const validate = () => {
    const errs = {}
    if (!form.client) errs.client = 'Client is required'
    if (!form.due_date) errs.due_date = 'Due date required'
    if (form.due_date && form.due_date < form.issue_date) errs.due_date = 'Due date must be after issue date'
    if (items.length === 0) errs.items = 'At least one item required'
    items.forEach((item, i) => {
      if (!item.description) errs[`item_${i}_desc`] = 'Description required'
      if (Number(item.unit_price) <= 0) errs[`item_${i}_price`] = 'Price must be positive'
    })
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const payload = { ...form, items }
    try {
      if (isEdit) { await api.put(`/invoices/${id}/`, payload); toast.success('Invoice updated') }
      else { await api.post('/invoices/', payload); toast.success('Invoice created') }
      navigate('/invoices')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save invoice')
    } finally { setLoading(false) }
  }

  const updateItem = (i, field, val) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))
  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/invoices" className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700"><ArrowLeft size={15} /> Back</Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold mb-6">{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.client ? 'border-red-400' : 'border-gray-300'}`}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.client && <p className="text-xs text-red-500 mt-1">{errors.client}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 ${errors.due_date ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">Line Items</h3>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
                <Plus size={14} /> Add Item
              </button>
            </div>
            {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>{['Description', 'Qty', 'Unit Price', 'Total', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">
                        <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                          placeholder="Item description"
                          className={`w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 ${errors[`item_${i}_desc`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                          className={`w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 ${errors[`item_${i}_price`] ? 'border-red-400' : 'border-gray-300'}`} />
                      </td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-30"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Tax (%)</span>
                <input type="number" min="0" max="100" step="0.5" value={form.tax_rate}
                  onChange={e => setForm(p => ({ ...p, tax_rate: e.target.value }))}
                  className="w-16 border border-gray-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                <span className="ml-auto font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t pt-2">
                <span>Total</span><span className="text-emerald-700">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
          </div>

          <div className="flex gap-3 justify-end">
            <Link to="/invoices" className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</Link>
            <button type="submit" disabled={loading}
              className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50">
              {loading ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Create Invoice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
