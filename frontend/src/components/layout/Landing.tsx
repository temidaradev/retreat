import { SignInButton } from '@clerk/clerk-react'
import { Receipt, Shield, Clock, Upload } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30 -z-10" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(51, 65, 85) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />
      
      {/* Header - Clean and minimal */}
      <header 
        className="px-phi-lg py-phi flex justify-between items-center relative z-10 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-phi">
          <div 
            className="icon-phi-md rounded-phi-md flex items-center justify-center"
            style={{ background: 'var(--color-accent-500)' }}
          >
            <Receipt className="w-6 h-6" style={{ color: 'white' }} />
          </div>
          <span className="text-phi-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Retreat
          </span>
        </div>
        <SignInButton mode="modal">
          <button 
            className="btn-phi-sm font-medium transition-all duration-200 border hover-lift"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            Sign In
          </button>
        </SignInButton>
      </header>

      {/* Hero Section - Clean hierarchy */}
      <main className="flex-1 flex items-center justify-center px-phi-lg py-phi-xl">
        <div className="w-full max-w-7xl mx-auto text-center flex flex-col items-center">
          {/* Simple badge */}
          <div 
            className="inline-flex items-center gap-phi border rounded-full px-phi py-phi mb-phi-lg"
            style={{
              background: 'var(--color-info-bg)',
              borderColor: 'rgba(96, 165, 250, 0.3)',
              color: 'var(--color-accent-400)'
            }}
          >
            <span className="text-phi-sm font-medium">Automate your receipt management</span>
          </div>

          {/* Clean headline */}
          <h1 
            className="text-phi-2xl md:text-phi-3xl font-extrabold mb-phi-lg"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Never Lose Your
            <br />
            <span style={{ color: 'var(--color-accent-400)' }}>Receipts Again</span>
          </h1>
          
          {/* Subtitle */}
          <p 
            className="text-phi-md md:text-phi-lg mb-phi-xl mx-auto font-light" 
            style={{ 
              maxWidth: 'calc(61.8vw)',
              color: 'var(--color-text-secondary)'
            }}
          >
            Forward purchase emails to{' '}
            <span 
              className="font-semibold"
              style={{ color: 'var(--color-accent-400)' }}
            >
              save@receiptlocker.com
            </span>
            {' '}and we'll automatically extract warranty info, track expiry dates, and send you reminders.
          </p>
          
          {/* CTA Buttons - Accent color ONLY on primary */}
          <div className="flex flex-col sm:flex-row gap-phi justify-center mb-phi-2xl">
            <SignInButton mode="modal">
              <button 
                className="btn-phi-lg font-semibold transition-all duration-200 hover-lift"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                }}
              >
                Get Started Free
              </button>
            </SignInButton>
            <button 
              className="btn-phi-lg border font-semibold transition-all duration-200 hover-lift"
              style={{ 
                background: 'transparent',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              Watch Demo
            </button>
          </div>

          {/* Features Grid - Clean cards */}
          <div className="grid md:grid-cols-3 gap-phi-lg mt-phi-xl max-w-7xl mx-auto">
            {/* Feature Card 1 */}
            <div 
              className="rounded-phi-lg p-phi-xl border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div 
                className="icon-phi-xl rounded-phi-lg flex items-center justify-center mb-phi-lg mx-auto"
                style={{ 
                  background: 'var(--color-info-bg)'
                }}
              >
                <Upload className="w-8 h-8" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <h3 className="text-phi-xl font-bold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                Email Forwarding
              </h3>
              <p className="text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                Simply forward any purchase email to our address and we'll automatically parse it
              </p>
            </div>

            {/* Feature Card 2 */}
            <div 
              className="rounded-phi-lg p-phi-xl border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div 
                className="icon-phi-xl rounded-phi-lg flex items-center justify-center mb-phi-lg mx-auto"
                style={{ 
                  background: 'var(--color-info-bg)'
                }}
              >
                <Shield className="w-8 h-8" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <h3 className="text-phi-xl font-bold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                Warranty Tracking
              </h3>
              <p className="text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                We extract warranty periods and track expiry dates automatically
              </p>
            </div>

            {/* Feature Card 3 */}
            <div 
              className="rounded-phi-lg p-phi-xl border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div 
                className="icon-phi-xl rounded-phi-lg flex items-center justify-center mb-phi-lg mx-auto"
                style={{ 
                  background: 'var(--color-info-bg)'
                }}
              >
                <Clock className="w-8 h-8" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <h3 className="text-phi-xl font-bold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                Smart Reminders
              </h3>
              <p className="text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                Get notified before warranties expire so you can claim them in time
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="px-phi-lg py-phi-xl border-t relative z-10" 
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-phi-md" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Free for 10 receipts</span>
            {' • '}
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>$3/month</span>
            {' for unlimited • '}
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No credit card required</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
