import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, Users, LayoutDashboard, Sparkles } from 'lucide-react'
import useStore, { DEMO_ACCOUNTS } from '../store/useStore'

export default function Login() {
  const { loginAs, setCompany } = useStore()
  const navigate = useNavigate()

  const handleSelect = (accountId) => {
    loginAs(accountId)
    navigate('/dashboard')
  }

  const handleCreateNew = () => {
    navigate('/setup')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-200">
            <LayoutDashboard size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Onboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Employee onboarding, done right.</p>
        </div>

        {/* Account selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Choose a demo account
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.id}
                onClick={() => handleSelect(account.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                  style={{
                    backgroundColor: account.company.primaryColor,
                  }}
                >
                  {account.label.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{account.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        account.badge === 'Sample Data'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {account.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{account.description}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Create new */}
        <button
          onClick={handleCreateNew}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all text-sm font-medium"
        >
          <Sparkles size={16} />
          Set up a new company
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          This is a demo environment. All data resets on page refresh.
        </p>
      </div>
    </div>
  )
}
