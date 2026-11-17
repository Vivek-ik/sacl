import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api/api";

export default function PhonePeReturn() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("VERIFYING");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      const merchantOrderId = params.get("merchantOrderId");

      if (!merchantOrderId) {
        setStatus("FAILED");
        setMessage("Payment reference is missing.");
        return;
      }

      try {
        const { data } = await api.get(
          `/payments/registration/status/${merchantOrderId}`,
        );

        if (data.status === "COMPLETED") {
          setStatus("COMPLETED");
          setMessage("Your registration payment was successful.");
        } else if (data.status === "FAILED") {
          setStatus("FAILED");
          setMessage("Payment failed. Please try again.");
        } else {
          setStatus("PENDING");
          setMessage(
            "Payment is still processing. Please check again shortly.",
          );
        }
      } catch (error) {
        setStatus("PENDING");
        setMessage(
          "We could not verify your payment right now. Please try again.",
        );
      }
    };

    verifyPayment();
  }, [params]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold">
        {status === "COMPLETED"
          ? "Payment Successful"
          : status === "FAILED"
            ? "Payment Failed"
            : "Payment Verification"}
      </h1>

      <p className="mt-3 text-center">{message}</p>

      <Link to="/dashboard" className="mt-6 underline">
        Go to Dashboard
      </Link>
    </div>
  );
}
