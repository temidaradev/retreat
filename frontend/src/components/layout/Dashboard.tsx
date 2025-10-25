import { UserButton, useAuth } from '@clerk/clerk-react'
import { Plus, Receipt, Calendar, AlertTriangle, Upload, Search, TrendingUp, Crown, Lock, ExternalLink } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiService, type ReceiptData } from '../../services/api'

export default function Dashboard() {
  const { has, getToken } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [emailText, setEmailText] = useState('')
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Premium features access control
  const hasRetreatPlan = has?.({ plan: 'retreat' }) ?? false
  const hasAdvancedAnalytics = has?.({ feature: 'advanced_analytics' }) ?? false
  const hasExportData = has?.({ feature: 'export_data' }) ?? false
  const hasApiAccess = has?.({ feature: 'api_access' }) ?? false
  
  // Free plan limits
  const FREE_PLAN_LIMIT = 10
  const isAtFreeLimit = !hasRetreatPlan && receipts.length >= FREE_PLAN_LIMIT

  useEffect(() => {
    loadReceipts()
  }, [])


  const loadReceipts = async () => {
    try {
      setLoading(true)
      // Get the Clerk authentication token
      const token = await getToken()
      apiService.setAuthToken(token)
      
      const response = await apiService.getReceipts()
      setReceipts(response.receipts || [])
    } catch (err) {
      setError('Failed to load receipts')
      console.error('Error loading receipts:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredReceipts = (receipts || []).filter(receipt =>
    receipt.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.store.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': 
        return { bg: 'var(--color-success-bg)', text: 'var(--color-success)', border: 'rgba(34, 197, 94, 0.3)' }
      case 'expiring': 
        return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning)', border: 'rgba(245, 158, 11, 0.3)' }
      case 'expired': 
        return { bg: 'var(--color-danger-bg)', text: 'var(--color-danger)', border: 'rgba(239, 68, 68, 0.3)' }
      default: 
        return { bg: 'rgba(148, 163, 184, 0.1)', text: 'var(--color-text-tertiary)', border: 'rgba(148, 163, 184, 0.3)' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expiring': return <AlertTriangle className="w-4 h-4" />
      case 'expired': return <AlertTriangle className="w-4 h-4" />
      default: return <Receipt className="w-4 h-4" />
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
        setEmailText('') // Clear email text when file is selected
      } else {
        alert('Please select a PDF file')
      }
    }
  }

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click()
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setEmailText('') // Clear email text when file is dropped
    } else {
      alert('Please drop a PDF file')
    }
  }

  const handleProcessReceipt = async () => {
    if (!selectedFile && !emailText.trim()) {
      alert('Please upload a PDF file or paste email text')
      return
    }

    setProcessing(true)
    try {
      // Get the Clerk authentication token
      const token = await getToken()
      apiService.setAuthToken(token)
      
      let parsedData;
      
      if (selectedFile) {
        // Convert file to base64
        const base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Remove data:application/pdf;base64, prefix
            const base64 = result.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(selectedFile)
        })

        // Parse PDF
        const response = await apiService.parsePDF(base64Content)
        parsedData = response.parsed_data
      } else {
        // Parse email
        const response = await apiService.parseEmail(emailText)
        parsedData = response.parsed_data
      }

      // Create receipt with parsed data
      const receiptData = {
        store: parsedData.store || 'Unknown Store',
        item: parsedData.item || 'Unknown Item',
        purchase_date: parsedData.purchase_date,
        warranty_expiry: parsedData.warranty_expiry,
        amount: parsedData.amount || 0,
        currency: parsedData.currency || 'USD',
        original_email: selectedFile ? `PDF: ${selectedFile.name}` : emailText
      }

      await apiService.createReceipt(receiptData)
      
      // Refresh receipts list
      await loadReceipts()
      
      // Close modal and reset form
      setShowUploadModal(false)
      resetUploadForm()
      
      alert('Receipt processed successfully!')
    } catch (error) {
      console.error('Error processing receipt:', error)
      alert('Failed to process receipt. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const resetUploadForm = () => {
    setSelectedFile(null)
    setEmailText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
            <div 
              className="icon-phi-md rounded-phi-md flex items-center justify-center"
              style={{ background: 'var(--color-accent-500)' }}
            >
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="text-phi-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Retreat
            </span>
            {hasRetreatPlan && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ background: 'var(--color-accent-500)', color: 'white' }}>
                <Crown className="w-3 h-3" />
                Retreat
              </div>
            )}
          </div>
          <div className="flex items-center gap-phi">
            {!hasRetreatPlan && (
              <Link
                to="/pricing"
                className="flex items-center gap-phi px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium transition-all duration-200 hover-lift"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Crown className="w-4 h-4" />
                Upgrade
              </Link>
            )}
            <a 
              href="https://www.buymeacoffee.com/temidaradev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img 
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=temidaradev&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" 
                alt="Buy me a coffee"
                className="h-8"
              />
            </a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="px-phi-lg py-phi-xl">
        <div className="max-w-7xl mx-auto w-full">
          {/* Free Plan Limit Warning or Progress */}
          {!hasRetreatPlan && (
            <div 
              className="rounded-phi-lg p-phi-lg border mb-phi-lg"
              style={{
                background: isAtFreeLimit ? 'var(--color-warning-bg)' : 'var(--color-info-bg)',
                borderColor: isAtFreeLimit ? 'var(--color-warning)' : 'var(--color-accent-500)',
                borderWidth: '2px'
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-phi">
                <div className="flex items-center gap-phi flex-1">
                  {isAtFreeLimit ? (
                    <Lock className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
                  ) : (
                    <Receipt className="w-5 h-5" style={{ color: 'var(--color-accent-500)' }} />
                  )}
                  <div className="flex-1">
                    <h3 className="text-phi-base font-semibold" style={{ color: isAtFreeLimit ? 'var(--color-warning)' : 'var(--color-accent-500)' }}>
                      {isAtFreeLimit ? 'Free Plan Limit Reached' : 'Free Plan'}
                    </h3>
                    <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {isAtFreeLimit 
                        ? `You've reached the ${FREE_PLAN_LIMIT} receipt limit. Upgrade to Retreat for unlimited receipts.`
                        : `You have ${FREE_PLAN_LIMIT - receipts.length} receipt${FREE_PLAN_LIMIT - receipts.length !== 1 ? 's' : ''} remaining. Upgrade for unlimited receipts and premium features.`
                      }
                    </p>
                    
                    {/* Progress bar */}
                    {!isAtFreeLimit && (
                      <div className="mt-phi-sm">
                        <div 
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(148, 163, 184, 0.2)' }}
                        >
                          <div 
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${(receipts.length / FREE_PLAN_LIMIT) * 100}%`,
                              background: receipts.length >= FREE_PLAN_LIMIT * 0.8 
                                ? 'var(--color-warning)' 
                                : 'var(--color-accent-500)'
                            }}
                          />
                        </div>
                        <p className="text-phi-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          {receipts.length} of {FREE_PLAN_LIMIT} receipts used
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="flex items-center gap-phi px-phi py-phi-sm rounded-phi-md text-phi-sm font-medium transition-all duration-200 hover-lift whitespace-nowrap"
                  style={{
                    background: isAtFreeLimit ? 'var(--color-warning)' : 'var(--color-accent-500)',
                    color: 'white'
                  }}
                >
                  <Crown className="w-4 h-4" />
                  {isAtFreeLimit ? 'Upgrade Now' : 'View Plans'}
                </Link>
              </div>
            </div>
          )}


          {/* Stats Cards - Minimal with subtle backgrounds */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-phi-lg mb-phi-xl">
            <div 
              className="rounded-phi-lg p-phi-lg border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-phi-sm mb-phi" style={{ color: 'var(--color-text-tertiary)' }}>
                    Total Receipts
                  </p>
                  <p className="text-phi-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {receipts.length}
                  </p>
                </div>
                <Receipt 
                  className="icon-phi-md opacity-50" 
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            </div>
            
            <div 
              className="rounded-phi-lg p-phi-lg border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-phi-sm mb-phi" style={{ color: 'var(--color-text-tertiary)' }}>
                    Active Warranties
                  </p>
                  <p className="text-phi-xl font-bold" style={{ color: 'var(--color-success)' }}>
                    {receipts.filter(r => r.status === 'active').length}
                  </p>
                </div>
                <Calendar 
                  className="icon-phi-md opacity-50" 
                  style={{ color: 'var(--color-success)' }}
                />
              </div>
            </div>

            <div 
              className="rounded-phi-lg p-phi-lg border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-phi-sm mb-phi" style={{ color: 'var(--color-text-tertiary)' }}>
                    Expiring Soon
                  </p>
                  <p className="text-phi-xl font-bold" style={{ color: 'var(--color-warning)' }}>
                    {receipts.filter(r => r.status === 'expiring').length}
                  </p>
                </div>
                <AlertTriangle 
                  className="icon-phi-md opacity-50" 
                  style={{ color: 'var(--color-warning)' }}
                />
              </div>
            </div>

            <div 
              className="rounded-phi-lg p-phi-lg border transition-all duration-200 hover-lift"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-phi-sm mb-phi" style={{ color: 'var(--color-text-tertiary)' }}>
                    Total Value
                  </p>
                  <p className="text-phi-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ${receipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp 
                  className="icon-phi-md opacity-50" 
                  style={{ color: 'var(--color-text-tertiary)' }}
                />
              </div>
            </div>
          </div>

          {/* Premium Features Section */}
          {(hasAdvancedAnalytics || hasExportData || hasApiAccess) && (
            <div 
              className="rounded-phi-lg border mb-phi-xl overflow-hidden"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-phi">
                  <Crown className="w-5 h-5" style={{ color: 'var(--color-accent-500)' }} />
                  <h2 className="text-phi-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Premium Features
                  </h2>
                </div>
              </div>
              
              <div className="p-phi-lg">
                <div className="grid md:grid-cols-3 gap-phi-lg">
                  {hasAdvancedAnalytics && (
                    <div className="text-center">
                      <div 
                        className="icon-phi-xl rounded-phi-lg flex items-center justify-center mx-auto mb-phi"
                        style={{ background: 'var(--color-accent-500)' }}
                      >
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-phi-base font-semibold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                        Advanced Analytics
                      </h3>
                      <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Detailed insights into your spending patterns and warranty trends
                      </p>
                    </div>
                  )}
                  
                  {hasExportData && (
                    <div className="text-center">
                      <div 
                        className="icon-phi-xl rounded-phi-lg flex items-center justify-center mx-auto mb-phi"
                        style={{ background: 'var(--color-success)' }}
                      >
                        <ExternalLink className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-phi-base font-semibold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                        Export Data
                      </h3>
                      <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Export your receipts and data in CSV, PDF, or JSON formats
                      </p>
                    </div>
                  )}
                  
                  {hasApiAccess && (
                    <div className="text-center">
                      <div 
                        className="icon-phi-xl rounded-phi-lg flex items-center justify-center mx-auto mb-phi"
                        style={{ background: 'var(--color-warning)' }}
                      >
                        <ExternalLink className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-phi-base font-semibold mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                        API Access
                      </h3>
                      <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Integrate with your existing systems using our REST API
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-phi mb-phi-lg items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10" 
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border focus-ring transition-all duration-200 pl-12 pr-4"
                style={{ 
                  height: 'var(--input-height-sm)',
                  fontSize: 'var(--text-sm)',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
            
            {/* Show appropriate button based on plan and receipt count */}
            <div className="flex items-center gap-phi">
              {/* Receipt count indicator for free users */}
              {!hasRetreatPlan && (
                <div className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-medium" style={{ color: receipts.length >= FREE_PLAN_LIMIT ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                    {receipts.length}/{FREE_PLAN_LIMIT}
                  </span> receipts
                </div>
              )}
              
              {/* Show "Upgrade to Add More" only when at limit */}
              {isAtFreeLimit ? (
                <Link
                  to="/pricing"
                  className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-phi whitespace-nowrap border-0"
                  style={{
                    height: 'var(--input-height-sm)',
                    minWidth: 'auto',
                    padding: '0 var(--space-lg)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Lock className="w-5 h-5" />
                  <span>Upgrade to Add More</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-phi whitespace-nowrap border-0"
                  style={{
                    height: 'var(--input-height-sm)',
                    minWidth: 'auto',
                    padding: '0 var(--space-lg)',
                    fontSize: 'var(--text-sm)',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Receipt</span>
                </button>
              )}
            </div>
          </div>

          {/* Receipts List */}
          <div 
            className="rounded-phi-lg border overflow-hidden"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-phi-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Your Receipts
              </h2>
            </div>
            
            {loading ? (
              <div className="p-phi-xl text-center">
                <div 
                  className="animate-spin rounded-full h-phi-icon w-phi-icon border-b-2 mx-auto"
                  style={{ borderColor: 'var(--color-accent-500)' }}
                ></div>
                <p className="mt-phi text-phi-base" style={{ color: 'var(--color-text-secondary)' }}>
                  Loading receipts...
                </p>
              </div>
            ) : error ? (
              <div className="p-phi-xl text-center">
                <p className="text-phi-base" style={{ color: 'var(--color-danger)' }}>{error}</p>
                <button 
                  onClick={loadReceipts}
                  className="mt-phi text-phi-base hover:underline"
                  style={{ color: 'var(--color-accent-400)' }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                {filteredReceipts.length === 0 ? (
                  <div className="p-phi-xl text-center">
                    <Receipt 
                      className="w-phi-2xl h-phi-2xl mx-auto mb-phi" 
                      style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
                    />
                    <p className="text-phi-md" style={{ color: 'var(--color-text-secondary)' }}>
                      No receipts found
                    </p>
                    <p className="text-phi-sm mt-phi" style={{ color: 'var(--color-text-tertiary)' }}>
                      Add your first receipt to get started
                    </p>
                  </div>
                ) : (
                  filteredReceipts.map((receipt, index) => (
                    <div 
                      key={receipt.id} 
                      className="p-phi-lg transition-all duration-200"
                      style={{ 
                        borderTop: index > 0 ? `1px solid var(--color-border)` : 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-phi">
                        <div className="flex items-center gap-phi">
                          <div 
                            className="icon-phi-xl rounded-phi-lg flex items-center justify-center border"
                            style={{ 
                              background: 'var(--color-bg-primary)',
                              borderColor: 'var(--color-border)'
                            }}
                          >
                            <Receipt className="w-8 h-8" style={{ color: 'var(--color-text-tertiary)' }} />
                          </div>
                          <div>
                            <h3 className="text-phi-md font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                              {receipt.item}
                            </h3>
                            <p className="text-phi-base mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                              {receipt.store}
                            </p>
                            <p className="text-phi-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                              Purchased: {new Date(receipt.purchase_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-phi mb-phi">
                            {(() => {
                              const style = getStatusStyle(receipt.status);
                              return (
                                <span 
                                  className="px-phi py-phi rounded-full text-phi-xs font-medium flex items-center gap-phi border"
                                  style={{
                                    background: style.bg,
                                    color: style.text,
                                    borderColor: style.border
                                  }}
                                >
                                  {getStatusIcon(receipt.status)}
                                  <span className="capitalize">{receipt.status}</span>
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-phi-md font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            ${receipt.amount}
                          </p>
                          <p className="text-phi-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            Warranty expires: {new Date(receipt.warranty_expiry).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Upload Instructions */}
          <div 
            className="mt-phi-xl rounded-phi-lg p-phi-xl border"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <h3 className="text-phi-md font-semibold mb-phi-lg" style={{ color: 'var(--color-text-primary)' }}>
              How to Add Receipts
            </h3>
            <div className="grid md:grid-cols-2 gap-phi-lg">
              <div>
                <h4 className="font-medium text-phi-base mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                  Email Forwarding (Recommended)
                </h4>
                <p className="text-phi-sm mb-phi" style={{ color: 'var(--color-text-secondary)' }}>
                  Forward any purchase email to:
                </p>
                <code 
                  className="px-phi py-phi rounded-phi-sm text-phi-sm inline-block font-mono"
                  style={{
                    background: 'var(--color-info-bg)',
                    color: 'var(--color-accent-400)',
                    border: '1px solid rgba(96, 165, 250, 0.3)'
                  }}
                >
                  save@receiptlocker.com
                </code>
              </div>
              <div>
                <h4 className="font-medium text-phi-base mb-phi" style={{ color: 'var(--color-text-primary)' }}>
                  Manual Upload
                </h4>
                <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Upload PDF receipts or paste email text manually using the "Add Receipt" button above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-phi z-50"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div 
            className="rounded-phi-lg border w-full max-w-lg mx-auto shadow-2xl"
            style={{
              background: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="p-phi-lg border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-phi-md font-semibold text-center" style={{ color: 'var(--color-text-primary)' }}>
                Add New Receipt
              </h3>
            </div>
            <div className="p-phi-xl">
              <div className="space-y-phi-lg">
                <div>
                  <label className="block text-phi-base font-medium mb-phi text-center" style={{ color: 'var(--color-text-primary)' }}>
                    Upload PDF Receipt
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-phi-lg p-phi-xl text-center transition-all duration-200 cursor-pointer group mx-auto"
                    style={{ 
                      borderColor: selectedFile ? 'var(--color-success)' : 'var(--color-border)',
                      maxWidth: '400px'
                    }}
                    onClick={handleUploadAreaClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent-500)';
                      e.currentTarget.style.background = 'var(--color-info-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = selectedFile ? 'var(--color-success)' : 'var(--color-border)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Upload 
                      className="icon-phi-md mx-auto mb-phi group-hover:scale-110 transition-transform duration-200" 
                      style={{ color: selectedFile ? 'var(--color-success)' : 'var(--color-accent-400)' }}
                    />
                    {selectedFile ? (
                      <div>
                        <p className="text-phi-sm font-medium" style={{ color: 'var(--color-success)' }}>
                          {selectedFile.name}
                        </p>
                        <p className="text-phi-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <p className="text-phi-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        Click to upload or drag and drop
                      </p>
                    )}
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={handleFileSelect}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-phi-base font-medium mb-phi text-center" style={{ color: 'var(--color-text-primary)' }}>
                    Or paste email text
                  </label>
                  <textarea
                    placeholder="Paste the email content here..."
                    value={emailText}
                    onChange={(e) => {
                      setEmailText(e.target.value)
                      if (e.target.value.trim()) {
                        setSelectedFile(null) // Clear file when email text is entered
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }
                    }}
                    className="w-full px-phi py-phi border rounded-phi-md focus-ring text-phi-base mx-auto"
                    style={{ 
                      height: 'calc(var(--space-2xl) * 2)',
                      background: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)',
                      maxWidth: '400px',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
              
              <div className="flex gap-phi mt-phi-lg justify-center">
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    resetUploadForm()
                  }}
                  className="btn-phi-md border font-medium hover-lift transition-all duration-200"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-primary)',
                    minWidth: '120px'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessReceipt}
                  disabled={processing}
                  className="btn-phi-md font-medium hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                    minWidth: '120px'
                  }}
                >
                  {processing ? 'Processing...' : 'Process Receipt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
