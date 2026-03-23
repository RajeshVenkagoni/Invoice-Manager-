import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatCurrency } from '../utils/format'

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.get('/clients/').then(r => setClients(r.data.results || r.data)).finally(() => setLoading(false)) }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/clients/', form)
      setClients(p => [res.data, ...p])
      toast.success('Client added')
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', company: '', address: '' })
    } catch { toast.error('Failed to create client') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
        <button onClick={() => setShowForm(p => !p)}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-600">
          <Plus size={15} /> Add Client
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['name', 'Name *'], ['email', 'Email *'], ['phone', 'Phone'], ['company', 'Company'], ['address', 'Address']].map(([key, label]) => (
              <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required={key === 'name' || key === 'email'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600">Save Client</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <div className="animate-pulse h-48 bg-white rounded-xl" /> : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['Name', 'Company', 'Email', 'Invoices', 'Revenue', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.company || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3">{c.total_invoices}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{formatCurrency(c.total_revenue)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/invoices?client=${c.id}`} className="text-gray-400 hover:text-emerald-600"><Eye size={14} /></Link>
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
