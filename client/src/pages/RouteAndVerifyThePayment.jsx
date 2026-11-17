// import { useEffect, useState } from "react";
// import { useSearchParams, Link } from "react-router-dom";
// import { api } from "../api/api";

// export default function PhonePeReturn() {
//   const [params] = useSearchParams();
//   const [status, setStatus] = useState("VERIFYING");
//   const [message, setMessage] = useState("Verifying your payment...");

//   useEffect(() => {
//     const verifyPayment = async () => {
//       const merchantOrderId = params.get("merchantOrderId");

//       if (!merchantOrderId) {
//         setStatus("FAILED");
//         setMessage("Payment reference is missing.");
//         return;
//       }

//       try {
//         const { data } = await api.get(
//           `/payments/registration/status/${merchantOrderId}`,
//         );

//         if (data.status === "COMPLETED") {
//           setStatus("COMPLETED");
//           setMessage("Your registration payment was successful.");
//         } else if (data.status === "FAILED") {
//           setStatus("FAILED");
//           setMessage("Payment failed. Please try again.");
//         } else {
//           setStatus("PENDING");
//           setMessage(
//             "Payment is still processing. Please check again shortly.",
//           );
//         }
//       } catch (error) {
//         setStatus("PENDING");
//         setMessage(
//           "We could not verify your payment right now. Please try again.",
//         );
//       }
//     };

//     verifyPayment();
//   }, [params]);

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center p-6">
//       <h1 className="text-2xl font-bold">
//         {status === "COMPLETED"
//           ? "Payment Successful"
//           : status === "FAILED"
//             ? "Payment Failed"
//             : "Payment Verification"}
//       </h1>

//       <p className="mt-3 text-center">{message}</p>

//       <Link to="/dashboard" className="mt-6 underline">
//         Go to Dashboard
//       </Link>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export default function PaymentVerification() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/admin/payments/pending");
      setPlayers(data.players || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load payment submissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const reviewPayment = async (player, action) => {
    let reason = "";

    if (action === "reject") {
      reason = window.prompt("Enter the reason for rejecting this payment:");

      if (!reason?.trim()) return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${action} payment for ${player.fullName}?`,
    );

    if (!confirmed) return;

    try {
      setWorkingId(player._id);

      const { data } = await api.patch(`/admin/payments/${player._id}/review`, {
        action,
        ...(action === "reject" && { reason }),
      });

      alert(data.message);
      await fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || "Unable to review payment.");
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading payment submissions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchPayments}
          className="mt-4 rounded-lg bg-[#f4c34e] px-4 py-2 font-semibold text-[#101827]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payment Verification</h1>
        <p className="mt-1 text-sm text-slate-400">
          Verify UTR numbers and payment screenshots before approving player
          registrations.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1b2d45] p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold text-white">Pending Payments</h2>
          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            {players.length} Pending
          </span>
        </div>

        {players.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No payment submissions waiting for verification.
          </div>
        ) : (
          <div className="grid gap-5">
            {players.map((player) => (
              <div
                key={player._id}
                className="grid gap-5 rounded-xl border border-white/10 bg-[#0d192c] p-4 lg:grid-cols-[1fr_260px]"
              >
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {player.fullName}
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    {player.user?.email || player.user?.phone || "—"}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Tournament: {player.tournament?.name || "—"}
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-slate-300">
                      UTR:
                      <span className="ml-2 font-semibold text-[#f4c34e]">
                        {player.paymentUtr}
                      </span>
                    </p>

                    <p className="text-slate-400">
                      Submitted:{" "}
                      {player.paymentSubmittedAt
                        ? new Date(player.paymentSubmittedAt).toLocaleString()
                        : "—"}
                    </p>

                    <p className="text-slate-400">
                      Payment status:{" "}
                      <span className="text-yellow-400">
                        {player.paymentVerificationStatus}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      disabled={workingId === player._id}
                      onClick={() => reviewPayment(player, "approve")}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Approve Payment
                    </button>

                    <button
                      disabled={workingId === player._id}
                      onClick={() => reviewPayment(player, "reject")}
                      className="rounded-lg bg-red-500/15 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
                    >
                      Reject Payment
                    </button>
                  </div>
                </div>

                <div>
                  {player.paymentScreenshot ? (
                    <a
                      href={player.paymentScreenshot}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <img
                        src={player.paymentScreenshot}
                        alt={`Payment proof from ${player.fullName}`}
                        className="h-56 w-full rounded-xl border border-white/10 bg-white object-contain"
                      />
                      <p className="mt-2 text-center text-xs text-[#f4c34e]">
                        View full screenshot
                      </p>
                    </a>
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-xl border border-white/10 text-sm text-slate-500">
                      No screenshot uploaded
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
