import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const jerseySizes = ["XS", "S", "M", "L", "XL", "XXL"];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#293b55] bg-[#050817] px-4 py-3 text-white outline-none transition focus:border-[#f4c34e]";

const labelClass = "mt-4 block text-sm font-medium text-[#c0ccdc]";

const formatLabel = (value) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [tournaments, setTournaments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [utr, setUtr] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

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
    preferredJerseySize: "",

    // Team owner details
    teamName: "",
    coOwnerName: "",
    coOwnerPhone: "",
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

      // Keep player full name in sync with account name.
      // Do not overwrite it with the team name for team owners.
      ...(name === "name" && prev.role === "player" ? { fullName: value } : {}),
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.password || form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!form.tournamentId) {
      setError("Please select a tournament.");
      return;
    }

    if (form.role === "player") {
      if (!utr.trim()) {
        setError("Please enter your UTR number.");
        return;
      }

      if (!paymentScreenshot) {
        setError("Please upload your payment screenshot.");
        return;
      }

      if (!form.preferredJerseySize) {
        setError("Please select your jersey size.");
        return;
      }

      const jerseyNumber = Number(form.preferredJerseyNumber);

      if (
        !Number.isInteger(jerseyNumber) ||
        jerseyNumber < 1 ||
        jerseyNumber > 99
      ) {
        setError("Please enter a jersey number between 1 and 99.");
        return;
      }
    }

    if (form.role === "team_owner" && !form.teamName.trim()) {
      setError("Please enter your team name.");
      return;
    }

    setBusy(true);

    try {
      // STEP 1: Register account
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
      });

      // STEP 2: Team owner flow
      if (form.role === "team_owner") {
        // Create team application
        const teamPayload = {
          tournamentId: form.tournamentId,
          name: form.teamName.trim(),
          coOwnerName: form.coOwnerName.trim(),
          coOwnerPhone: form.coOwnerPhone.trim(),
        };

        const teamResponse = await api.post("/registrations/team", teamPayload);

        console.log("Team created:", teamResponse.data);

        // Submit team payment proof
        const paymentData = new FormData();
        paymentData.append("utr", utr.trim());
        paymentData.append("screenshot", paymentScreenshot);

        const paymentResponse = await api.post(
          "/team-payment/submit-proof",
          paymentData,
        );

        console.log("Team payment proof submitted:", paymentResponse.data);

        alert(
          paymentResponse.data?.message ||
            "Team application and payment proof submitted successfully!",
        );

        navigate("/registration", {
          replace: true,
          state: {
            message:
              "Your team application and payment proof have been submitted. Awaiting admin verification.",
          },
        });

        return;
      }

      // STEP 3: Create player application
      const playerPayload = {
        tournamentId: form.tournamentId,
        fullName: form.fullName.trim() || form.name.trim(),
        category: form.category,
        role: form.playingRole,
        battingStyle: form.battingStyle,
        bowlingStyle: form.bowlingStyle,
        preferredJerseyNumber: Number(form.preferredJerseyNumber),
        preferredJerseySize: form.preferredJerseySize,
      };

      const playerResponse = await api.post(
        "/registrations/player",
        playerPayload,
      );

      console.log("Player created:", playerResponse.data);

      // STEP 4: Submit UTR and screenshot
      const paymentData = new FormData();

      paymentData.append("utr", utr.trim());
      paymentData.append("screenshot", paymentScreenshot);

      const paymentResponse = await api.post(
        "/player-payment/submit-proof",
        paymentData,
      );

      console.log("Payment proof submitted:", paymentResponse.data);

      alert(
        paymentResponse.data?.message ||
          "Registration and payment proof submitted successfully!",
      );

      navigate("/registration", {
        replace: true,
        state: {
          message:
            "Your registration and payment proof have been submitted. Your application is awaiting verification.",
        },
      });
    } catch (err) {
      console.error("Registration submission error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Registration failed. Please try again.";

      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const REGISTRATION_FEES = {
    player: 1200,
    team_owner: 15000,
  };

  const registrationFee = REGISTRATION_FEES[form.role];

  return (
    <div className="min-h-screen bg-[#050817] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4c34e] text-2xl font-black text-[#101827]">
            S
          </div>

          <p className="mt-3 font-bold text-[#f4c34e]">SACL 2.0</p>

          <h1 className="mt-2 text-3xl font-black">Registration</h1>

          <p className="mt-2 text-sm text-[#a6b4c8]">
            Create your account and complete your registration.
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

          {/* REGISTRATION FEE */}
          <section className="mt-6 rounded-2xl border border-[#f4c34e]/30 bg-[#f4c34e]/10 p-5">
            <p className="text-sm font-semibold text-[#c0ccdc]">
              {form.role === "player"
                ? "Player Registration Fee"
                : "Team Owner Registration Fee"}
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-3xl font-black text-[#f4c34e]">
                  ₹{registrationFee.toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-xs text-[#a6b4c8]">
                  One-time registration fee
                </p>
              </div>

              <span className="rounded-full bg-[#f4c34e]/15 px-3 py-2 text-xs font-bold text-[#f4c34e]">
                {form.role === "player" ? "PLAYER" : "TEAM OWNER"}
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#c0ccdc]">
              Please pay the exact amount shown above using the official SACL QR
              code. Your registration will be verified after payment
              confirmation.
            </p>
          </section>

          {form.role === "player" ? (
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
                      Preferred Jersey Size
                      <select
                        required
                        name="preferredJerseySize"
                        value={form.preferredJerseySize}
                        onChange={change}
                        className={inputClass}
                      >
                        <option value="">Select jersey size</option>

                        {jerseySizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClass}>
                      Preferred Jersey Number
                      <input
                        type="number"
                        min="1"
                        max="99"
                        placeholder="45"
                        required
                        name="preferredJerseyNumber"
                        value={form.preferredJerseyNumber}
                        onChange={change}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )}
              </section>

              {/* PLAYER PAYMENT */}
              <section className="mt-8 rounded-2xl border border-[#f4c34e]/20 bg-[#1b2d45] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#f4c34e]">
                      3. Registration Payment
                    </h2>

                    <p className="mt-1 text-sm text-[#a6b4c8]">
                      Scan the official SACL QR code and pay{" "}
                      <strong className="text-[#f4c34e]">
                        ₹{registrationFee.toLocaleString("en-IN")}
                      </strong>{" "}
                      to complete your registration.
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
                      src="/images/sacl-payment-qr.jpeg"
                      alt="SACL registration payment QR code"
                      className="mx-auto aspect-square w-full max-w-[250px] rounded-lg object-contain"
                      onError={(e) => {
                        console.error("QR image failed:", e.currentTarget.src);
                      }}
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

                {/* UTR AND SCREENSHOT */}
                <div className="mt-6 space-y-5">
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
                </div>
              </section>
            </>
          ) : (
            <>
              {/* TEAM OWNER DETAILS */}
              <section className="mt-8 border-t border-[#293b55] pt-6">
                <h2 className="text-lg font-bold text-[#f4c34e]">
                  2. Team Owner Details
                </h2>

                {loadingOptions ? (
                  <p className="mt-4 text-sm text-[#a6b4c8]">
                    Loading tournaments...
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

                    <label className={`${labelClass} sm:col-span-2`}>
                      Team Name
                      <input
                        required
                        name="teamName"
                        value={form.teamName}
                        onChange={change}
                        className={inputClass}
                        placeholder="Enter team name"
                      />
                    </label>

                    <label className={labelClass}>
                      Primary Owner Name
                      <input
                        required
                        name="fullName"
                        value={form.fullName}
                        onChange={change}
                        className={inputClass}
                        placeholder="Enter owner name"
                      />
                    </label>

                    <label className={labelClass}>
                      Owner Email Address
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={change}
                        className={inputClass}
                        placeholder="Enter email address"
                      />
                    </label>

                    <label className={labelClass}>
                      Owner Phone Number
                      <input
                        required
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={change}
                        className={inputClass}
                        placeholder="Enter phone number"
                        pattern="[+]?[0-9\s()-]{10,15}"
                      />
                    </label>

                    <label className={labelClass}>
                      Co-owner Name
                      <input
                        name="coOwnerName"
                        value={form.coOwnerName}
                        onChange={change}
                        className={inputClass}
                        placeholder="Enter co-owner name"
                      />
                    </label>

                    <label className={labelClass}>
                      Co-owner Phone
                      <input
                        name="coOwnerPhone"
                        type="tel"
                        value={form.coOwnerPhone}
                        onChange={change}
                        className={inputClass}
                        placeholder="Enter co-owner phone"
                      />
                    </label>
                  </div>
                )}
              </section>

              {/* PLAYER PAYMENT */}
              <section className="mt-8 rounded-2xl border border-[#f4c34e]/20 bg-[#1b2d45] p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#f4c34e]">
                      3. Registration Payment
                    </h2>

                    <p className="mt-1 text-sm text-[#a6b4c8]">
                      Scan the official SACL QR code and pay{" "}
                      <strong className="text-[#f4c34e]">
                        ₹{registrationFee.toLocaleString("en-IN")}
                      </strong>{" "}
                      to complete your registration.
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
                      src="/images/sacl-payment-qr.jpeg"
                      alt="SACL registration payment QR code"
                      className="mx-auto aspect-square w-full max-w-[250px] rounded-lg object-contain"
                      onError={(e) => {
                        console.error("QR image failed:", e.currentTarget.src);
                      }}
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
                        Upload the payment details screenshot with UTR and enter
                        your UTR below.
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

                {/* UTR AND SCREENSHOT */}
                <div className="mt-6 space-y-5">
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
                </div>
              </section>
            </>
          )}

          <button
            type="submit"
            disabled={busy || loadingOptions}
            className="mt-7 w-full rounded-xl bg-[#f4c34e] py-4 font-black text-[#101827] transition hover:bg-[#ffd36a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy
              ? "Submitting Registration..."
              : form.role === "player"
                ? "Submit Registration & Payment Proof"
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
