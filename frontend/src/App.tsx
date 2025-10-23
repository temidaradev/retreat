import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Landing from './components/Landing'
import './App.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key')
}

function App() {
  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
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
            </Routes>
          </SignedIn>
        </div>
      </Router>
    </ClerkProvider>
  )
}

export default App