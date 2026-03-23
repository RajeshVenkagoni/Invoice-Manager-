import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, Send, CheckCircle, Eye, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatDate, formatCurrency } from '../utils/format'

const STATUS_BADGE = {
  Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700', Overdue: 'bg-red-100 text-red-700', Cancelled: 'bg-gray-100 text-gray-500'
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchInvoices = async () => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    const res = await api.get(`/invoices/${params}`)
    setInvoices(res.data.results || [])
    setLoading(false)
  }

  useEffect(() => { fetchInvoices() }, [statusFilter])

  const handleMarkSent = async (id) => {
    await api.post(`/invoices/${id}/mark-sent/`)
    toast.success('Invoice marked as sent')
    fetchInvoices()
  }

  const handleMarkPaid = async (id) => {
    await api.post(`/invoices/${id}/mark-paid/`)
    toast.success('Invoice marked as paid')
    fetchInvoices()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete invoice?')) return
    await api.delete(`/invoices/${id}/`)
    toast.success('Deleted')
    fetchInvoices()
  }

  const downloadPDF = async (id, num) => {
    const res = await api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `${num}.pdf`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
        <Link to="/invoices/new" className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600">
          <Plus size={15} /> New Invoice
        </Link>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['', 'Draft', 'Sent', 'Paid', 'Overdue'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? <div className="animate-pulse h-64 bg-white rounded-xl" /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Invoice #', 'Client', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">No invoices found</td></tr> :
                invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-emerald-700 font-medium">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-700">{inv.client_name}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/invoices/${inv.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="View"><Eye size={14} /></Link>
                        <Link to={`/invoices/${inv.id}/edit`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Edit"><Pencil size={14} /></Link>
                        {inv.status === 'Draft' && <button onClick={() => handleMarkSent(inv.id)} className="p-1.5 hover:bg-blue-50 rounded text-blue-500" title="Mark Sent"><Send size={14} /></button>}
                        {inv.status === 'Sent' && <button onClick={() => handleMarkPaid(inv.id)} className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Mark Paid"><CheckCircle size={14} /></button>}
                        <button onClick={() => downloadPDF(inv.id, inv.invoice_number)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500" title="Download PDF"><Download size={14} /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
