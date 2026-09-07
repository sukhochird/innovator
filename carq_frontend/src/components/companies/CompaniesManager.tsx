"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Ban,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { StatCard } from "@/components/dashboard/StatCard";
import { ApiError, apiFetch } from "@/lib/api";
import { ui } from "@/lib/ui-classes";
import type { AdminDashboard, Company, CompanyFormData } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CompanyFormModal } from "./CompanyFormModal";
import { CompanyStatusBadge } from "./CompanyStatusBadge";

function normalizeCompanies(data: { results?: Company[] } | Company[] | undefined): Company[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results || [];
}

export function CompaniesManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const { data: admin } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiFetch<AdminDashboard>("/api/dashboard/admin/"),
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => apiFetch<{ results?: Company[] } | Company[]>("/api/companies/"),
  });

  const list = useMemo(() => {
    const all = normalizeCompanies(companies);
    return all.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.registration_number.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [companies, search, statusFilter]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: CompanyFormData) =>
      apiFetch<Company>("/api/companies/", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Company created");
      setFormOpen(false);
      setFieldErrors({});
      invalidate();
    },
    onError: (err: ApiError) => {
      setFieldErrors(err.fieldErrors ?? {});
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompanyFormData }) =>
      apiFetch<Company>(`/api/companies/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Company updated");
      setFormOpen(false);
      setEditing(null);
      setFieldErrors({});
      invalidate();
    },
    onError: (err: ApiError) => {
      setFieldErrors(err.fieldErrors ?? {});
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/companies/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Company deleted");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" | "suspend" | "activate" }) =>
      apiFetch<Company>(`/api/companies/${id}/${action}/`, { method: "POST" }),
    onSuccess: (_, { action }) => {
      const labels = {
        approve: "approved",
        reject: "rejected",
        suspend: "suspended",
        activate: "activated",
      };
      toast.success(`Company ${labels[action]}`);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(err.message),
  });

  const handleFormSubmit = async (data: CompanyFormData) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    setFieldErrors({});
    setFormOpen(true);
  };

  const formLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={ui.pageTitle}>Companies</h2>
          <p className={ui.pageSubtitle}>Manage fleet operator organizations on the platform</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      {admin && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Companies" value={admin.companies.total} />
          <StatCard label="Active" value={admin.companies.active} accent="text-emerald-400" />
          <StatCard label="Pending" value={admin.companies.pending} accent="text-amber-400" />
          <StatCard label="Critical Alerts" value={admin.alerts.critical} accent="text-red-400" />
        </div>
      )}

      <div className={cn(ui.card, "rounded-xl")}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--dash-border)] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dash-muted)]" />
            <input
              type="search"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(ui.inputSm, "w-full pl-9")}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={ui.inputSm}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-[var(--dash-muted)]">No companies found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={cn(ui.table, "table-fixed")}>
              <thead>
                <tr className={cn(ui.tableHead, "tracking-wider")}>
                  <th className="w-[22%] px-4 py-2.5">Company</th>
                  <th className="w-[14%] px-4 py-2.5">Registration</th>
                  <th className="w-[10%] px-4 py-2.5">Status</th>
                  <th className="w-[24%] px-4 py-2.5">Contact</th>
                  <th className="w-[18%] px-4 py-2.5">Fleet</th>
                  <th className="w-[12%] px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className={cn(ui.tableRowHover, "align-middle")}>
                    <td className="px-4 py-2.5">
                      <p className="truncate font-medium text-[var(--dash-text)]">{c.name}</p>
                      {c.created_at && (
                        <p className="truncate text-xs text-[var(--dash-muted)]">
                          Created {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm text-[var(--dash-muted)]">
                      <span className="block truncate">{c.registration_number}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <CompanyStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="truncate text-sm text-[var(--dash-text-secondary)]">{c.email}</p>
                      {c.phone && (
                        <p className="truncate text-xs text-[var(--dash-muted)]">{c.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-[var(--dash-muted)]">
                      {c.vehicle_count ?? 0} vehicles · {c.device_count ?? 0} devices
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <CompanyActionsMenu
                        company={c}
                        onEdit={() => openEdit(c)}
                        onDelete={() => setDeleteTarget(c)}
                        onStatusAction={(action) => statusMutation.mutate({ id: c.id, action })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CompanyFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        company={editing}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        fieldErrors={fieldErrors}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={cn(ui.card, "max-w-md p-6 shadow-2xl")}>
            <h3 className="text-lg font-semibold text-[var(--dash-text)]">Delete Company</h3>
            <p className="mt-2 text-sm text-[var(--dash-muted)]">
              Delete <strong className="text-[var(--dash-text)]">{deleteTarget.name}</strong>? This
              will permanently remove the company
              {(deleteTarget.vehicle_count ?? 0) > 0 &&
                ` and ${deleteTarget.vehicle_count} associated vehicles`}
              .
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-[var(--dash-border)] px-4 py-2 text-sm text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyActionsMenu({
  company,
  onEdit,
  onDelete,
  onStatusAction,
}: {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
  onStatusAction: (action: "approve" | "reject" | "suspend" | "activate") => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex rounded-lg p-2 text-[var(--dash-muted)] hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[180px] rounded-lg border border-[var(--dash-border)] bg-[var(--dash-card)] py-1 shadow-xl"
        >
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[var(--dash-text-secondary)] outline-none hover:bg-[var(--dash-hover)]"
            onSelect={onEdit}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </DropdownMenu.Item>
          {company.status === "PENDING" && (
            <>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-emerald-500 outline-none hover:bg-[var(--dash-hover)]"
                onSelect={() => onStatusAction("approve")}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-amber-500 outline-none hover:bg-[var(--dash-hover)]"
                onSelect={() => onStatusAction("reject")}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </DropdownMenu.Item>
            </>
          )}
          {company.status === "ACTIVE" && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-400 outline-none hover:bg-[var(--dash-hover)]"
              onSelect={() => onStatusAction("suspend")}
            >
              <Ban className="h-4 w-4" />
              Suspend
            </DropdownMenu.Item>
          )}
          {(company.status === "SUSPENDED" || company.status === "REJECTED") && (
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-emerald-500 outline-none hover:bg-[var(--dash-hover)]"
              onSelect={() => onStatusAction("activate")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Activate
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-[var(--dash-border)]" />
          <DropdownMenu.Item
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-red-400 outline-none hover:bg-[var(--dash-hover)]"
            onSelect={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
