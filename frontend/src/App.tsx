import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/layout/Dashboard'
import Landing from './components/layout/Landing'
import Pricing from './components/layout/Pricing'
import SubscriptionStatus from './components/common/SubscriptionStatus'
import { clerk, validateConfig } from './config'
import './App.css'

// Validate configuration on startup
validateConfig()

function App() {
  return (
    <ClerkProvider 
      publishableKey={clerk.publishableKey}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#3b82f6',
        }
      }}
    >
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <SignedOut>
            <Landing />
          </SignedOut>
          <SignedIn>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription" element={<SubscriptionStatus />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </SignedIn>
        </div>
      </Router>
    </ClerkProvider>
  )
}

export default App