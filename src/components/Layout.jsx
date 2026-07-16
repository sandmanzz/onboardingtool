import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  Users,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import useStore from '../store/useStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/programs', icon: BookOpen, label: 'Programs' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/company', icon: Building2, label: 'Company Profile' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { company, logout } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* App brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-sm tracking-tight">Onboard</span>
      </div>

      {/* Company chip */}
      {company && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {company.logo ? (
              <img src={company.logo} className="w-8 h-8 rounded-lg object-cover" alt="" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: company.primaryColor || '#4f5fff' }}
              >
                {company.name?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{company.name}</p>
              <p className="text-xs text-gray-400 truncate">{company.industry}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => (isActive ? 'sidebar-item-active' : 'sidebar-item')}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={handleLogout} className="sidebar-item w-full">
          <LogOut size={17} />
          Switch Account
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 h-full">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <X size={18} className="text-gray-500" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <LayoutDashboard size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">Onboard</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  )
}
