import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from './components/DashboardLayout'

// Lazy load pages for performance
const Overview = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })))
const Embed    = lazy(() => import('./pages/Embed').then(m => ({ default: m.Embed })))
const Extract  = lazy(() => import('./pages/Extract').then(m => ({ default: m.Extract })))
const Analyze  = lazy(() => import('./pages/Analyze').then(m => ({ default: m.Analyze })))
const Batch    = lazy(() => import('./pages/Batch').then(m => ({ default: m.Batch })))
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Support = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })));

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/embed" element={<Embed />} />
            <Route path="/extract" element={<Extract />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/batch" element={<Batch />} />
            <Route path="/admin" element={<Admin />} />
        <Route path="/support" element={<Support />} />
          </Routes>
        </Suspense>
      </DashboardLayout>
    </Router>
  )
}

export default App
