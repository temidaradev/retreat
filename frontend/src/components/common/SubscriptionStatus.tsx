import { useAuth, UserButton } from '@clerk/clerk-react'
import { Crown, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SubscriptionStatus() {
  const { has, isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="p-phi-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-phi"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const hasRetreatPlan = has({ plan: 'retreat' })
  const currentPlan = hasRetreatPlan ? 'Retreat' : 'Free'
  const planColor = hasRetreatPlan ? 'var(--color-accent-500)' : 'var(--color-text-tertiary)'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header 
        className="border-b"
        style={{ 
          background: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)' 
        }}
      >
        <div className="px-phi-lg py-phi flex justify-between items-center">
          <div className="flex items-center gap-phi">
            <Link 
              to="/"
              className="flex items-center gap-phi text-phi-base hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="px-phi-lg py-phi-xl">
        <div className="max-w-4xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-phi-2xl">
            <div className="flex items-center justify-center gap-phi mb-phi-lg">
              <Crown className="w-8 h-8" style={{ color: 'var(--color-accent-500)' }} />
              <h1 className="text-phi-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Subscription Management
              </h1>
            </div>
            <p className="text-phi-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Manage your subscription and explore premium features
            </p>
          </div>

          <div 
            className="rounded-phi-lg border overflow-hidden"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-phi">
                  <Crown className="w-5 h-5" style={{ color: planColor }} />
                  <h3 className="text-phi-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Subscription Status
                  </h3>
                </div>
                <span 
                  className="px-phi py-phi-sm rounded-full text-phi-sm font-medium"
                  style={{
                    background: hasRetreatPlan ? 'var(--color-success-bg)' : 'var(--color-bg-tertiary)',
                    color: hasRetreatPlan ? 'var(--color-success)' : 'var(--color-text-tertiary)'
                  }}
                >
                  {currentPlan} Plan
                </span>
              </div>
            </div>

            <div className="p-phi-lg">
              {/* Plan Features */}
              <div className="space-y-phi">
                <h4 className="text-phi-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Current Features
                </h4>
                
                <div className="space-y-phi-sm">
                  {[
                    { feature: 'Receipt Storage', free: true, retreat: true },
                    { feature: 'Email Forwarding', free: true, retreat: true },
                    { feature: 'PDF Upload', free: true, retreat: true },
                    { feature: 'Warranty Tracking', free: true, retreat: true },
                    { feature: 'Advanced Analytics', free: false, retreat: true },
                    { feature: 'Export Data', free: false, retreat: true },
                    { feature: 'Priority Support', free: false, retreat: true },
                  ].map((item, index) => {
                    const hasAccess = hasRetreatPlan ? item.retreat : item.free
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.feature}
                        </span>
                        <div className="flex items-center gap-phi">
                          {hasAccess ? (
                            <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                          ) : (
                            <XCircle className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Upgrade CTA */}
              {!hasRetreatPlan && (
                <div className="mt-phi-lg pt-phi-lg border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-center">
                    <h4 className="text-phi-base font-medium mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                      Unlock Premium Features
                    </h4>
                    <p className="text-phi-sm mb-phi-lg" style={{ color: 'var(--color-text-secondary)' }}>
                      Get unlimited receipts, advanced analytics, and more with our Retreat plan
                    </p>
                    <Link
                      to="/pricing"
                      className="inline-flex items-center gap-phi px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium transition-all duration-200 hover-lift"
                      style={{
                        background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <Crown className="w-4 h-4" />
                      View Pricing Plans
                    </Link>
                  </div>
                </div>
              )}

              {/* Billing Information */}
              {hasRetreatPlan && (
                <div className="mt-phi-lg pt-phi-lg border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-center">
                    <h4 className="text-phi-base font-medium mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                      Manage Subscription
                    </h4>
                    <p className="text-phi-sm mb-phi" style={{ color: 'var(--color-text-secondary)' }}>
                      Update your billing information or change your plan
                    </p>
                    <button
                      className="inline-flex items-center gap-phi px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium transition-all duration-200 hover-lift"
                      style={{
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <Clock className="w-4 h-4" />
                      Manage Billing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}