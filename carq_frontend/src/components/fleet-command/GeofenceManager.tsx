"use client";

import { memo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Trash2 } from "lucide-react";

import type { DrawMode } from "@/components/maps/FleetMap";
import { apiFetch } from "@/lib/api";
import type { Geofence, GeofenceGeometry, GeofenceType, PaginatedResponse, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GeofenceManagerProps {
  vehicles: Vehicle[];
  drawMode: DrawMode;
  onDrawModeChange: (mode: DrawMode) => void;
  pendingGeometry: { geometry: GeofenceGeometry; type: GeofenceType } | null;
  onClearPending: () => void;
}

export const GeofenceManager = memo(function GeofenceManager({
  vehicles,
  drawMode,
  onDrawModeChange,
  pendingGeometry,
  onClearPending,
}: GeofenceManagerProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(500);
  const [alertEntry, setAlertEntry] = useState(true);
  const [alertExit, setAlertExit] = useState(true);
  const [assignAll, setAssignAll] = useState(true);
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);

  const { data: geofences = [], isLoading } = useGeofencesQuery(open);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<Geofence>("/api/geofences/", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geofences"] });
      onClearPending();
      setName("");
      setOpen(false);
      onDrawModeChange(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/geofences/${id}/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["geofences"] }),
  });

  const handleSave = () => {
    if (!pendingGeometry || !name.trim()) return;
    const geom = { ...pendingGeometry.geometry };
    if (pendingGeometry.type === "CIRCLE") {
      geom.radius_m = radius;
    }
    createMutation.mutate({
      name: name.trim(),
      type: pendingGeometry.type,
      geometry: geom,
      radius_m: pendingGeometry.type === "CIRCLE" ? radius : null,
      is_active: true,
      alert_on_entry: alertEntry,
      alert_on_exit: alertExit,
      assign_all: assignAll,
      vehicle_ids: assignAll ? [] : selectedVehicles,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--dash-border)] px-3 py-1.5 text-xs text-[var(--dash-text)] hover:bg-[var(--dash-hover)]"
      >
        <MapPin className="h-3.5 w-3.5" />
        Geofences
      </button>

      {open && (
        <div className="absolute bottom-4 right-4 z-20 max-h-[70vh] w-[320px] overflow-y-auto rounded-xl border border-[var(--dash-border)] bg-[var(--surface-deep)]/98 p-4 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[var(--dash-text)]">Geofence Manager</h4>
            <button type="button" onClick={() => setOpen(false)} className="text-[var(--dash-muted)]">×</button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1">
            {(["CIRCLE", "RECTANGLE", "POLYGON"] as GeofenceType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onDrawModeChange(drawMode === t ? null : t)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium",
                  drawMode === t ? "bg-cyan-500/20 text-cyan-400" : "border border-[var(--dash-border)] text-[var(--dash-muted)]",
                )}
              >
                + {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {drawMode && (
            <p className="mt-2 text-[10px] text-amber-400">
              {drawMode === "CIRCLE" && "Click map to place circle center"}
              {drawMode === "RECTANGLE" && "Click two corners on map"}
              {drawMode === "POLYGON" && "Click points, double-click to finish"}
            </p>
          )}

          {pendingGeometry && (
            <div className="mt-3 space-y-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
              <input
                placeholder="Geofence name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-xs"
              />
              {pendingGeometry.type === "CIRCLE" && (
                <label className="block text-xs text-[var(--dash-muted)]">
                  Radius (m)
                  <input
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] px-2 py-1.5 text-xs"
                  />
                </label>
              )}
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={alertEntry} onChange={(e) => setAlertEntry(e.target.checked)} />
                Alert on entry
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={alertExit} onChange={(e) => setAlertExit(e.target.checked)} />
                Alert on exit
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={assignAll} onChange={(e) => setAssignAll(e.target.checked)} />
                All company vehicles
              </label>
              {!assignAll && (
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {vehicles.map((v) => (
                    <label key={v.id} className="flex items-center gap-2 text-[10px]">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.includes(v.id)}
                        onChange={(e) =>
                          setSelectedVehicles((ids) =>
                            e.target.checked ? [...ids, v.id] : ids.filter((x) => x !== v.id),
                          )
                        }
                      />
                      {v.plate_number}
                    </label>
                  ))}
                </div>
              )}
              <button
                type="button"
                disabled={createMutation.isPending || !name.trim()}
                onClick={handleSave}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 py-2 text-xs text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Geofence
              </button>
            </div>
          )}

          <div className="mt-4">
            <p className="text-xs font-medium text-[var(--dash-muted)]">Active geofences</p>
            {isLoading ? (
              <p className="mt-2 text-xs text-[var(--dash-muted)]">Loading...</p>
            ) : geofences.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--dash-muted)]">No geofences yet. Create one to monitor zones.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {geofences.map((gf) => (
                  <li
                    key={gf.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--dash-border)] px-2 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-[var(--dash-text)]">{gf.name}</p>
                      <p className="text-[var(--dash-muted)]">{gf.type} · {gf.assigned_count ?? 0} vehicles</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(gf.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
});

export function useGeofencesQuery(enabled = true) {
  return useQuery({
    queryKey: ["geofences"],
    queryFn: async () => {
      try {
        const data = await apiFetch<PaginatedResponse<Geofence> | Geofence[]>(
          "/api/geofences/?page_size=200",
        );
        return Array.isArray(data) ? data : (data.results ?? []);
      } catch {
        return [];
      }
    },
    enabled,
    retry: false,
  });
}
