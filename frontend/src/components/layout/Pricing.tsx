import { PricingTable } from '@clerk/clerk-react'
import { ArrowLeft, Check, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Pricing() {
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
        </div>
      </header>

      <main className="px-phi-lg py-phi-xl">
        <div className="max-w-6xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-phi-2xl">
            <div className="flex items-center justify-center gap-phi mb-phi-lg">
              <Star className="w-8 h-8" style={{ color: 'var(--color-accent-500)' }} />
              <h1 className="text-phi-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Choose Your Plan
              </h1>
            </div>
            <p className="text-phi-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
              Unlock premium features to get the most out of your receipt management experience
            </p>
          </div>

          {/* Features Comparison */}
          <div 
            className="rounded-phi-lg border mb-phi-2xl overflow-hidden"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-phi-lg font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
                Feature Comparison
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <th className="text-left p-phi-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Features
                    </th>
                    <th className="text-center p-phi-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Free
                    </th>
                    <th className="text-center p-phi-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Retreat
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Receipt Storage', free: '10 receipts', retreat: 'Unlimited' },
                    { feature: 'Email Forwarding', free: '✓', retreat: '✓' },
                    { feature: 'PDF Upload', free: '✓', retreat: '✓' },
                    { feature: 'Warranty Tracking', free: '✓', retreat: '✓' },
                    { feature: 'Advanced Analytics', free: '✗', retreat: '✓' },
                    { feature: 'Export Data', free: '✗', retreat: '✓' },
                    { feature: 'Priority Support', free: '✗', retreat: '✓' },
                  ].map((row, index) => (
                    <tr 
                      key={index}
                      className="border-b" 
                      style={{ 
                        borderColor: 'var(--color-border)',
                        background: index % 2 === 0 ? 'transparent' : 'var(--color-bg-tertiary)'
                      }}
                    >
                      <td className="p-phi-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {row.feature}
                      </td>
                      <td className="p-phi-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.free === '✓' ? (
                          <Check className="w-5 h-5 mx-auto" style={{ color: 'var(--color-success)' }} />
                        ) : row.free === '✗' ? (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                        ) : (
                          row.free
                        )}
                      </td>
                      <td className="p-phi-lg text-center" style={{ color: 'var(--color-text-secondary)' }}>
                        {row.retreat === '✓' ? (
                          <Check className="w-5 h-5 mx-auto" style={{ color: 'var(--color-success)' }} />
                        ) : row.retreat === '✗' ? (
                          <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
                        ) : (
                          row.retreat
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Table */}
          <div 
            className="rounded-phi-lg border overflow-hidden"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-phi-lg font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
                Select Your Plan
              </h2>
              <p className="text-phi-base text-center mt-phi" style={{ color: 'var(--color-text-secondary)' }}>
                All plans include 0.7% transaction fee + Stripe processing fees
              </p>
            </div>
            
            <div className="p-phi-lg">
              <PricingTable />
            </div>
          </div>

          {/* FAQ Section */}
          <div 
            className="mt-phi-2xl rounded-phi-lg border overflow-hidden"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-phi-lg font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="p-phi-lg space-y-phi-lg">
              {[
                {
                  question: "What payment methods do you accept?",
                  answer: "We accept all major credit cards, debit cards, and digital wallets through Stripe. All payments are processed securely."
                },
                {
                  question: "Can I change my plan anytime?",
                  answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
                },
                {
                  question: "What happens to my data if I cancel?",
                  answer: "Your data remains accessible for 30 days after cancellation. You can export your receipts during this period. After 30 days, data is permanently deleted."
                },
                {
                  question: "Do you offer refunds?",
                  answer: "We offer a 30-day money-back guarantee for all paid plans. Contact support if you're not satisfied with your subscription."
                },
                {
                  question: "Is my data secure?",
                  answer: "Absolutely. We use enterprise-grade encryption, secure cloud storage, and follow industry best practices for data protection and privacy."
                }
              ].map((faq, index) => (
                <div key={index}>
                  <h3 className="text-phi-base font-semibold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                    {faq.question}
                  </h3>
                  <p className="text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
