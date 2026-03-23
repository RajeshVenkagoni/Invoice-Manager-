import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-emerald-500 mb-4">404</h1>
        <p className="text-gray-500 mb-6">Page not found</p>
        <Link to="/dashboard" className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-600">Back to Dashboard</Link>
      </div>
    </div>
  )
}
