"use client";

import { useState, useEffect } from "react";

interface CampaignFormData {
  title: string;
  description: string;
  email: string;
  goalAmount: string;
  startDate: string;
  endDate: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  campaignId?: string;
}

// Dummy API function
async function createCampaignAPI(
  data: CampaignFormData & { beneficiaryAddress: string }
): Promise<ApiResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simulate API response
  const mockCampaignId = `campaign_${Date.now()}`;

  // Simulate random success/failure for demo purposes
  const success = Math.random() > 0.1; // 90% success rate

  if (success) {
    return {
      success: true,
      message: "Campaign created successfully!",
      campaignId: mockCampaignId,
    };
  } else {
    return {
      success: false,
      message: "Failed to create campaign. Please try again.",
    };
  }
}

export default function CreateCampaignPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    description: "",
    email: "",
    goalAmount: "",
    startDate: "",
    endDate: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string>("");
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // For goalAmount, only allow whole numbers (no decimals)
    if (name === "goalAmount") {
      const intValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: intValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError("");

    if (!file) {
      setImage(null);
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select a valid image file");
      setImage(null);
      return;
    }

    // Check file size (4MB = 4 * 1024 * 1024 bytes)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      setImageError("Image size must be less than 4MB");
      setImage(null);
      return;
    }

    setImage(file);
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

    // Validate that end date is after start date
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        setSubmitStatus({
          type: "error",
          message: "End date must be after start date",
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
      const response = await createCampaignAPI(dataWithBeneficiary);

      if (response.success) {
        setSubmitStatus({
          type: "success",
          message: `${response.message} Campaign ID: ${response.campaignId}`,
        });
        // Reset form on success
        setFormData({
          title: "",
          description: "",
          email: "",
          goalAmount: "",
          startDate: "",
          endDate: "",
        });
        setImage(null);
        setImageError("");
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
          Create Campaign
        </h1>
        <p style={{ color: "#64748b", fontSize: 16 }}>
          Launch your fundraising campaign on the blockchain
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Campaign Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Help Build a School"
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

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Tell people about your campaign...."
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

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="e.g., email@email.com"
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

        {/* Goal Amount */}
        <div>
          <label
            htmlFor="goalAmount"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Goal Amount (USDC) *
          </label>
          <input
            type="number"
            id="goalAmount"
            name="goalAmount"
            value={formData.goalAmount}
            onChange={handleChange}
            required
            min="0"
            step="1"
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

        {/* Image */}
        <div>
          <label
            htmlFor="image"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Campaign Image
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
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
          {imageError && (
            <p style={{ marginTop: 4, fontSize: 12, color: "#dc2626" }}>
              {imageError}
            </p>
          )}
          {image && !imageError && (
            <p style={{ marginTop: 4, fontSize: 12, color: "#16a34a" }}>
              Image selected: {image.name} (
              {(image.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          <p style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
            Maximum file size: 4MB
          </p>
        </div>

        {/* Start Date & End Date */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <label
              htmlFor="startDate"
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              min={new Date().toISOString().split("T")[0]}
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
          <div>
            <label
              htmlFor="endDate"
              style={{
                display: "block",
                marginBottom: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              min={formData.startDate || new Date().toISOString().split("T")[0]}
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
        </div>

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
            ? "Creating Campaign..."
            : "Create Campaign"}
        </button>
      </form>
    </main>
  );
}
