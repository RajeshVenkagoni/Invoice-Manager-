import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Send, CheckCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatDate, formatCurrency } from '../utils/format'

const STATUS_BADGE = {
  Draft: 'bg-gray-100 text-gray-700', Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700', Overdue: 'bg-red-100 text-red-700'
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)

  useEffect(() => { api.get(`/invoices/${id}/`).then(r => setInvoice(r.data)) }, [id])

  const handleMarkSent = async () => {
    await api.post(`/invoices/${id}/mark-sent/`)
    toast.success('Marked as sent'); setInvoice(p => ({ ...p, status: 'Sent' }))
  }
  const handleMarkPaid = async () => {
    await api.post(`/invoices/${id}/mark-paid/`)
    toast.success('Marked as paid'); setInvoice(p => ({ ...p, status: 'Paid' }))
  }
  const handleDelete = async () => {
    if (!confirm('Delete invoice?')) return
    await api.delete(`/invoices/${id}/`); toast.success('Deleted'); navigate('/invoices')
  }
  const downloadPDF = async () => {
    const res = await api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a'); a.href = url; a.download = `${invoice.invoice_number}.pdf`; a.click()
  }

  if (!invoice) return <div className="animate-pulse h-64 bg-white rounded-xl" />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/invoices" className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700"><ArrowLeft size={15} /> Back</Link>
        <div className="flex gap-2">
          {invoice.status === 'Draft' && <button onClick={handleMarkSent} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"><Send size={13} /> Send</button>}
          {invoice.status === 'Sent' && <button onClick={handleMarkPaid} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100"><CheckCircle size={13} /> Mark Paid</button>}
          <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100"><Download size={13} /> PDF</button>
          <Link to={`/invoices/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm hover:bg-emerald-100"><Pencil size={13} /> Edit</Link>
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-sm hover:bg-red-100"><Trash2 size={13} /> Delete</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-gray-500 mt-1">{invoice.invoice_number}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_BADGE[invoice.status] || 'bg-gray-100'}`}>{invoice.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-2">Bill To</p>
            <p className="font-semibold text-gray-900">{invoice.client_name}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-8"><span className="text-gray-500">Issue Date</span><span>{formatDate(invoice.issue_date)}</span></div>
              <div className="flex justify-between gap-8"><span className="text-gray-500">Due Date</span><span>{formatDate(invoice.due_date)}</span></div>
              {invoice.paid_date && <div className="flex justify-between gap-8"><span className="text-gray-500">Paid</span><span className="text-green-600">{formatDate(invoice.paid_date)}</span></div>}
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead className="bg-gray-50 rounded-lg">
            <tr>{['Description', 'Qty', 'Unit Price', 'Total'].map(h => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoice.items?.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-gray-500">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-56 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax ({invoice.tax_rate}%)</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
            <div className="flex justify-between border-t pt-2 font-bold text-base">
              <span>Total</span><span className="text-emerald-700">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && <div className="mt-6 pt-6 border-t border-gray-100"><p className="text-sm text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700">{invoice.notes}</p></div>}
      </div>
    </div>
  )
}
