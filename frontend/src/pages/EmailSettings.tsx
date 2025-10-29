import { UserButton, useAuth } from "@clerk/clerk-react";
import { ArrowLeft, Mail, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService, type UserEmail } from "../services/api";
import ThemeSelector from "../components/common/ThemeSelector";
import EmailList from "../components/emails/EmailList";
import AddEmailForm from "../components/emails/AddEmailForm";
import EmailInfoBanner from "../components/emails/EmailInfoBanner";
import HowItWorksModal from "../components/common/HowItWorksModal";

export default function EmailSettings() {
  const { has, getToken } = useAuth();
  const navigate = useNavigate();
  const [emails, setEmails] = useState<UserEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const hasRetreatPlan = has?.({ plan: "retreat" }) ?? false;

  useEffect(() => {
    loadEmails();
  }, []);

  const loadEmails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      apiService.setAuthToken(token);
      const response = await apiService.getEmails();
      setEmails(response.emails || []);
    } catch (err) {
      console.error("Error loading emails:", err);
      alert("Failed to load email addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (email: string) => {
    try {
      const token = await getToken();
      apiService.setAuthToken(token);
      await apiService.addEmail(email);
      
      // Show success message
      alert(`Verification email sent to ${email}! Check your inbox.`);
      
      // Reload emails
      await loadEmails();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add email address";
      alert(errorMessage);
      throw err; // Re-throw so form knows it failed
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm("Are you sure you want to delete this email address?")) {
      return;
    }

    try {
      const token = await getToken();
      apiService.setAuthToken(token);
      await apiService.deleteEmail(emailId);
      
      // Remove from local state
      setEmails(emails.filter(e => e.id !== emailId));
      alert("Email address deleted successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete email address";
      alert(errorMessage);
    }
  };

  const handleSetPrimary = async (emailId: string) => {
    try {
      const token = await getToken();
      apiService.setAuthToken(token);
      await apiService.setPrimaryEmail(emailId);
      
      // Update local state
      setEmails(emails.map(e => ({
        ...e,
        is_primary: e.id === emailId
      })));
      
      alert("Primary email updated successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to set primary email";
      alert(errorMessage);
    }
  };

  const handleResendVerification = async (emailId: string) => {
    try {
      const token = await getToken();
      apiService.setAuthToken(token);
      await apiService.resendVerification(emailId);
      
      alert("Verification email sent! Check your inbox.");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to resend verification";
      alert(errorMessage);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header */}
      <header
        className="border-b sticky top-0 z-40 backdrop-blur-modern"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="px-4 md:px-phi-lg py-3 md:py-phi flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-phi">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover-lift transition-all duration-200"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-primary)',
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="w-8 h-8 md:icon-phi-md rounded-lg md:rounded-phi-md flex items-center justify-center"
              style={{ background: "var(--color-accent-500)" }}
            >
              <Mail className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span
              className="text-base md:text-phi-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Email Addresses
            </span>
            {hasRetreatPlan && (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  background: "var(--color-accent-500)",
                  color: "white",
                }}
              >
                <Crown className="w-3 h-3" />
                <span className="hidden sm:inline">Sponsor</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-phi">
            {!hasRetreatPlan && (
              <Link
                to="/pricing"
                className="flex items-center gap-1 md:gap-phi px-3 md:px-phi py-2 md:py-phi-sm rounded-full md:rounded-phi-md text-xs md:text-phi-sm font-medium transition-all duration-200 hover-lift bg-accent-gradient shadow-accent-glow text-white"
              >
                <Crown className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Become a</span> Sponsor
              </Link>
            )}
            <ThemeSelector />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-phi-lg">
          {/* Info Banner */}
          <EmailInfoBanner onLearnMore={() => setShowHowItWorks(true)} />

          {/* Email List */}
          <div>
            <h2
              className="text-lg md:text-phi-lg font-semibold mb-3 md:mb-phi"
              style={{ color: "var(--color-text-primary)" }}
            >
              Your Email Addresses
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
                  style={{ borderColor: "var(--color-accent-500)" }}
                ></div>
                <p
                  className="mt-4 text-phi-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Loading email addresses...
                </p>
              </div>
            ) : (
              <EmailList
                emails={emails}
                onDelete={handleDeleteEmail}
                onSetPrimary={handleSetPrimary}
                onResend={handleResendVerification}
              />
            )}
          </div>

          {/* Add Email Form */}
          <AddEmailForm onAdd={handleAddEmail} />
        </div>
      </main>

      {/* How It Works Modal */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </div>
  );
}

