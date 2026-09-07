"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";

import { ui } from "@/lib/ui-classes";
import type { Company, CompanyFormData } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_FORM: CompanyFormData = {
  name: "",
  registration_number: "",
  email: "",
  phone: "",
  address: "",
};

function formFromCompany(company: Company | null | undefined): CompanyFormData {
  if (!company) return EMPTY_FORM;
  return {
    name: company.name,
    registration_number: company.registration_number,
    email: company.email,
    phone: company.phone || "",
    address: company.address || "",
  };
}

interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  loading?: boolean;
  fieldErrors?: Record<string, string[]>;
}

function CompanyFormBody({
  company,
  onSubmit,
  loading,
  fieldErrors,
  onClose,
}: {
  company?: Company | null;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  loading: boolean;
  fieldErrors: Record<string, string[]>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CompanyFormData>(() => formFromCompany(company));
  const isEdit = !!company;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  const field = (name: keyof CompanyFormData, label: string, required = false) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--dash-muted)]">
        {label}
        {required && " *"}
      </label>
      <input
        type={name === "email" ? "email" : "text"}
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className={cn(ui.input, "w-full", fieldErrors[name] && "border-red-500/50")}
        required={required}
        disabled={loading}
      />
      {fieldErrors[name]?.map((msg) => (
        <p key={msg} className="mt-1 text-xs text-red-400">
          {msg}
        </p>
      ))}
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Dialog.Title className="text-lg font-semibold text-[var(--dash-text)]">
          {isEdit ? "Edit Company" : "Create Company"}
        </Dialog.Title>
        <Dialog.Close className="rounded-lg p-1 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]">
          <X className="h-5 w-5" />
        </Dialog.Close>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {field("name", "Company Name", true)}
        {field("registration_number", "Registration Number", true)}
        {field("email", "Email", true)}
        {field("phone", "Phone")}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--dash-muted)]">
            Address
          </label>
          <textarea
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            rows={3}
            className={cn(ui.input, "w-full resize-none")}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--dash-border)] px-4 py-2 text-sm text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Company"}
          </button>
        </div>
      </form>
    </>
  );
}

export function CompanyFormModal({
  open,
  onOpenChange,
  company,
  onSubmit,
  loading = false,
  fieldErrors = {},
}: CompanyFormModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--dash-border)] bg-[var(--dash-card)] p-6 shadow-2xl">
          {open && (
            <CompanyFormBody
              key={company?.id ?? "new"}
              company={company}
              onSubmit={onSubmit}
              loading={loading}
              fieldErrors={fieldErrors}
              onClose={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
