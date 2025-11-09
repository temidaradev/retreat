import { UserButton, useAuth } from "@clerk/clerk-react";
import {
  Plus,
  Receipt,
  Calendar,
  AlertTriangle,
  Upload,
  Search,
  TrendingUp,
  Crown,
  Lock,
  Download,
  Trash2,
  Mail,
  MessageSquare,
  Coffee,
  Smartphone,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  apiService,
  type ReceiptData,
  type SubscriptionData,
} from "../../services/api";
import { formatCompactCurrency } from "../../utils";
import ThemeSelector from "../common/ThemeSelector";
import EmailForwardingCard from "../common/EmailForwardingCard";
import HowItWorksModal from "../common/HowItWorksModal";
import ReceiptSourceBadge from "../common/ReceiptSourceBadge";
import FeedbackModal from "../common/FeedbackModal";

export default function Dashboard() {
  const { has, getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [emailText, setEmailText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [manualStore, setManualStore] = useState("");
  const [manualItem, setManualItem] = useState("");
  const [manualPurchaseDate, setManualPurchaseDate] = useState("");
  const [manualWarrantyExpiry, setManualWarrantyExpiry] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCurrency, setManualCurrency] = useState("USD");
  const [manualPhoto, setManualPhoto] = useState<File | null>(null);
  const [creatingManual, setCreatingManual] = useState(false);
  const [receiptPhotoById, setReceiptPhotoById] = useState<
    Record<string, string>
  >({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasRetreatPlan, setHasRetreatPlan] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [showAndroidNotice, setShowAndroidNotice] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Dynamic plan limits from subscription data
  const receiptLimit = subscriptionData?.receipt_limit || 5;
  const currentReceiptCount = receipts.length;
  const isAtLimit = !hasRetreatPlan && currentReceiptCount >= receiptLimit;

  useEffect(() => {
    loadReceipts();
    checkSubscriptionStatus();
  }, []);

  // Refresh subscription status periodically and when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      checkSubscriptionStatus();
    };

    // Refresh every 30 seconds to catch subscription changes
    const interval = setInterval(() => {
      checkSubscriptionStatus();
    }, 30000);

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      apiService.setAuthToken(token);
      const subscription = await apiService.getUserSubscription();
      setHasRetreatPlan(subscription.is_premium);
      setSubscriptionData({
        is_premium: subscription.is_premium,
        plan: subscription.plan || "free",
        receipt_limit: subscription.receipt_limit || 5,
        receipt_count: subscription.receipt_count || 0,
        expires_at: subscription.expires_at,
      });
    } catch (err) {
      console.error("Error checking subscription status:", err);
      // Fallback to Clerk check if backend check fails
      setHasRetreatPlan(has?.({ plan: "retreat" }) ?? false);
      setSubscriptionData({
        is_premium: false,
        plan: "free",
        receipt_limit: 5,
        receipt_count: 0,
      });
    }
  };

  const loadReceipts = async () => {
    try {
      setLoading(true);
      // Get the Clerk authentication token
      const token = await getToken();
      apiService.setAuthToken(token);

      const response = await apiService.getReceipts();
      setReceipts(response.receipts || []);

      // Update subscription data from receipts response
      if (response.subscription) {
        setSubscriptionData({
          is_premium: response.subscription.is_premium,
          plan: response.subscription.plan,
          receipt_limit: response.subscription.receipt_limit,
          receipt_count: response.subscription.receipt_count,
          expires_at: response.subscription.expires_at,
        });
        setHasRetreatPlan(response.subscription.is_premium);
      }
    } catch (err) {
      setError("Failed to load receipts");
      console.error("Error loading receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      setDeleting(true);
      const token = await getToken();
      apiService.setAuthToken(token);

      await apiService.deleteReceipt(receiptId);

      // Close the delete confirmation modal
      setDeleteConfirm(null);

      // Refresh the receipt list and subscription data from the server
      // This ensures the UI is in sync with the backend after deletion
      await loadReceipts();

      // Also refresh subscription status to update receipt count
      await checkSubscriptionStatus();
    } catch (err) {
      console.error("Error deleting receipt:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to delete receipt. Please try again.";

      // Check if it's a permission error (old receipts with wrong user_id)
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("not have permission")
      ) {
        alert(
          "⚠️ Cannot delete this receipt.\n\n" +
            "This receipt was created before the recent system update and has incorrect ownership data.\n\n" +
            "Please contact support at support@retreat-app.tech to have this receipt manually removed, or it will be automatically fixed in the next data migration."
        );
      } else {
        alert(errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (format: "csv" | "json" | "pdf") => {
    if (!hasRetreatPlan) {
      alert(
        "⚠️ Export is a premium feature!\n\nBecome a sponsor to unlock export functionality and download your receipt data in multiple formats."
      );
      return;
    }

    try {
      setExporting(true);
      const token = await getToken();
      if (!token) {
        alert("Please sign in to export data");
        return;
      }

      apiService.setAuthToken(token);
      const blob = await apiService.exportReceipts(format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `retreat-receipts-${
        new Date().toISOString().split("T")[0]
      }.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowExportModal(false);
    } catch (err) {
      console.error("Error exporting receipts:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export data";
      alert(`❌ Export failed: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  const filteredReceipts = (receipts || []).filter(
    (receipt) =>
      receipt.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.store.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "var(--color-success-bg)",
          text: "var(--color-success)",
          border: "rgba(34, 197, 94, 0.3)",
        };
      case "expiring":
        return {
          bg: "var(--color-warning-bg)",
          text: "var(--color-warning)",
          border: "rgba(245, 158, 11, 0.3)",
        };
      case "expired":
        return {
          bg: "var(--color-danger-bg)",
          text: "var(--color-danger)",
          border: "rgba(239, 68, 68, 0.3)",
        };
      default:
        return {
          bg: "rgba(148, 163, 184, 0.1)",
          text: "var(--color-text-tertiary)",
          border: "rgba(148, 163, 184, 0.3)",
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "expiring":
        return <AlertTriangle className="w-4 h-4" />;
      case "expired":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Receipt className="w-4 h-4" />;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setEmailText(""); // Clear email text when file is selected
      } else {
        alert("Please select a PDF file");
      }
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setEmailText(""); // Clear email text when file is dropped
    } else {
      alert("Please drop a PDF file");
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile && !emailText.trim()) {
      alert("Please upload a PDF file or paste email text");
      return;
    }

    setProcessing(true);
    try {
      // Get the Clerk authentication token
      const token = await getToken();
      apiService.setAuthToken(token);

      let parsedData;

      if (selectedFile) {
        // Convert file to base64
        const base64Content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data:application/pdf;base64, prefix
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        // Parse PDF
        const response = await apiService.parsePDF(base64Content);
        parsedData = response.parsed_data;
      } else {
        // Parse email
        const response = await apiService.parseEmail(emailText);
        parsedData = response.parsed_data;
      }

      // Validate parsed data
      if (!parsedData.purchase_date || !parsedData.warranty_expiry) {
        alert(
          "Could not extract dates from the receipt. Please try manual entry instead."
        );
        setProcessing(false);
        return;
      }

      // Warn if amount is 0 or missing
      const amount = parsedData.amount || 0;
      if (amount === 0) {
        const proceed = confirm(
          "Could not detect the receipt amount ($0). Would you like to continue creating the receipt? You can edit it later."
        );
        if (!proceed) {
          setProcessing(false);
          return;
        }
      }

      // Create receipt with parsed data
      const receiptData = {
        store: parsedData.store || "Unknown Store",
        item: parsedData.item || "Unknown Item",
        purchase_date: parsedData.purchase_date,
        warranty_expiry: parsedData.warranty_expiry,
        amount: amount,
        currency: parsedData.currency || "USD",
        original_email: selectedFile ? `PDF: ${selectedFile.name}` : emailText,
      };

      await apiService.createReceipt(receiptData);

      // Refresh receipts list
      await loadReceipts();

      // Refresh subscription status in case it changed
      await checkSubscriptionStatus();

      // Close modal and reset form
      setShowUploadModal(false);
      resetUploadForm();

      alert("Receipt processed successfully!");
    } catch (error) {
      console.error("Error processing receipt:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to process receipt. Please try again.";
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setEmailText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-bg-primary)",
        }}
      >
        <div className="px-3 sm:px-4 md:px-phi-lg py-2.5 sm:py-3 md:py-phi flex justify-between items-center gap-2">
          {/* Left side - Logo */}
          <div className="flex items-center gap-2 md:gap-phi min-w-0 flex-shrink">
            <div
              className="w-8 h-8 md:icon-phi-md rounded-lg md:rounded-phi-md flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-accent-500)" }}
            >
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span
              className="text-base md:text-phi-lg font-bold whitespace-nowrap"
              style={{ color: "var(--color-text-primary)" }}
            >
              Retreat
            </span>
            {hasRetreatPlan && (
              <div
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{
                  background: "var(--color-accent-500)",
                  color: "white",
                }}
              >
                <Crown className="w-3 h-3 flex-shrink-0" />
                <span>Sponsor</span>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1.5 md:gap-phi flex-shrink-0">
            {/* Sponsor Button */}
            {!hasRetreatPlan && (
              <Link
                to="/pricing"
                className="p-2 md:px-phi md:py-phi-sm rounded-lg md:rounded-phi-md text-xs md:text-phi-sm font-medium transition-all duration-200 hover-lift bg-accent-gradient shadow-accent-glow text-white flex items-center gap-1 flex-shrink-0"
              >
                <Crown className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:inline">Become a Sponsor</span>
              </Link>
            )}

            {/* Buy Me a Coffee - Mobile Icon Only */}
            <a
              href="https://www.buymeacoffee.com/temidaradev"
              target="_blank"
              rel="noopener noreferrer"
              className="md:hidden p-2 rounded-lg hover-lift transition-all duration-200 flex items-center justify-center flex-shrink-0"
              style={{
                background: "#FFDD00",
                color: "#000000",
              }}
              title="Buy me a coffee"
            >
              <Coffee className="w-4 h-4" />
            </a>

            {/* Buy Me a Coffee - Desktop */}
            <a
              href="https://www.buymeacoffee.com/temidaradev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block flex-shrink-0"
            >
              <img
                src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=temidaradev&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff"
                alt="Buy me a coffee"
                className="h-8"
              />
            </a>

            {/* Feedback Button - Hidden on Mobile */}
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              title="Send Feedback"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Email Settings - Hidden on Mobile */}
            <Link
              to="/emails"
              className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              title="Email Settings"
            >
              <Mail className="w-5 h-5" />
            </Link>

            {/* Download APK Button - Hidden on Mobile */}
            <a
              href="/api/v1/download/android"
              download
              className="hidden sm:flex items-center justify-center p-2 rounded-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              title="Download Android APK"
            >
              <Download className="w-5 h-5" />
            </a>

            {/* Theme Selector - Hidden on Mobile */}
            <div className="hidden sm:block flex-shrink-0">
              <ThemeSelector />
            </div>

            {/* User Button */}
            <div className="flex-shrink-0">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-7xl mx-auto w-full">
          {/* Sponsor Benefits Section - Compact at Top */}
          {hasRetreatPlan && (
            <div
              className="rounded-lg border mb-4 md:mb-6 overflow-hidden"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4">
                  <div className="flex items-center gap-2">
                    <Crown
                      className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0"
                      style={{ color: "var(--color-accent-500)" }}
                    />
                    <h2
                      className="text-sm md:text-base font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Your Sponsor Benefits
                    </h2>
                  </div>
                  <div className="flex-1 flex flex-wrap items-center gap-3 md:gap-4 sm:gap-6">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-accent-500)" }}
                      >
                        <Receipt className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p
                          className="text-xs md:text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {receiptLimit} Receipts
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {receiptLimit === 5
                            ? "Free tier"
                            : `${receiptLimit - 5} more than free`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-success)" }}
                      >
                        <Download className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p
                          className="text-xs md:text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          Export Data
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          Multiple formats
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-warning)" }}
                      >
                        <Crown className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                      <div>
                        <p
                          className="text-xs md:text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          Priority Support
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          Direct help
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Plan Limit Warning or Progress */}
          {!hasRetreatPlan && (
            <div
              className="rounded-phi-lg p-4 md:p-phi-lg border mb-phi-lg"
              style={{
                background: isAtLimit
                  ? "var(--color-warning-bg)"
                  : "var(--color-info-bg)",
                borderColor: isAtLimit
                  ? "var(--color-warning)"
                  : "var(--color-accent-500)",
                borderWidth: "2px",
              }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-3 md:gap-phi">
                <div className="flex items-start sm:items-center gap-3 md:gap-phi flex-1 min-w-0">
                  {isAtLimit ? (
                    <Lock
                      className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0"
                      style={{ color: "var(--color-warning)" }}
                    />
                  ) : (
                    <Receipt
                      className="w-5 h-5 flex-shrink-0 mt-0.5 sm:mt-0"
                      style={{ color: "var(--color-accent-500)" }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm md:text-phi-base font-semibold"
                      style={{
                        color: isAtLimit
                          ? "var(--color-warning)"
                          : "var(--color-accent-500)",
                      }}
                    >
                      {isAtLimit
                        ? `${
                            subscriptionData?.plan === "premium"
                              ? "Premium"
                              : "Free"
                          } Plan Limit Reached`
                        : `${
                            subscriptionData?.plan === "premium"
                              ? "Premium"
                              : "Free"
                          } Plan`}
                    </h3>
                    <p
                      className="text-xs md:text-phi-sm mt-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {isAtLimit
                        ? `You've reached the ${receiptLimit} receipt limit. ${
                            receiptLimit === 5
                              ? `Become a sponsor for up to 50 receipts.`
                              : "Contact support for higher limits."
                          }`
                        : `You have ${receiptLimit - receipts.length} receipt${
                            receiptLimit - receipts.length !== 1 ? "s" : ""
                          } remaining. ${
                            receiptLimit === 5
                              ? "Become a sponsor for up to 50 receipts and premium features."
                              : ""
                          }`}
                    </p>

                    {/* Progress bar */}
                    {!isAtLimit && (
                      <div className="mt-phi-sm">
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: "rgba(148, 163, 184, 0.2)" }}
                        >
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${
                                (receipts.length / receiptLimit) * 100
                              }%`,
                              background:
                                receipts.length >= receiptLimit * 0.8
                                  ? "var(--color-warning)"
                                  : "var(--color-accent-500)",
                            }}
                          />
                        </div>
                        <p
                          className="text-phi-xs mt-1"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {receipts.length} of {receiptLimit} receipts used
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  to="/pricing"
                  className="flex items-center justify-center gap-2 md:gap-phi px-4 md:px-phi py-2 md:py-phi-sm rounded-phi-md text-xs md:text-phi-sm font-medium transition-all duration-200 hover-lift whitespace-nowrap w-full sm:w-auto"
                  style={{
                    background: isAtLimit
                      ? "var(--color-warning)"
                      : "var(--color-accent-500)",
                    color: "white",
                  }}
                >
                  <Crown className="w-4 h-4" />
                  {isAtLimit ? "Become a Sponsor" : "View Details"}
                </Link>
              </div>
            </div>
          )}

          {/* Stats Cards - Modern with animations */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-phi-lg mb-phi-xl">
            <div className="card-modern p-4 md:p-phi-lg animate-fade-in stagger-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs md:text-phi-sm mb-1 md:mb-phi"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Total Receipts
                  </p>
                  <p
                    className="text-2xl md:text-phi-xl font-bold truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {receipts.length}
                  </p>
                </div>
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-info-bg)" }}
                >
                  <Receipt
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </div>
              </div>
            </div>

            <div className="card-modern p-4 md:p-phi-lg animate-fade-in stagger-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs md:text-phi-sm mb-1 md:mb-phi"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Active
                  </p>
                  <p
                    className="text-2xl md:text-phi-xl font-bold truncate"
                    style={{ color: "var(--color-success)" }}
                  >
                    {receipts.filter((r) => r.status === "active").length}
                  </p>
                </div>
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-success-bg)" }}
                >
                  <Calendar
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
              </div>
            </div>

            <div className="card-modern p-4 md:p-phi-lg animate-fade-in stagger-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs md:text-phi-sm mb-1 md:mb-phi"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Expiring
                  </p>
                  <p
                    className="text-2xl md:text-phi-xl font-bold truncate"
                    style={{ color: "var(--color-warning)" }}
                  >
                    {receipts.filter((r) => r.status === "expiring").length}
                  </p>
                </div>
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-warning-bg)" }}
                >
                  <AlertTriangle
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: "var(--color-warning)" }}
                  />
                </div>
              </div>
            </div>

            <div className="card-modern p-4 md:p-phi-lg animate-fade-in stagger-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs md:text-phi-sm mb-1 md:mb-phi"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Total Value
                  </p>
                  <p
                    className="text-2xl md:text-phi-xl font-bold truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {formatCompactCurrency(
                      receipts.reduce((sum, r) => sum + r.amount, 0)
                    )}
                  </p>
                </div>
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-info-bg)" }}
                >
                  <TrendingUp
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: "var(--color-accent-400)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-phi mb-phi-lg items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 z-10"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border focus-ring transition-all duration-200 pl-10 md:pl-12 pr-3 md:pr-4 text-sm md:text-base"
                style={{
                  height: "var(--input-height-sm)",
                  fontSize: "var(--text-sm)",
                  borderRadius: "var(--radius-full)",
                  background: "var(--color-bg-secondary)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* Show appropriate button based on plan and receipt count */}
            <div className="flex items-center gap-2 md:gap-phi flex-wrap sm:flex-nowrap">
              {/* Receipt count indicator for non-premium users */}
              {!hasRetreatPlan && (
                <div
                  className="text-xs md:text-phi-sm whitespace-nowrap"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span
                    className="font-medium"
                    style={{
                      color:
                        receipts.length >= receiptLimit
                          ? "var(--color-warning)"
                          : "var(--color-text-primary)",
                    }}
                  >
                    {receipts.length}/{receiptLimit}
                  </span>{" "}
                  receipts
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-2 md:gap-phi whitespace-nowrap border flex-1 sm:flex-none relative"
                style={{
                  height: "var(--input-height-sm)",
                  minWidth: "auto",
                  padding: "0 var(--space-md)",
                  fontSize: "var(--text-sm)",
                  borderRadius: "var(--radius-full)",
                  background: hasRetreatPlan
                    ? "var(--color-success-bg)"
                    : "var(--color-bg-secondary)",
                  borderColor: hasRetreatPlan
                    ? "var(--color-success)"
                    : "var(--color-border)",
                  color: hasRetreatPlan
                    ? "var(--color-success)"
                    : "var(--color-text-secondary)",
                }}
                title={
                  hasRetreatPlan
                    ? "Export Receipts"
                    : "Export (Premium Feature)"
                }
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base">Export</span>
                {!hasRetreatPlan && (
                  <Crown
                    className="w-3 h-3 absolute -top-1 -right-1"
                    style={{ color: "var(--color-accent-500)" }}
                  />
                )}
              </button>

              {/* Show "Become a Sponsor" only when at limit */}
              {isAtLimit ? (
                <Link
                  to="/pricing"
                  className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-2 md:gap-phi whitespace-nowrap border-0 flex-1 sm:flex-none"
                  style={{
                    height: "var(--input-height-sm)",
                    minWidth: "auto",
                    padding: "0 var(--space-md)",
                    fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-full)",
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <Lock className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Become a Sponsor</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-2 md:gap-phi whitespace-nowrap border-0 flex-1 sm:flex-none"
                  style={{
                    height: "var(--input-height-sm)",
                    minWidth: "auto",
                    padding: "0 var(--space-md)",
                    fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-full)",
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Add Receipt</span>
                </button>
              )}
            </div>
          </div>

          {/* Receipts List */}
          <div
            className="rounded-phi-lg border overflow-hidden"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="p-4 md:p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h2
                className="text-base md:text-phi-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Your Receipts
              </h2>
            </div>

            {loading ? (
              <div className="p-phi-xl text-center">
                <div
                  className="animate-spin rounded-full h-phi-icon w-phi-icon border-b-2 mx-auto"
                  style={{ borderColor: "var(--color-accent-500)" }}
                ></div>
                <p
                  className="mt-phi text-phi-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Loading receipts...
                </p>
              </div>
            ) : error ? (
              <div className="p-phi-xl text-center">
                <p
                  className="text-phi-base"
                  style={{ color: "var(--color-danger)" }}
                >
                  {error}
                </p>
                <button
                  onClick={loadReceipts}
                  className="mt-phi text-phi-base hover:underline"
                  style={{ color: "var(--color-accent-400)" }}
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
                      style={{
                        color: "var(--color-text-tertiary)",
                        opacity: 0.5,
                      }}
                    />
                    <p
                      className="text-phi-md"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      No receipts found
                    </p>
                    <p
                      className="text-phi-sm mt-phi"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      Add your first receipt to get started
                    </p>
                  </div>
                ) : (
                  filteredReceipts.map((receipt, index) => (
                    <div
                      key={receipt.id}
                      className="p-4 md:p-phi-lg transition-all duration-200 animate-fade-in"
                      style={{
                        borderTop:
                          index > 0 ? `1px solid var(--color-border)` : "none",
                        animationDelay: `${index * 0.05}s`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--color-bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Main receipt summary - full width horizontally */}
                      <div className="flex flex-row items-center justify-between gap-3 md:gap-phi w-full">
                        <div className="flex items-start gap-3 md:gap-phi flex-1 min-w-0">
                          <div
                            className="w-10 h-10 md:w-16 md:h-16 rounded-lg flex items-center justify-center border flex-shrink-0"
                            style={{
                              background: "var(--color-bg-primary)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            <Receipt
                              className="w-5 h-5 md:w-8 md:h-8"
                              style={{ color: "var(--color-text-tertiary)" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className="text-sm md:text-phi-md font-semibold truncate"
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                {receipt.item}
                              </h3>
                              {receipt.parsed_data &&
                                (() => {
                                  try {
                                    const parsedData = JSON.parse(
                                      receipt.parsed_data
                                    );
                                    return (
                                      <ReceiptSourceBadge
                                        source={parsedData.source}
                                      />
                                    );
                                  } catch {
                                    return null;
                                  }
                                })()}
                            </div>
                            <p
                              className="text-xs md:text-phi-base mt-1 truncate"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {receipt.store}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-phi flex-shrink-0">
                          {(() => {
                            const style = getStatusStyle(receipt.status);
                            return (
                              <span
                                className="px-2 md:px-phi py-1 md:py-phi rounded-full text-xs md:text-phi-xs font-medium flex items-center gap-1 md:gap-phi border"
                                style={{
                                  background: style.bg,
                                  color: style.text,
                                  borderColor: style.border,
                                }}
                              >
                                {getStatusIcon(receipt.status)}
                                <span className="capitalize hidden sm:inline">
                                  {receipt.status}
                                </span>
                              </span>
                            );
                          })()}
                          <div className="text-right min-w-0">
                            <p
                              className="text-base md:text-phi-md font-semibold truncate"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {formatCompactCurrency(receipt.amount)}
                            </p>
                            <p
                              className="text-xs md:text-phi-sm mt-1 hidden md:block truncate"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              Expires:{" "}
                              {new Date(
                                receipt.warranty_expiry
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => setDeleteConfirm(receipt.id)}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover-lift border flex-shrink-0"
                            style={{
                              background: "var(--color-bg-primary)",
                              borderColor: "var(--color-border)",
                              color: "var(--color-text-tertiary)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--color-danger)";
                              e.currentTarget.style.color =
                                "var(--color-danger)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor =
                                "var(--color-border)";
                              e.currentTarget.style.color =
                                "var(--color-text-tertiary)";
                            }}
                            title="Delete receipt"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable details button */}
                      <button
                        onClick={() => {
                          setExpandedIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(receipt.id)) next.delete(receipt.id);
                            else next.add(receipt.id);
                            return next;
                          });
                        }}
                        className="mt-2 text-left w-full"
                        style={{ color: "var(--color-accent-400)" }}
                        aria-expanded={expandedIds.has(receipt.id)}
                      >
                        {expandedIds.has(receipt.id)
                          ? "Hide details"
                          : "View details"}
                      </button>

                      {/* Expanded details - stacks vertically below */}
                      {expandedIds.has(receipt.id) && (
                        <div
                          className="mt-3 p-3 md:p-4 border rounded-phi-md w-full space-y-2"
                          style={{
                            borderColor: "var(--color-border)",
                            background: "var(--color-bg-tertiary)",
                          }}
                        >
                          <div
                            className="text-sm"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            <div>
                              <strong
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                Store:
                              </strong>{" "}
                              {receipt.store}
                            </div>
                            <div>
                              <strong
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                Item:
                              </strong>{" "}
                              {receipt.item}
                            </div>
                            <div>
                              <strong
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                Amount:
                              </strong>{" "}
                              {receipt.amount} {receipt.currency}
                            </div>
                            <div>
                              <strong
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                Purchased:
                              </strong>{" "}
                              {new Date(
                                receipt.purchase_date
                              ).toLocaleDateString()}
                            </div>
                            <div>
                              <strong
                                style={{ color: "var(--color-text-primary)" }}
                              >
                                Warranty Expiry:
                              </strong>{" "}
                              {new Date(
                                receipt.warranty_expiry
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          {receiptPhotoById[receipt.id] && (
                            <img
                              src={receiptPhotoById[receipt.id]}
                              alt="Receipt attachment"
                              className="rounded-phi-md border max-h-56 object-contain"
                              style={{
                                borderColor: "var(--color-border)",
                                background: "var(--color-bg-primary)",
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* How to Add Receipts Section */}
          <div
            id="email-forwarding-card"
            className="mt-phi-xl rounded-phi-lg border"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="p-4 md:p-phi-lg">
              <h3
                className="text-lg md:text-phi-lg font-semibold mb-4 md:mb-phi-lg"
                style={{ color: "var(--color-text-primary)" }}
              >
                How to Add Receipts
              </h3>

              {/* Email Forwarding */}
              <div className="mb-4 md:mb-phi-lg">
                <EmailForwardingCard
                  onShowHelp={() => setShowHowItWorks(true)}
                />
              </div>

              {/* Divider */}
              <div
                className="my-4 md:my-phi-lg h-px"
                style={{ background: "var(--color-border)" }}
              />

              {/* Manual Upload */}
              <div>
                <h4
                  className="text-base md:text-phi-md font-semibold mb-2 md:mb-phi"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Alternative: Manual Upload
                </h4>
                <p
                  className="text-xs md:text-phi-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  You can also upload PDF receipts or paste email text manually
                  using the "Add Receipt" button above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="fixed inset-0 backdrop-blur-modern flex items-center justify-center p-4 md:p-phi z-50 animate-fade-in"
          onClick={() => {
            setShowUploadModal(false);
            resetUploadForm();
          }}
        >
          <div
            className="rounded-phi-lg border w-full max-w-lg mx-auto shadow-2xl animate-scale-in overflow-y-auto max-h-[90vh]"
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-4 md:p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h3
                className="text-base md:text-phi-md font-semibold text-center"
                style={{ color: "var(--color-text-primary)" }}
              >
                Add New Receipt
              </h3>
            </div>
            <div className="p-4 md:p-phi-xl">
              <div className="space-y-phi-lg">
                <div>
                  <label
                    className="block text-sm md:text-phi-base font-medium mb-3 md:mb-phi text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Upload PDF Receipt
                  </label>
                  <div
                    className="border-2 border-dashed rounded-phi-lg p-4 md:p-phi-xl text-center transition-all duration-200 cursor-pointer group mx-auto"
                    style={{
                      borderColor: selectedFile
                        ? "var(--color-success)"
                        : "var(--color-border)",
                      maxWidth: "400px",
                    }}
                    onClick={handleUploadAreaClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--color-accent-500)";
                      e.currentTarget.style.background = "var(--color-info-bg)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = selectedFile
                        ? "var(--color-success)"
                        : "var(--color-border)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Upload
                      className="icon-phi-md mx-auto mb-phi group-hover:scale-110 transition-transform duration-200"
                      style={{
                        color: selectedFile
                          ? "var(--color-success)"
                          : "var(--color-accent-400)",
                      }}
                    />
                    {selectedFile ? (
                      <div>
                        <p
                          className="text-phi-sm font-medium"
                          style={{ color: "var(--color-success)" }}
                        >
                          {selectedFile.name}
                        </p>
                        <p
                          className="text-phi-xs mt-1"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          Click to change file
                        </p>
                      </div>
                    ) : (
                      <p
                        className="text-phi-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
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
                  <label
                    className="block text-sm md:text-phi-base font-medium mb-3 md:mb-phi text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Or paste email text
                  </label>
                  <textarea
                    placeholder="Paste the email content here..."
                    value={emailText}
                    onChange={(e) => {
                      setEmailText(e.target.value);
                      if (e.target.value.trim()) {
                        setSelectedFile(null); // Clear file when email text is entered
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }
                    }}
                    className="w-full px-3 md:px-phi py-3 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base mx-auto"
                    style={{
                      height: "calc(var(--space-2xl) * 2)",
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-primary)",
                      maxWidth: "400px",
                      display: "block",
                    }}
                  />
                </div>

                {/* Show Process Receipt button only if PDF or email is provided */}
                {(selectedFile || emailText.trim()) && (
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-phi justify-center">
                    <button
                      onClick={() => {
                        setShowUploadModal(false);
                        resetUploadForm();
                      }}
                      className="btn-phi-md border font-medium hover-lift transition-all duration-200 w-full sm:w-auto"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "transparent",
                        color: "var(--color-text-primary)",
                        minWidth: "120px",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProcessReceipt}
                      disabled={processing}
                      className="btn-phi-md font-medium hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                        color: "white",
                        boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                        minWidth: "120px",
                      }}
                    >
                      {processing ? "Processing..." : "Process Receipt"}
                    </button>
                  </div>
                )}

                {/* Divider */}
                {!selectedFile && !emailText.trim() && (
                  <div className="relative">
                    <div
                      className="absolute inset-0 flex items-center"
                      style={{ maxWidth: "400px", margin: "0 auto" }}
                    >
                      <div
                        className="w-full border-t"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span
                        className="px-2"
                        style={{
                          background: "var(--color-bg-secondary)",
                          color: "var(--color-text-tertiary)",
                        }}
                      >
                        or
                      </span>
                    </div>
                  </div>
                )}

                {/* Manual add */}
                <div>
                  <label
                    className="block text-sm md:text-phi-base font-medium mb-3 md:mb-phi text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Or create manually
                  </label>
                  <div
                    className="grid gap-2"
                    style={{ maxWidth: "400px", margin: "0 auto" }}
                  >
                    <input
                      placeholder="Store"
                      value={manualStore}
                      onChange={(e) => setManualStore(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base"
                      style={{
                        background: "var(--color-bg-primary)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <input
                      placeholder="Item"
                      value={manualItem}
                      onChange={(e) => setManualItem(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base"
                      style={{
                        background: "var(--color-bg-primary)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="date"
                        aria-label="Purchase date"
                        value={manualPurchaseDate}
                        onChange={(e) => setManualPurchaseDate(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base"
                        style={{
                          background: "var(--color-bg-primary)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <input
                        type="date"
                        aria-label="Warranty expiry"
                        value={manualWarrantyExpiry}
                        onChange={(e) =>
                          setManualWarrantyExpiry(e.target.value)
                        }
                        className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base"
                        style={{
                          background: "var(--color-bg-primary)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base"
                        style={{
                          background: "var(--color-bg-primary)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                      <select
                        value={manualCurrency}
                        onChange={(e) => setManualCurrency(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-phi border rounded-phi-md focus-ring text-sm md:text-phi-base"
                        style={{
                          background: "var(--color-bg-primary)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="TRY">TRY</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setManualPhoto(e.target.files?.[0] || null)
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (
                          !manualStore.trim() ||
                          !manualItem.trim() ||
                          !manualPurchaseDate ||
                          !manualWarrantyExpiry ||
                          !manualAmount
                        ) {
                          alert("Please complete all fields.");
                          return;
                        }
                        setCreatingManual(true);
                        try {
                          const token = await getToken();
                          apiService.setAuthToken(token);
                          const created = await apiService.createReceipt({
                            store: manualStore.trim(),
                            item: manualItem.trim(),
                            purchase_date: manualPurchaseDate,
                            warranty_expiry: manualWarrantyExpiry,
                            amount: parseFloat(manualAmount),
                            currency: manualCurrency,
                          });
                          if (manualPhoto) {
                            const url = URL.createObjectURL(manualPhoto);
                            setReceiptPhotoById((prev) => ({
                              ...prev,
                              [created.id]: url,
                            }));
                          }
                          alert("Receipt created successfully");
                          setManualStore("");
                          setManualItem("");
                          setManualPurchaseDate("");
                          setManualWarrantyExpiry("");
                          setManualAmount("");
                          setManualCurrency("USD");
                          setManualPhoto(null);
                          await loadReceipts();
                          setShowUploadModal(false);
                        } catch (err) {
                          const msg =
                            err instanceof Error
                              ? err.message
                              : "Failed to create receipt";
                          console.error("[ManualCreate] error", err);
                          alert(msg);
                        } finally {
                          setCreatingManual(false);
                        }
                      }}
                      disabled={creatingManual}
                      className="w-full md:w-auto px-4 md:px-phi py-2 md:py-phi-sm rounded-phi-md font-medium text-sm md:text-phi-base transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                        color: "white",
                        boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      {creatingManual ? "Creating..." : "Create receipt"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Show close button if manual entry or nothing is filled */}
              {!selectedFile && !emailText.trim() && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      resetUploadForm();
                    }}
                    className="btn-phi-md border font-medium hover-lift transition-all duration-200 w-full sm:w-auto"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "transparent",
                      color: "var(--color-text-primary)",
                      minWidth: "120px",
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="card-modern max-w-md w-full p-4 md:p-phi-xl animate-scale-in mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div
                className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-phi-lg"
                style={{
                  background: "var(--color-danger-bg)",
                  border: "2px solid var(--color-danger)",
                }}
              >
                <Trash2
                  className="w-6 h-6 md:w-8 md:h-8"
                  style={{ color: "var(--color-danger)" }}
                />
              </div>
              <h3
                className="text-base md:text-phi-lg font-semibold mb-3 md:mb-phi"
                style={{ color: "var(--color-text-primary)" }}
              >
                Delete Receipt?
              </h3>
              <p
                className="text-sm md:text-phi-base mb-4 md:mb-phi-lg px-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Are you sure you want to delete this receipt? This action cannot
                be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-phi justify-center">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="btn-phi-md border font-medium hover-lift transition-all duration-200 disabled:opacity-50"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "transparent",
                    color: "var(--color-text-primary)",
                    minWidth: "120px",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteReceipt(deleteConfirm)}
                  disabled={deleting}
                  className="btn-phi-md font-medium hover-lift transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "var(--color-danger)",
                    color: "white",
                    minWidth: "120px",
                  }}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            className="card-modern max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "var(--color-success-bg)" }}
              >
                <Download
                  className="w-5 h-5"
                  style={{ color: "var(--color-success)" }}
                />
              </div>
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Export Receipt Data
              </h3>
            </div>

            {!hasRetreatPlan ? (
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    background: "var(--color-warning-bg)",
                    borderColor: "rgba(251, 191, 36, 0.3)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Crown
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "var(--color-accent-500)" }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Premium Feature
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Export is available for sponsors. Become a sponsor to
                        unlock export functionality and download your receipt
                        data in multiple formats.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      background: "var(--color-bg-primary)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Close
                  </button>
                  <Link
                    to="/pricing"
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover-lift text-center"
                    style={{
                      background: "var(--color-accent-500)",
                      color: "white",
                    }}
                  >
                    Become a Sponsor
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Choose a format to export your {receipts.length} receipt
                  {receipts.length !== 1 ? "s" : ""}:
                </p>

                <div className="space-y-2">
                  {/* CSV Option */}
                  <button
                    onClick={() => handleExport("csv")}
                    disabled={exporting}
                    className="w-full p-4 rounded-lg border text-left transition-all duration-200 hover-lift disabled:opacity-50"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm mb-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          CSV (Spreadsheet)
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          Open in Excel, Google Sheets, etc.
                        </p>
                      </div>
                      <Download
                        className="w-5 h-5"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </div>
                  </button>

                  {/* JSON Option */}
                  <button
                    onClick={() => handleExport("json")}
                    disabled={exporting}
                    className="w-full p-4 rounded-lg border text-left transition-all duration-200 hover-lift disabled:opacity-50"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm mb-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          JSON (Raw Data)
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          For developers and data analysis
                        </p>
                      </div>
                      <Download
                        className="w-5 h-5"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </div>
                  </button>

                  {/* PDF Option */}
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                    className="w-full p-4 rounded-lg border text-left transition-all duration-200 hover-lift disabled:opacity-50"
                    style={{
                      background: "var(--color-bg-primary)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="font-medium text-sm mb-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          PDF (Document)
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          Printable formatted document
                        </p>
                      </div>
                      <Download
                        className="w-5 h-5"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={exporting}
                  className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "var(--color-bg-primary)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {exporting ? "Exporting..." : "Cancel"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Android WebView Notice */}
      {showAndroidNotice && (
        <div
          onClick={() => setShowAndroidNotice(false)}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm text-center text-xs sm:text-sm z-50 max-w-md mx-4 cursor-pointer hover:opacity-90 transition-opacity"
          style={{
            background: "var(--color-warning-bg)",
            borderColor: "rgba(251, 191, 36, 0.3)",
            color: "var(--color-warning)",
          }}
        >
          <div className="flex items-center gap-2 justify-center">
            <Smartphone className="w-4 h-4 flex-shrink-0" />
            <span>Android WebView is still a work in progress</span>
          </div>
        </div>
      )}

      {/* Hidden dev-only health check link - verify Vercel API rewrite */}
      {import.meta.env.DEV && (
        <a
          href="/api/v1/apk/info"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-2 right-2 text-xs opacity-20 hover:opacity-100 transition-opacity"
          style={{ color: "var(--color-text-secondary)" }}
          title="API Health Check (dev only)"
        >
          API Health
        </a>
      )}
    </div>
  );
}
