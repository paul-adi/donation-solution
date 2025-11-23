"use client";

import { useState, useEffect } from "react";

interface WithdrawalFormData {
  campaignId: string;
  withdrawalAmount: string;
  recipientAddress: string;
  withdrawalReason: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  withdrawalId?: string;
}

// Dummy campaigns data (in real app, this would come from API)
const dummyCampaigns = [
  { id: "1", title: "Help Build a School", balance: "15000" },
  { id: "2", title: "Medical Fund for Children", balance: "8500" },
  { id: "3", title: "Disaster Relief Fund", balance: "25000" },
  { id: "4", title: "Community Garden Project", balance: "3200" },
];

// Dummy API function
async function createWithdrawalAPI(
  data: WithdrawalFormData & { beneficiaryAddress: string }
): Promise<ApiResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate API response
  const mockWithdrawalId = `withdrawal_${Date.now()}`;

  // Simulate random success/failure for demo purposes
  const success = Math.random() > 0.1; // 90% success rate

  if (success) {
    return {
      success: true,
      message: "Withdrawal request submitted successfully!",
      withdrawalId: mockWithdrawalId,
    };
  } else {
    return {
      success: false,
      message: "Failed to submit withdrawal request. Please try again.",
    };
  }
}

export default function WithdrawalPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    campaignId: "",
    withdrawalAmount: "",
    recipientAddress: "",
    withdrawalReason: "",
  });

  const [availableBalance, setAvailableBalance] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Check wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      const ethereum = (window as any)?.ethereum;
      if (!ethereum) {
        setConnectedAddress(null);
        return;
      }

      try {
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts?.length) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress(null);
        }
      } catch (e) {
        setConnectedAddress(null);
      }
    };

    checkWalletConnection();

    // Listen for account changes
    const ethereum = (window as any)?.ethereum;
    if (ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts?.length) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress(null);
        }
      };

      ethereum.on?.("accountsChanged", handleAccountsChanged);

      return () => {
        ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      };
    }
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    // For withdrawalAmount, only allow numbers with optional decimals
    if (name === "withdrawalAmount") {
      const numValue = value.replace(/[^0-9.]/g, "");
      // Prevent multiple decimal points
      const parts = numValue.split(".");
      const formattedValue =
        parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : numValue;
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else if (name === "campaignId") {
      // Update available balance when campaign is selected
      const selectedCampaign = dummyCampaigns.find((c) => c.id === value);
      setAvailableBalance(selectedCampaign?.balance || null);
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectedAddress) {
      setSubmitStatus({
        type: "error",
        message: "Please connect your wallet first",
      });
      return;
    }

    if (!formData.campaignId) {
      setSubmitStatus({
        type: "error",
        message: "Please select a campaign",
      });
      return;
    }

    // Validate withdrawal amount doesn't exceed available balance
    if (availableBalance && formData.withdrawalAmount) {
      const withdrawalAmount = parseFloat(formData.withdrawalAmount);
      const balance = parseFloat(availableBalance);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        setSubmitStatus({
          type: "error",
          message: "Please enter a valid withdrawal amount",
        });
        return;
      }
      if (withdrawalAmount > balance) {
        setSubmitStatus({
          type: "error",
          message: `Withdrawal amount exceeds available balance of ${balance.toLocaleString()} USDC`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Use connected address as beneficiary
      const dataWithBeneficiary = {
        ...formData,
        beneficiaryAddress: connectedAddress,
      };
      const response = await createWithdrawalAPI(dataWithBeneficiary);

      if (response.success) {
        setSubmitStatus({
          type: "success",
          message: `${response.message} Withdrawal ID: ${response.withdrawalId}`,
        });
        // Reset form on success
        setFormData({
          campaignId: "",
          withdrawalAmount: "",
          recipientAddress: "",
          withdrawalReason: "",
        });
        setAvailableBalance(null);
      } else {
        setSubmitStatus({
          type: "error",
          message: response.message,
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      {/* PAGE CONTENT */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Withdrawal Request
        </h1>
        <p style={{ color: "#64748b", fontSize: 16 }}>
          Request a withdrawal from your campaign
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Select Campaign */}
        <div>
          <label
            htmlFor="campaignId"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Select Your Campaign *
          </label>
          <select
            id="campaignId"
            name="campaignId"
            value={formData.campaignId}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 16,
              backgroundColor: "#ffffff",
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            <option value="">-- Select a campaign --</option>
            {dummyCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
          {availableBalance && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 14, color: "#0c4a6e", fontWeight: 500 }}>
                Available Balance:
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: "#0369a1",
                  fontWeight: 700,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {parseFloat(availableBalance).toLocaleString()} USDC
              </span>
            </div>
          )}
        </div>

        {/* Withdrawal Amount */}
        <div>
          <label
            htmlFor="withdrawalAmount"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Withdrawal Amount (USDC) *
          </label>
          <input
            type="text"
            id="withdrawalAmount"
            name="withdrawalAmount"
            value={formData.withdrawalAmount}
            onChange={handleChange}
            required
            placeholder="0"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 16,
              backgroundColor: "#ffffff",
              color: "#0f172a",
            }}
          />
        </div>

        {/* Recipient Wallet Address */}
        <div>
          <label
            htmlFor="recipientAddress"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Recipient Wallet Address *
          </label>
          <input
            type="text"
            id="recipientAddress"
            name="recipientAddress"
            value={formData.recipientAddress}
            onChange={handleChange}
            required
            placeholder="0x..."
            pattern="^0x[a-fA-F0-9]{40}$"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 16,
              fontFamily: "ui-monospace, monospace",
              backgroundColor: "#ffffff",
              color: "#0f172a",
            }}
          />
          <p style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
            Ethereum address (0x followed by 40 hex characters)
          </p>
        </div>

        {/* Withdrawal Reason */}
        <div>
          <label
            htmlFor="withdrawalReason"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Withdrawal Reason *
          </label>
          <textarea
            id="withdrawalReason"
            name="withdrawalReason"
            value={formData.withdrawalReason}
            onChange={handleChange}
            required
            placeholder="Explain the reason for this withdrawal..."
            rows={6}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 16,
              fontFamily: "inherit",
              resize: "vertical",
              backgroundColor: "#ffffff",
              color: "#0f172a",
            }}
          />
        </div>

        {/* Withdrawal Summary */}
        {formData.withdrawalAmount &&
          parseFloat(formData.withdrawalAmount) > 0 && (
            <div
              style={{
                padding: "20px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}
                >
                  Withdrawal Amount
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: "#0f172a",
                    fontWeight: 600,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {parseFloat(formData.withdrawalAmount).toLocaleString()} USDC
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}
                >
                  Transaction Fee
                </span>
                <span
                  style={{
                    fontSize: 16,
                    color: "#0f172a",
                    fontWeight: 600,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  ~
                  {(parseFloat(formData.withdrawalAmount) * 0.1).toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  )}{" "}
                  USDC
                </span>
              </div>
              <div
                style={{
                  paddingTop: 16,
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{ fontSize: 16, color: "#0f172a", fontWeight: 700 }}
                >
                  You will receive
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: "#059669",
                    fontWeight: 700,
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {(
                    parseFloat(formData.withdrawalAmount) -
                    parseFloat(formData.withdrawalAmount) * 0.1
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}{" "}
                  USDC
                </span>
              </div>
            </div>
          )}

        {/* Status Message */}
        {submitStatus.type && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              backgroundColor:
                submitStatus.type === "success" ? "#dcfce7" : "#fee2e2",
              color: submitStatus.type === "success" ? "#166534" : "#991b1b",
              fontSize: 14,
              border: `1px solid ${
                submitStatus.type === "success" ? "#86efac" : "#fca5a5"
              }`,
            }}
          >
            {submitStatus.message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !connectedAddress}
          style={{
            padding: "14px 24px",
            borderRadius: 8,
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            cursor:
              isSubmitting || !connectedAddress ? "not-allowed" : "pointer",
            backgroundColor:
              isSubmitting || !connectedAddress ? "#94a3b8" : "#3b82f6",
            color: "#ffffff",
            transition: "background-color 0.2s",
            opacity: isSubmitting || !connectedAddress ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting && connectedAddress) {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting && connectedAddress) {
              e.currentTarget.style.backgroundColor = "#3b82f6";
            }
          }}
        >
          {!connectedAddress
            ? "Please Connect Wallet"
            : isSubmitting
            ? "Submitting Request..."
            : "Submit Withdrawal Request"}
        </button>
      </form>
    </main>
  );
}
