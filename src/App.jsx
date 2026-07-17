import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import Company from './pages/Company'
import Programs from './pages/Programs'
import ProgramEditor from './pages/ProgramEditor'
import Preview from './pages/Preview'
import PublicShare from './pages/PublicShare'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import OwnerDashboard from './pages/OwnerDashboard'
import Performance from './pages/Performance'

function RequireAuth({ children }) {
  const { isSetupComplete, currentUser } = useStore()
  if (!isSetupComplete) return <Navigate to="/" replace />
  if (currentUser?.role === 'owner') return <Navigate to="/owner" replace />
  return children
}

function RequireOwner({ children }) {
  const { currentUser } = useStore()
  if (!currentUser) return <Navigate to="/" replace />
  if (currentUser.role !== 'owner') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { isSetupComplete, currentUser } = useStore()

  const defaultRedirect = currentUser?.role === 'owner' ? '/owner' : '/dashboard'

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={isSetupComplete ? <Navigate to={defaultRedirect} replace /> : <Login />}
        />
        <Route path="/register" element={isSetupComplete ? <Navigate to={defaultRedirect} replace /> : <Register />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/share/:token" element={<PublicShare />} />

        {/* Full-screen employee preview — no sidebar */}
        <Route
          path="/programs/:id/preview"
          element={<RequireAuth><Preview /></RequireAuth>}
        />

        {/* Admin layout shell — sidebar + main */}
        {/* Owner panel — standalone layout */}
        <Route path="/owner" element={<RequireOwner><OwnerDashboard /></RequireOwner>} />

        {/* Admin layout shell — sidebar + main */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/company" element={<Company />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/:id" element={<ProgramEditor />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeDetail />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
