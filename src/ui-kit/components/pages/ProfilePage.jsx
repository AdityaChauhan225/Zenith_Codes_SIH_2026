/**
 * ProfilePage — Universal user profile edit page template.
 *
 * Props:
 *   title       — page heading (default: "My Profile")
 *   profile     — { name, email, phone, avatar?, role? }
 *   onSave      — async (updatedProfile) => void
 *   extraFields — array of { key, label, type?: "text"|"email"|"tel"|"select", options?: [{value,label}] }
 *   loading     — bool
 *   saved       — bool — shows success state
 */
import React, { useState } from "react";
import { Save, User } from "lucide-react";

export function ProfilePage({
  title = "My Profile",
  profile: initialProfile = {},
  onSave,
  extraFields = [],
  loading = false,
  saved = false,
}) {
  const [form, setForm] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputClass = "w-full bg-neutral-800/60 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>

      {/* Avatar */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 flex items-center gap-5">
        <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center shrink-0">
          {form.avatar ? (
            <img src={form.avatar} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-neutral-500" />
          )}
        </div>
        <div>
          <div className="text-lg font-bold text-white">{form.name || "Your Name"}</div>
          {form.role && <div className="text-sm text-neutral-500">{form.role}</div>}
          {form.email && <div className="text-xs text-neutral-600 mt-1">{form.email}</div>}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Full Name</label>
            <input type="text" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Full Name" />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Phone</label>
            <input type="tel" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="Phone Number" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Email</label>
          <input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="Email Address" />
        </div>

        {extraFields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{field.label}</label>
            {field.type === "select" ? (
              <select value={form[field.key] ?? ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className={inputClass}>
                {(field.options ?? []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <input type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className={inputClass} placeholder={field.label} />
            )}
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition ${success ? "bg-emerald-500 text-white" : "bg-[#145C8C] text-black hover:bg-white"} disabled:opacity-50`}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
