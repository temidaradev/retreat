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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { apiService, type ReceiptData } from "../../services/api";
import { formatCompactCurrency } from "../../utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Premium features access control (managed manually via Clerk dashboard)
  const hasRetreatPlan = has?.({ plan: "retreat" }) ?? false;

  // Free plan limits
  const FREE_PLAN_LIMIT = 10;
  const isAtFreeLimit = !hasRetreatPlan && receipts.length >= FREE_PLAN_LIMIT;

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      // Get the Clerk authentication token
      const token = await getToken();
      apiService.setAuthToken(token);

      const response = await apiService.getReceipts();
      setReceipts(response.receipts || []);
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

      // Remove the receipt from the local state
      setReceipts((prevReceipts) =>
        prevReceipts.filter((r) => r.id !== receiptId)
      );
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting receipt:", err);
      alert("Failed to delete receipt. Please try again.");
    } finally {
      setDeleting(false);
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

      // Create receipt with parsed data
      const receiptData = {
        store: parsedData.store || "Unknown Store",
        item: parsedData.item || "Unknown Item",
        purchase_date: parsedData.purchase_date,
        warranty_expiry: parsedData.warranty_expiry,
        amount: parsedData.amount || 0,
        currency: parsedData.currency || "USD",
        original_email: selectedFile ? `PDF: ${selectedFile.name}` : emailText,
      };

      await apiService.createReceipt(receiptData);

      // Refresh receipts list
      await loadReceipts();

      // Close modal and reset form
      setShowUploadModal(false);
      resetUploadForm();

      alert("Receipt processed successfully!");
    } catch (error) {
      console.error("Error processing receipt:", error);
      alert("Failed to process receipt. Please try again.");
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
        }}
      >
        <div className="px-4 md:px-phi-lg py-3 md:py-phi flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-phi">
            <div
              className="w-8 h-8 md:icon-phi-md rounded-lg md:rounded-phi-md flex items-center justify-center"
              style={{ background: "var(--color-accent-500)" }}
            >
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span
              className="text-base md:text-phi-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Retreat
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
            <a
              href="https://www.buymeacoffee.com/temidaradev"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-block"
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

      <main className="px-4 md:px-phi-lg py-6 md:py-phi-xl">
        <div className="max-w-7xl mx-auto w-full">
          {/* Free Plan Limit Warning or Progress */}
          {!hasRetreatPlan && (
            <div
              className="rounded-phi-lg p-phi-lg border mb-phi-lg"
              style={{
                background: isAtFreeLimit
                  ? "var(--color-warning-bg)"
                  : "var(--color-info-bg)",
                borderColor: isAtFreeLimit
                  ? "var(--color-warning)"
                  : "var(--color-accent-500)",
                borderWidth: "2px",
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-phi">
                <div className="flex items-center gap-phi flex-1">
                  {isAtFreeLimit ? (
                    <Lock
                      className="w-5 h-5"
                      style={{ color: "var(--color-warning)" }}
                    />
                  ) : (
                    <Receipt
                      className="w-5 h-5"
                      style={{ color: "var(--color-accent-500)" }}
                    />
                  )}
                  <div className="flex-1">
                    <h3
                      className="text-phi-base font-semibold"
                      style={{
                        color: isAtFreeLimit
                          ? "var(--color-warning)"
                          : "var(--color-accent-500)",
                      }}
                    >
                      {isAtFreeLimit ? "Free Plan Limit Reached" : "Free Plan"}
                    </h3>
                    <p
                      className="text-phi-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {isAtFreeLimit
                        ? `You've reached the ${FREE_PLAN_LIMIT} receipt limit. Become a sponsor for unlimited receipts.`
                        : `You have ${
                            FREE_PLAN_LIMIT - receipts.length
                          } receipt${
                            FREE_PLAN_LIMIT - receipts.length !== 1 ? "s" : ""
                          } remaining. Become a sponsor for unlimited receipts and premium features.`}
                    </p>

                    {/* Progress bar */}
                    {!isAtFreeLimit && (
                      <div className="mt-phi-sm">
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: "rgba(148, 163, 184, 0.2)" }}
                        >
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${
                                (receipts.length / FREE_PLAN_LIMIT) * 100
                              }%`,
                              background:
                                receipts.length >= FREE_PLAN_LIMIT * 0.8
                                  ? "var(--color-warning)"
                                  : "var(--color-accent-500)",
                            }}
                          />
                        </div>
                        <p
                          className="text-phi-xs mt-1"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
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
                    background: isAtFreeLimit
                      ? "var(--color-warning)"
                      : "var(--color-accent-500)",
                    color: "white",
                  }}
                >
                  <Crown className="w-4 h-4" />
                  {isAtFreeLimit ? "Become a Sponsor" : "View Details"}
                </Link>
              </div>
            </div>
          )}

          {/* Stats Cards - Modern with animations */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-phi-lg mb-phi-xl">
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

          {/* Sponsor Benefits Section */}
          {hasRetreatPlan && (
            <div
              className="rounded-phi-lg border mb-phi-xl overflow-hidden"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div
                className="p-phi-lg border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-phi">
                  <Crown
                    className="w-5 h-5"
                    style={{ color: "var(--color-accent-500)" }}
                  />
                  <h2
                    className="text-phi-lg font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Your Sponsor Benefits
                  </h2>
                </div>
              </div>

              <div className="p-phi-lg">
                <p
                  className="text-phi-sm mb-phi-lg"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Thank you for supporting Retreat! Here's what you get as a
                  sponsor:
                </p>
                <div className="grid md:grid-cols-3 gap-phi-lg">
                  <div className="text-center">
                    <div
                      className="icon-phi-xl rounded-phi-lg flex items-center justify-center mx-auto mb-phi"
                      style={{ background: "var(--color-accent-500)" }}
                    >
                      <Receipt className="w-8 h-8 text-white" />
                    </div>
                    <h3
                      className="text-phi-base font-semibold mb-phi"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Unlimited Receipts
                    </h3>
                    <p
                      className="text-phi-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Store as many receipts as you need without the 10 receipt
                      limit
                    </p>
                  </div>

                  <div className="text-center">
                    <div
                      className="icon-phi-xl rounded-phi-lg flex items-center justify-center mx-auto mb-phi"
                      style={{ background: "var(--color-success)" }}
                    >
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <h3
                      className="text-phi-base font-semibold mb-phi"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Export Data
                    </h3>
                    <p
                      className="text-phi-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Export your receipts and data in multiple formats
                    </p>
                  </div>

                  <div className="text-center">
                    <div
                      className="icon-phi-xl rounded-phi-lg flex items-center justify-center mx-auto mb-phi"
                      style={{ background: "var(--color-warning)" }}
                    >
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3
                      className="text-phi-base font-semibold mb-phi"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Priority Support
                    </h3>
                    <p
                      className="text-phi-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Get superior help directly from the developer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Add Button */}
          <div className="flex flex-col sm:flex-row gap-phi mb-phi-lg items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 z-10"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border focus-ring transition-all duration-200 pl-12 pr-4"
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
            <div className="flex items-center gap-phi">
              {/* Receipt count indicator for free users */}
              {!hasRetreatPlan && (
                <div
                  className="text-phi-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span
                    className="font-medium"
                    style={{
                      color:
                        receipts.length >= FREE_PLAN_LIMIT
                          ? "var(--color-warning)"
                          : "var(--color-text-primary)",
                    }}
                  >
                    {receipts.length}/{FREE_PLAN_LIMIT}
                  </span>{" "}
                  receipts
                </div>
              )}

              {/* Show "Become a Sponsor" only when at limit */}
              {isAtFreeLimit ? (
                <Link
                  to="/pricing"
                  className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-phi whitespace-nowrap border-0"
                  style={{
                    height: "var(--input-height-sm)",
                    minWidth: "auto",
                    padding: "0 var(--space-lg)",
                    fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-full)",
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                  }}
                >
                  <Lock className="w-5 h-5" />
                  <span>Become a Sponsor</span>
                </Link>
              ) : (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-phi whitespace-nowrap border-0"
                  style={{
                    height: "var(--input-height-sm)",
                    minWidth: "auto",
                    padding: "0 var(--space-lg)",
                    fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-full)",
                    background:
                      "linear-gradient(135deg, var(--color-accent-500), var(--color-accent-600))",
                    color: "white",
                    boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
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
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h2
                className="text-phi-lg font-semibold"
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
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-phi">
                        <div className="flex items-start gap-3 md:gap-phi flex-1">
                          <div
                            className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center border flex-shrink-0"
                            style={{
                              background: "var(--color-bg-primary)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            <Receipt
                              className="w-6 h-6 md:w-8 md:h-8"
                              style={{ color: "var(--color-text-tertiary)" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-sm md:text-phi-md font-semibold truncate"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {receipt.item}
                            </h3>
                            <p
                              className="text-xs md:text-phi-base mt-1"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {receipt.store}
                            </p>
                            <p
                              className="text-xs md:text-phi-sm mt-1"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              Purchased:{" "}
                              {new Date(
                                receipt.purchase_date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:gap-phi">
                          <div className="flex items-center gap-2">
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
                                  <span className="capitalize">
                                    {receipt.status}
                                  </span>
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2 md:gap-phi">
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
                              className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover-lift border"
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
              background: "var(--color-bg-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-phi-md font-semibold mb-phi-lg"
              style={{ color: "var(--color-text-primary)" }}
            >
              How to Add Receipts
            </h3>
            <div className="grid md:grid-cols-2 gap-phi-lg">
              <div>
                <h4
                  className="font-medium text-phi-base mb-phi"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Email Forwarding (Recommended)
                </h4>
                <p
                  className="text-phi-sm mb-phi"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Forward any purchase email to:
                </p>
                <code
                  className="px-phi py-phi rounded-phi-sm text-phi-sm inline-block font-mono"
                  style={{
                    background: "var(--color-info-bg)",
                    color: "var(--color-accent-400)",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                  }}
                >
                  save@receiptlocker.com
                </code>
              </div>
              <div>
                <h4
                  className="font-medium text-phi-base mb-phi"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Manual Upload
                </h4>
                <p
                  className="text-phi-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Upload PDF receipts or paste email text manually using the
                  "Add Receipt" button above.
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
              className="p-phi-lg border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h3
                className="text-phi-md font-semibold text-center"
                style={{ color: "var(--color-text-primary)" }}
              >
                Add New Receipt
              </h3>
            </div>
            <div className="p-phi-xl">
              <div className="space-y-phi-lg">
                <div>
                  <label
                    className="block text-phi-base font-medium mb-phi text-center"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Upload PDF Receipt
                  </label>
                  <div
                    className="border-2 border-dashed rounded-phi-lg p-phi-xl text-center transition-all duration-200 cursor-pointer group mx-auto"
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
                    className="block text-phi-base font-medium mb-phi text-center"
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
                    className="w-full px-phi py-phi border rounded-phi-md focus-ring text-phi-base mx-auto"
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
              </div>

              <div className="flex gap-phi mt-phi-lg justify-center">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="btn-phi-md border font-medium hover-lift transition-all duration-200"
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
                  className="btn-phi-md font-medium hover-lift transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="card-modern max-w-md w-full p-phi-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-phi-lg"
                style={{
                  background: "var(--color-danger-bg)",
                  border: "2px solid var(--color-danger)",
                }}
              >
                <Trash2
                  className="w-8 h-8"
                  style={{ color: "var(--color-danger)" }}
                />
              </div>
              <h3
                className="text-phi-lg font-semibold mb-phi"
                style={{ color: "var(--color-text-primary)" }}
              >
                Delete Receipt?
              </h3>
              <p
                className="text-phi-base mb-phi-lg"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Are you sure you want to delete this receipt? This action cannot
                be undone.
              </p>
              <div className="flex gap-phi justify-center">
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
    </div>
  );
}
