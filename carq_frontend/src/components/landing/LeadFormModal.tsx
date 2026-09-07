"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/components/providers/I18nProvider";
import { submitLead, type LeadType } from "@/lib/leads";

interface LeadFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: LeadType;
}

export function LeadFormModal({ open, onOpenChange, type }: LeadFormModalProps) {
  const { t } = useI18n();
  const f = t.forms;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    fleetSize: "",
    industry: "",
    features: "",
    contactMethod: "",
    message: "",
  });

  const title =
    type === "demo" ? f.demoTitle : type === "pricing" ? f.pricingTitle : f.contactTitle;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) {
      toast.error(f.required);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error(f.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      await submitLead({ type, ...form });
      toast.success(f.success);
      onOpenChange(false);
      setForm({
        name: "",
        company: "",
        phone: "",
        email: "",
        fleetSize: "",
        industry: "",
        features: "",
        contactMethod: "",
        message: "",
      });
    } catch {
      toast.error(f.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg)] p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--landing-text)]">{title}</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1 text-[var(--landing-muted)] hover:bg-[var(--landing-surface-hover)] hover:text-[var(--landing-text)]">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label={f.name} required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                required
              />
            </Field>
            <Field label={f.company} required>
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClass}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={f.phone}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label={f.email} required>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  required
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={f.fleetSize}>
                <input
                  value={form.fleetSize}
                  onChange={(e) => setForm({ ...form, fleetSize: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 20"
                />
              </Field>
              <Field label={f.industry}>
                <input
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            {(type === "pricing" || type === "contact") && (
              <Field label={f.features}>
                <input
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className={inputClass}
                />
              </Field>
            )}
            {type === "demo" && (
              <Field label={f.contactMethod}>
                <input
                  value={form.contactMethod}
                  onChange={(e) => setForm({ ...form, contactMethod: e.target.value })}
                  className={inputClass}
                  placeholder="Phone / Email"
                />
              </Field>
            )}
            <Field label={f.message}>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className={`${inputClass} min-h-[80px] resize-y`}
                rows={3}
              />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-cyan-500 py-3 text-sm font-semibold text-[#09090b] hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? "..." : f.submit}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-[var(--landing-muted)]">
        {label}
        {required && " *"}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-[var(--landing-border)] bg-[var(--landing-surface-hover)] px-3 py-2 text-sm text-[var(--landing-text)] placeholder:text-[var(--landing-muted)] focus:border-cyan-500 focus:outline-none";
