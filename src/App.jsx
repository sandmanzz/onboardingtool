import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useStore from './store/useStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import Company from './pages/Company'
import Programs from './pages/Programs'
import ProgramEditor from './pages/ProgramEditor'
import Preview from './pages/Preview'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'

function RequireAuth({ children }) {
  const { isSetupComplete } = useStore()
  if (!isSetupComplete) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { isSetupComplete } = useStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={isSetupComplete ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/setup" element={<Setup />} />

        {/* Full-screen employee preview — no sidebar */}
        <Route
          path="/programs/:id/preview"
          element={<RequireAuth><Preview /></RequireAuth>}
        />

        {/* Admin layout shell — sidebar + main */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/company" element={<Company />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/new" element={<ProgramEditor />} />
          <Route path="/programs/:id" element={<ProgramEditor />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/new" element={<EmployeeDetail />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
