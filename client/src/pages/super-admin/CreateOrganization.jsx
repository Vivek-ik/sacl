import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  UserRound,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Trophy,
} from "lucide-react";
import { api } from "../../lib/api";

const initial = {
  organizationName: "",
  organizationEmail: "",
  organizationPhone: "",
  address: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  plan: "standard",
  billingCycle: "monthly",
};

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async () => {
    try {
      setLoading(true);
      setError("");

      await api.post("/organizations", {
        name: form.organizationName.trim(),
        email: form.organizationEmail.trim().toLowerCase(),
        phone: form.organizationPhone.trim(),
        address: form.address.trim(),
        admin: {
          name: form.adminName.trim(),
          email: form.adminEmail.trim().toLowerCase(),
          phone: form.adminPhone.trim(),
        },
        plan: form.plan,
        billingCycle: form.billingCycle,
      });

      navigate("/super-admin/organizations");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create organization.");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    icon: Icon,
    type = "text",
  }) => (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
          />
        )}
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/10 bg-[#071b16] py-3 pr-4 text-sm outline-none transition focus:border-lime/50 ${Icon ? "pl-10" : "pl-4"}`}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => navigate("/super-admin/organizations")}
        className="mb-6 inline-flex items-center gap-2 text-sm text-emerald-100/50 hover:text-lime"
      >
        <ArrowLeft size={17} /> Back to Organizations
      </button>

      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-lime">
          Platform Management
        </p>
        <h1 className="text-3xl font-black">Create Organization</h1>
        <p className="mt-2 text-sm text-emerald-100/50">
          Register a cricket organization and invite its first administrator.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { number: 1, label: "Organization Details", icon: Building2 },
          { number: 2, label: "Administrator & Plan", icon: UserRound },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.number}
              className={`rounded-xl border p-4 ${
                step === item.number
                  ? "border-lime/40 bg-lime/[0.07]"
                  : "border-white/10 bg-[#0b211a]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-9 w-9 place-items-center rounded-lg ${step === item.number ? "bg-lime text-[#071b16]" : "bg-white/5 text-emerald-100/50"}`}
                >
                  {step > item.number ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Icon size={18} />
                  )}
                </div>
                <div>
                  <p className="text-xs text-emerald-100/40">
                    Step {item.number}
                  </p>
                  <p className="text-sm font-bold">{item.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b211a] p-5 sm:p-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-lime/10 p-3 text-lime">
                <Building2 />
              </div>
              <div>
                <h2 className="font-bold">Organization Information</h2>
                <p className="text-xs text-emerald-100/40">
                  Basic organization details
                </p>
              </div>
            </div>

            <Field
              label="Organization Name"
              value={form.organizationName}
              onChange={(v) => update("organizationName", v)}
              placeholder="e.g. Indore Cricket Association"
              icon={Building2}
            />
            <Field
              label="Organization Email"
              type="email"
              value={form.organizationEmail}
              onChange={(v) => update("organizationEmail", v)}
              placeholder="association@example.com"
              icon={Mail}
            />
            <Field
              label="Organization Phone"
              value={form.organizationPhone}
              onChange={(v) => update("organizationPhone", v)}
              placeholder="+91 98765 43210"
              icon={Phone}
            />
            <Field
              label="Address"
              value={form.address}
              onChange={(v) => update("address", v)}
              placeholder="Organization address"
            />

            <div className="flex justify-end border-t border-white/10 pt-5">
              <button
                onClick={() => setStep(2)}
                disabled={
                  !form.organizationName.trim() ||
                  !form.organizationEmail.trim()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#071b16] disabled:opacity-40"
              >
                Continue <ArrowRight size={17} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-lime/10 p-3 text-lime">
                <UserRound />
              </div>
              <div>
                <h2 className="font-bold">Initial Organization Admin</h2>
                <p className="text-xs text-emerald-100/40">
                  This user will manage the organization.
                </p>
              </div>
            </div>

            <Field
              label="Administrator Name"
              value={form.adminName}
              onChange={(v) => update("adminName", v)}
              placeholder="Full name"
              icon={UserRound}
            />
            <Field
              label="Administrator Email"
              type="email"
              value={form.adminEmail}
              onChange={(v) => update("adminEmail", v)}
              placeholder="admin@example.com"
              icon={Mail}
            />
            <Field
              label="Administrator Phone"
              value={form.adminPhone}
              onChange={(v) => update("adminPhone", v)}
              placeholder="+91 98765 43210"
              icon={Phone}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Subscription Plan
                </label>
                <select
                  value={form.plan}
                  onChange={(e) => update("plan", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#071b16] px-4 py-3 text-sm outline-none focus:border-lime/50"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Billing Cycle
                </label>
                <select
                  value={form.billingCycle}
                  onChange={(e) => update("billingCycle", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#071b16] px-4 py-3 text-sm outline-none focus:border-lime/50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-lime/20 bg-lime/[0.05] p-4">
              <div className="flex items-center gap-2 text-lime">
                <Trophy size={18} />
                <p className="text-sm font-bold">7-day free trial</p>
              </div>
              <p className="mt-1 text-xs text-emerald-100/50">
                The organization starts with a trial. No payment details are
                required at creation.
              </p>
            </div>

            <div className="flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
              <button
                onClick={() => setStep(1)}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={
                  loading || !form.adminName.trim() || !form.adminEmail.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#071b16] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Create Organization
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
