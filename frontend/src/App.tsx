import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { DashboardLayout } from './components/DashboardLayout'

// Lazy load pages for performance
const Overview = lazy(() => import('./pages/Overview').then(m => ({ default: m.Overview })))
const Embed    = lazy(() => import('./pages/Embed').then(m => ({ default: m.Embed })))
const Extract  = lazy(() => import('./pages/Extract').then(m => ({ default: m.Extract })))
const Analyze  = lazy(() => import('./pages/Analyze').then(m => ({ default: m.Analyze })))
const Batch    = lazy(() => import('./pages/Batch').then(m => ({ default: m.Batch })))
const Admin    = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })))
const Support  = lazy(() => import('./pages/Support').then(m => ({ default: m.Support })))

const TRANSITION = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
const TOOL_PATHS = ['/embed', '/extract', '/analyze', '/batch', '/admin', '/support']

function AnimatedRoutes() {
  const location = useLocation()
  const isToolPage = TOOL_PATHS.includes(location.pathname)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={TRANSITION}
        className={`h-full ${isToolPage ? 'p-3' : ''}`}
      >
        <Suspense fallback={null}>
          <Routes location={location}>
            <Route path="/" element={<Overview />} />
            <Route path="/embed" element={<Embed />} />
            <Route path="/extract" element={<Extract />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/batch" element={<Batch />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Router>
      <DashboardLayout>
        <AnimatedRoutes />
      </DashboardLayout>
    </Router>
  )
}

export default App
