import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/DashboardLayout'
import { Overview } from './pages/Overview'
import { Embed } from './pages/Embed'
import { Extract } from './pages/Extract'
import { Analyze } from './pages/Analyze'
import { Batch } from './pages/Batch'
import { Admin } from './pages/Admin'

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/embed" element={<Embed />} />
          <Route path="/extract" element={<Extract />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/batch" element={<Batch />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </DashboardLayout>
    </Router>
  )
}

export default App
