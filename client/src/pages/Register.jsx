import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const categories = ["ICONIC", "A", "B", "C", "D"];

const playingRoles = ["BATTER", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"];

const battingStyles = ["RIGHT_HAND", "LEFT_HAND"];

const bowlingStyles = [
  "NONE",
  "RIGHT_ARM_FAST",
  "RIGHT_ARM_MEDIUM",
  "RIGHT_ARM_OFF_BREAK",
  "RIGHT_ARM_LEG_BREAK",
  "LEFT_ARM_FAST",
  "LEFT_ARM_MEDIUM",
  "LEFT_ARM_ORTHODOX",
  "LEFT_ARM_CHINAMAN",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#293b55] bg-[#050817] px-4 py-3 text-white outline-none transition focus:border-[#f4c34e]";

const labelClass = "mt-4 block text-sm font-medium text-[#c0ccdc]";

const formatLabel = (value) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [tournaments, setTournaments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [utr, setUtr] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const submitPaymentProof = async (e) => {
    e.preventDefault();

    if (!utr.trim()) {
      return alert("Please enter your UTR number.");
    }

    if (!paymentScreenshot) {
      return alert("Please upload your payment screenshot.");
    }

    const formData = new FormData();
    formData.append("utr", utr.trim());
    formData.append("screenshot", paymentScreenshot);

    try {
      setPaymentSubmitting(true);

      const { data } = await api.post("/player-payment/submit-proof", formData);

      setPaymentStatus("submitted");
      alert(data.message);

      // Refresh your existing registration/application data here if needed.
    } catch (error) {
      alert(error.response?.data?.message || "Unable to submit payment proof.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "player",

    // Player application details
    fullName: "",
    tournamentId: "",
    preferredTeamId: "",
    category: "C",
    playingRole: "BATTER",
    battingStyle: "RIGHT_HAND",
    bowlingStyle: "NONE",
    preferredJerseyNumber: "",
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const response = await api.get("/public/tournaments");

        const list = Array.isArray(response.data)
          ? response.data
          : response.data?.tournaments || response.data?.data || [];

        setTournaments(list);

        if (list.length === 1) {
          setForm((prev) => ({
            ...prev,
            tournamentId: list[0]._id,
          }));
        }
      } catch (error) {
        console.error("Failed to load tournaments:", error);
        setError("Could not load tournaments.");
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, []);

  function change(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" ? { fullName: value } : {}),
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // STEP 1: Create account and log the user in.
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });

      const user = JSON.parse(localStorage.getItem("sacl_user") || "null");

      if (!user) {
        throw new Error("Account created, but user session was not found.");
      }

      // Team owner continues through the existing team registration flow.
      if (form.role === "team_owner") {
        navigate("/registration", { replace: true });
        return;
      }

      // STEP 2: Create player application.
      const playerPayload = {
        tournamentId: form.tournamentId,
        fullName: form.fullName || form.name,
        category: form.category,
        role: form.playingRole,
        battingStyle: form.battingStyle,
        bowlingStyle: form.bowlingStyle,
        preferredJerseyNumber: Number(form.preferredJerseyNumber),
      };
      await api.post("/registrations/player", playerPayload);

      // STEP 3: Create PhonePe payment order.
      const paymentResponse = await api.post("/payments/registration/create", {
        kind: "player",
      });

      const redirectUrl = paymentResponse.data?.redirectUrl;

      if (!redirectUrl) {
        throw new Error(
          "Application created, but payment checkout URL was not returned.",
        );
      }

      // STEP 4: Redirect to PhonePe.
      window.location.assign(redirectUrl);
    } catch (err) {
      console.error("Signup error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";

      setError(message);

      // If the account and application were already created,
      // take the player to their application instead of asking
      // them to create another account.
      const user = JSON.parse(localStorage.getItem("sacl_user") || "null");

      if (user) {
        // The application may already exist; the application page
        // should provide a retry payment action.
        if (err.response?.status !== 401) {
          // Keep the error visible on the signup page for now.
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050817] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4c34e] text-2xl font-black text-[#101827]">
            S
          </div>

          <p className="mt-3 font-bold text-[#f4c34e]">SACL 2.0</p>

          <h1 className="mt-2 text-3xl font-black">Player Registration</h1>

          <p className="mt-2 text-sm text-[#a6b4c8]">
            Create your account, complete your player profile and pay your
            registration fee.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl border border-[#293b55] bg-[#0d192c] p-5 shadow-2xl sm:p-8"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* ACCOUNT DETAILS */}
          <section>
            <h2 className="text-lg font-bold text-[#f4c34e]">
              1. Account Details
            </h2>

            <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
              <label className={labelClass}>
                Full Name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={change}
                  className={inputClass}
                  placeholder="Enter your full name"
                />
              </label>

              <label className={labelClass}>
                Phone Number
                <input
                  required
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={change}
                  className={inputClass}
                  placeholder="Enter phone number"
                />
              </label>

              <label className={labelClass}>
                Email Address (optional)
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={change}
                  className={inputClass}
                  placeholder="Enter email address"
                />
              </label>

              <label className={labelClass}>
                Password
                <input
                  required
                  name="password"
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={change}
                  className={inputClass}
                  placeholder="Minimum 8 characters"
                />
              </label>
            </div>

            <label className={labelClass}>
              Register As
              <select
                name="role"
                value={form.role}
                onChange={change}
                className={inputClass}
              >
                <option value="player">Player</option>
                <option value="team_owner">Team Owner</option>
              </select>
            </label>
          </section>

          {form.role === "player" && (
            <>
              {/* PLAYER DETAILS */}
              <section className="mt-8 border-t border-[#293b55] pt-6">
                <h2 className="text-lg font-bold text-[#f4c34e]">
                  2. Player Profile
                </h2>

                {loadingOptions ? (
                  <p className="mt-4 text-sm text-[#a6b4c8]">
                    Loading tournaments and teams...
                  </p>
                ) : (
                  <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
                    <label className={`${labelClass} sm:col-span-2`}>
                      Select Tournament
                      <select
                        required
                        name="tournamentId"
                        value={form.tournamentId}
                        onChange={change}
                        className={inputClass}
                      >
                        <option value="">Select tournament</option>
                        {tournaments.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClass}>
                      Player Category
                      <select
                        name="category"
                        value={form.category}
                        onChange={change}
                        className={inputClass}
                      >
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClass}>
                      Playing Role
                      <select
                        name="playingRole"
                        value={form.playingRole}
                        onChange={change}
                        className={inputClass}
                      >
                        {playingRoles.map((item) => (
                          <option key={item} value={item}>
                            {formatLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClass}>
                      Batting Style
                      <select
                        name="battingStyle"
                        value={form.battingStyle}
                        onChange={change}
                        className={inputClass}
                      >
                        {battingStyles.map((item) => (
                          <option key={item} value={item}>
                            {formatLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClass}>
                      Bowling Style
                      <select
                        name="bowlingStyle"
                        value={form.bowlingStyle}
                        onChange={change}
                        className={inputClass}
                      >
                        {bowlingStyles.map((item) => (
                          <option key={item} value={item}>
                            {formatLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClass}>
                      Preferred Jersey Number
                      <select
                        required
                        name="preferredJerseyNumber"
                        value={form.preferredJerseyNumber}
                        onChange={change}
                        className={inputClass}
                      >
                        <option value="">Select jersey number</option>
                        {Array.from({ length: 99 }, (_, i) => i + 1).map(
                          (number) => (
                            <option key={number} value={number}>
                              {number}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                )}
              </section>

              {/* PAYMENT */}
              {/* <section className="mt-8 rounded-2xl border border-[#f4c34e]/20 bg-[#1b2d45] p-5">
                <h2 className="text-lg font-bold text-[#f4c34e]">
                  3. Registration Payment
                </h2>

                <p className="mt-2 text-sm text-[#a6b4c8]">
                  Complete your registration payment securely through PhonePe.
                  Your application will be sent for admin approval after
                  payment.
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-[#c0ccdc]">
                    Registration Fee
                  </span>
                  <span className="text-xl font-black text-[#f4c34e]">
                    Payable at checkout
                  </span>
                </div>
              </section> */}

              {/* PAYMENT */}
              <section className="mt-8 rounded-2xl border border-[#f4c34e]/20 bg-[#1b2d45] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#f4c34e]">
                      3. Registration Payment
                    </h2>
                    <p className="mt-1 text-sm text-[#a6b4c8]">
                      Scan the official SACL QR code to complete your
                      registration payment.
                    </p>
                  </div>

                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                    Manual verification
                  </span>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* QR CODE */}
                  <div className="rounded-xl border border-white/10 bg-white p-4 text-center">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      Scan & Pay using UPI
                    </h3>

                    <img
                      src="/public/images/sacl-payment-qr.jpeg"
                      alt="SACL registration payment QR code"
                      className="mx-auto aspect-square w-full max-w-[250px] rounded-lg object-contain"
                    />

                    <p className="mt-3 text-xs text-slate-500">
                      Scan this QR code using Google Pay, PhonePe, Paytm or any
                      UPI app.
                    </p>
                  </div>

                  {/* PAYMENT INSTRUCTIONS */}
                  <div className="flex flex-col justify-center">
                    <h3 className="font-semibold text-white">
                      Payment instructions
                    </h3>

                    <ol className="mt-3 space-y-3 text-sm text-[#a6b4c8]">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4c34e]/15 text-xs font-bold text-[#f4c34e]">
                          1
                        </span>
                        Scan the SACL QR code using your UPI app.
                      </li>

                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4c34e]/15 text-xs font-bold text-[#f4c34e]">
                          2
                        </span>
                        Pay the registration fee shown by the app.
                      </li>

                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4c34e]/15 text-xs font-bold text-[#f4c34e]">
                          3
                        </span>
                        Copy the UTR / transaction reference number.
                      </li>

                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f4c34e]/15 text-xs font-bold text-[#f4c34e]">
                          4
                        </span>
                        Upload the payment screenshot and enter your UTR below.
                      </li>
                    </ol>

                    <div className="mt-5 rounded-xl border border-[#f4c34e]/20 bg-[#f4c34e]/5 p-3">
                      <p className="text-xs leading-5 text-[#f4c34e]">
                        Your payment will remain pending until the SACL admin
                        verifies the transaction. Do not submit someone else's
                        UTR or payment screenshot.
                      </p>
                    </div>
                  </div>
                </div>

                {/* UTR AND SCREENSHOT FORM */}
                <form onSubmit={submitPaymentProof} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      UTR / Transaction Reference Number
                    </label>

                    <input
                      type="text"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter your 12-digit UTR / reference number"
                      maxLength={30}
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#050817] px-4 py-3 text-sm text-white outline-none transition focus:border-[#f4c34e]"
                    />

                    <p className="mt-1 text-xs text-[#a6b4c8]">
                      You can find this number in your successful UPI
                      transaction details.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-white">
                      Payment Screenshot
                    </label>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      required
                      onChange={(e) =>
                        setPaymentScreenshot(e.target.files?.[0] || null)
                      }
                      className="block w-full cursor-pointer rounded-xl border border-white/10 bg-[#050817] p-3 text-sm text-[#a6b4c8] file:mr-4 file:rounded-lg file:border-0 file:bg-[#f4c34e] file:px-4 file:py-2 file:font-bold file:text-[#101827]"
                    />

                    <p className="mt-1 text-xs text-[#a6b4c8]">
                      Upload a clear screenshot of the successful transaction
                      (maximum 5 MB).
                    </p>
                  </div>

                  {paymentScreenshot && (
                    <div className="rounded-xl border border-white/10 bg-[#050817] p-3">
                      <p className="mb-2 text-xs text-[#a6b4c8]">
                        Selected screenshot
                      </p>

                      <p className="truncate text-sm text-white">
                        {paymentScreenshot.name}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f4c34e] px-5 py-3 font-bold text-[#101827] transition hover:bg-[#e6b638] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {paymentSubmitting
                      ? "Submitting payment proof..."
                      : "Submit Payment Proof"}
                  </button>
                </form>
              </section>
            </>
          )}

          <button
            type="submit"
            disabled={busy || (form.role === "player" && loadingOptions)}
            className="mt-7 w-full rounded-xl bg-[#f4c34e] py-4 font-black text-[#101827] transition hover:bg-[#ffd36a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Processing..."
              : form.role === "player"
                ? "Create Account & Pay Registration Fee"
                : "Create Team Owner Account"}
          </button>

          <p className="mt-5 text-center text-sm text-[#a6b4c8]">
            Already registered?{" "}
            <Link to="/login" className="font-bold text-[#f4c34e]">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-[#a6b4c8]">
            Registering a cricket association?{" "}
            <Link
              to="/organization/register"
              className="font-bold text-[#f4c34e]"
            >
              Register your organization
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
