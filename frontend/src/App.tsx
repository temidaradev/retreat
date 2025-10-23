import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import Landing from './components/Landing'
import './App.css'

// Get Clerk publishable key from environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Better error handling for missing Clerk key
if (!clerkPubKey) {
  console.error('Missing Clerk Publishable Key')
  console.error('Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables')
  
  // In production, show a more user-friendly error
  if (import.meta.env.PROD) {
    throw new Error('Authentication service is not configured. Please contact support.')
  } else {
    throw new Error('Missing Clerk Publishable Key. Please check your environment variables.')
  }
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