import { SignInButton } from '@clerk/clerk-react'
import { Receipt, Shield, Clock, Upload } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col gradient-overlay" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-20 -z-10" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(51, 65, 85) 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      {/* Header - Clean and minimal */}
      <header
        className="px-4 md:px-phi-lg py-3 md:py-phi flex justify-between items-center relative z-10 border-b backdrop-blur-modern"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2 md:gap-phi">
          <div
            className="w-8 h-8 md:icon-phi-md rounded-lg md:rounded-phi-md flex items-center justify-center"
            style={{ background: 'var(--color-accent-500)' }}
          >
            <Receipt className="w-4 h-4 md:w-6 md:h-6 text-white" />
          </div>
          <span className="text-base md:text-phi-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Retreat
          </span>
        </div>
        <SignInButton mode="modal">
          <button
            className="px-4 md:px-phi py-2 md:py-phi-sm text-sm md:text-phi-sm rounded-full md:rounded-phi-md font-medium transition-all duration-200 border hover-lift"
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
      <main className="flex-1 flex items-center justify-center px-4 md:px-phi-lg py-8 md:py-phi-xl">
        <div className="w-full max-w-7xl mx-auto text-center flex flex-col items-center">
          {/* Simple badge */}
          <div
            className="inline-flex items-center gap-2 md:gap-phi border rounded-full px-3 md:px-phi py-2 md:py-phi mb-4 md:mb-phi-lg animate-fade-in"
            style={{
              background: 'var(--color-info-bg)',
              borderColor: 'rgba(96, 165, 250, 0.3)',
              color: 'var(--color-accent-400)'
            }}
          >
            <span className="text-xs md:text-phi-sm font-medium">Automate your receipt management</span>
          </div>

          {/* Clean headline */}
          <h1
            className="text-3xl sm:text-4xl md:text-phi-2xl lg:text-phi-3xl font-extrabold mb-4 md:mb-phi-lg animate-fade-in stagger-1 px-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Never Lose Your
            <br />
            <span className="bg-accent-gradient bg-clip-text text-transparent">Receipts Again</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm sm:text-base md:text-phi-md lg:text-phi-lg mb-6 md:mb-phi-xl mx-auto font-light animate-fade-in stagger-2 px-4"
            style={{
              maxWidth: '90%',
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
          <div className="flex flex-col sm:flex-row gap-3 md:gap-phi justify-center mb-8 md:mb-phi-2xl w-full max-w-md animate-fade-in stagger-3">
            <SignInButton mode="modal">
              <button
                className="w-full sm:w-auto px-6 md:px-phi-xl py-3 md:py-phi text-sm md:text-phi-md rounded-full font-semibold transition-all duration-200 hover-lift bg-accent-gradient shadow-accent-glow text-white"
              >
                Get Started Free
              </button>
            </SignInButton>
            <button
              className="w-full sm:w-auto px-6 md:px-phi-xl py-3 md:py-phi text-sm md:text-phi-md rounded-full border font-semibold transition-all duration-200 hover-lift"
              style={{
                background: 'transparent',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              Watch Demo
            </button>
          </div>

          {/* Features Grid - Modern cards */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-phi-lg mt-8 md:mt-phi-xl max-w-7xl mx-auto w-full px-4">
            {/* Feature Card 1 */}
            <div
              className="card-modern p-6 md:p-phi-xl animate-fade-in stagger-1"
            >
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-4 md:mb-phi-lg mx-auto"
                style={{
                  background: 'var(--color-info-bg)'
                }}
              >
                <Upload className="w-7 h-7 md:w-8 md:h-8" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <h3 className="text-lg md:text-phi-xl font-bold mb-2 md:mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                Email Forwarding
              </h3>
              <p className="text-sm md:text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                Simply forward any purchase email to our address and we'll automatically parse it
              </p>
            </div>

            {/* Feature Card 2 */}
            <div
              className="card-modern p-6 md:p-phi-xl animate-fade-in stagger-2"
            >
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-4 md:mb-phi-lg mx-auto"
                style={{
                  background: 'var(--color-info-bg)'
                }}
              >
                <Shield className="w-7 h-7 md:w-8 md:h-8" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <h3 className="text-lg md:text-phi-xl font-bold mb-2 md:mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                Warranty Tracking
              </h3>
              <p className="text-sm md:text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                We extract warranty periods and track expiry dates automatically
              </p>
            </div>

            {/* Feature Card 3 */}
            <div
              className="card-modern p-6 md:p-phi-xl animate-fade-in stagger-3 sm:col-span-2 md:col-span-1"
            >
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center mb-4 md:mb-phi-lg mx-auto"
                style={{
                  background: 'var(--color-info-bg)'
                }}
              >
                <Clock className="w-7 h-7 md:w-8 md:h-8" style={{ color: 'var(--color-accent-400)' }} />
              </div>
              <h3 className="text-lg md:text-phi-xl font-bold mb-2 md:mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                Smart Reminders
              </h3>
              <p className="text-sm md:text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                Get notified before warranties expire so you can claim them in time
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 md:px-phi-lg py-6 md:py-phi-xl border-t relative z-10"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-sm md:text-phi-md" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Free to use</span>
            {' • '}
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Support us on Buy Me a Coffee</span>
            {' for unlimited receipts • '}
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>No credit card required</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
