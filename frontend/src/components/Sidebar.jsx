import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, CreditCard, BarChart3, LogOut, DollarSign } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/expenses', icon: CreditCard, label: 'Expenses' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 flex items-center gap-2 border-b border-gray-100">
        <div className="bg-emerald-500 p-1.5 rounded-lg"><DollarSign className="text-white" size={20} /></div>
        <span className="font-bold text-lg text-gray-900">InvoicePro</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 text-sm text-gray-600 font-medium truncate">{user?.username}</div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  )
}
