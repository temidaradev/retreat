import { useState, useEffect, useRef } from 'react'
import { Check, X, Heart, Clock, ExternalLink, Upload } from 'lucide-react'
import { apiService, type SponsorshipStatus } from '../../services/api'
import { SPONSORSHIP_STATUS } from '../../constants'
import { external } from '../../config'

interface SponsorshipModalProps {
  isOpen: boolean
  onClose: () => void
  onSponsorshipChange: () => void
}

export default function SponsorshipModal({ 
  isOpen, 
  onClose, 
  onSponsorshipChange 
}: SponsorshipModalProps) {
  const [sponsorshipStatus, setSponsorshipStatus] = useState<SponsorshipStatus | null>(null)
  const [username, setUsername] = useState('')
  const [proof, setProof] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadSponsorshipData()
    }
  }, [isOpen])

  const loadSponsorshipData = async () => {
    try {
      const status = await apiService.getSponsorshipStatus()
      setSponsorshipStatus(status)
    } catch (err) {
      console.error('Error loading sponsorship data:', err)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleVerificationRequest = async () => {
    if (!username.trim()) {
      setError('Please enter your username')
      return
    }

    if (!selectedFile && !proof.trim()) {
      setError('Please provide either a screenshot or proof text')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('platform', 'buymeacoffee')
      formData.append('username', username.trim())
      if (proof.trim()) {
        formData.append('proof', proof.trim())
      }
      if (selectedFile) {
        formData.append('screenshot', selectedFile)
      }

      await apiService.requestSponsorshipVerification(formData)
      
      onSponsorshipChange()
      onClose()
      alert('Verification request submitted! You\'ll receive an email once verified.')
    } catch (err) {
      setError('Failed to submit verification request. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case SPONSORSHIP_STATUS.ACTIVE:
        return <Check className="w-4 h-4 text-green-500" />
      case SPONSORSHIP_STATUS.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />
      case SPONSORSHIP_STATUS.EXPIRED:
        return <X className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div 
        className="rounded-lg border w-full max-w-2xl mx-auto shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" style={{ color: 'var(--color-accent-500)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Verify Purchase
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Current Status */}
          {sponsorshipStatus && sponsorshipStatus.status !== SPONSORSHIP_STATUS.NONE && (
            <div className="mb-6 p-4 rounded-lg border" style={{ 
              background: 'var(--color-bg-primary)', 
              borderColor: 'var(--color-border)' 
            }}>
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(sponsorshipStatus.status)}
                <span className="font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>
                  Status: {sponsorshipStatus.status}
                </span>
              </div>
              {sponsorshipStatus.message && (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {sponsorshipStatus.message}
                </p>
              )}
            </div>
          )}

          {/* Purchase Section for Non-Supporters */}
          {(!sponsorshipStatus || sponsorshipStatus.status === SPONSORSHIP_STATUS.NONE) && (
            <div className="mb-6 p-4 rounded-lg border" style={{ 
              background: 'var(--color-bg-primary)', 
              borderColor: 'var(--color-border)' 
            }}>
              <div className="text-center">
                <Heart className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-accent-500)' }} />
                <h4 className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Support Retreat Development
                </h4>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Help us continue building amazing features by supporting us on Buy Me a Coffee.
                </p>
                <button
                  onClick={() => window.open(external.buyMeACoffee, '_blank')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 hover-lift"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Heart className="w-4 h-4" />
                  Support on Buy Me a Coffee
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Verification Form */}
          <div className="mb-6">
            <h4 className="font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Verify Your Purchase
            </h4>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Already purchased Retreat? Submit your purchase proof to get premium access.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    background: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  placeholder="Your Buy Me a Coffee username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Screenshot Upload
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: 'var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      Choose Screenshot
                    </button>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {filePreview && (
                    <div className="mt-3">
                      <img
                        src={filePreview}
                        alt="Screenshot preview"
                        className="max-w-full max-h-48 rounded-md border"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Additional Proof (Optional)
                </label>
                <textarea
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    background: 'var(--color-bg-primary)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                  placeholder="Transaction ID, order number, or any additional proof..."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md mb-4" style={{ background: 'var(--color-danger-bg)' }}>
              <span className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border rounded-md font-medium transition-all duration-200"
              style={{
                borderColor: 'var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text-primary)'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleVerificationRequest}
              disabled={loading || !username.trim()}
              className="flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                color: 'white',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
              }}
            >
              {loading ? 'Submitting...' : 'Request Verification'}
            </button>
          </div>
          <div className="mt-6 p-4 rounded-lg text-center" style={{ background: 'var(--color-info-bg)' }}>
            <Heart className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-accent-500)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Thank you for supporting Retreat! Your verification helps us provide better service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
