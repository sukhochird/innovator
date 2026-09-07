"use client";

import { useCallback, useEffect, useState } from "react";

import type { MapViewId } from "@/lib/map-utils";
import { mapViewForTheme } from "@/lib/map-utils";
import { useThemeStore } from "@/lib/theme-store";

const STORAGE_KEY = "carq-map-view";
const MANUAL_KEY = "carq-map-view-manual";

export function useMapView() {
  const theme = useThemeStore((s) => s.theme);
  const [mapView, setMapViewState] = useState<MapViewId>("standard");
  const [manual, setManual] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as MapViewId | null;
    const isManual = localStorage.getItem(MANUAL_KEY) === "1";
    if (stored && isManual) {
      setMapViewState(stored);
      setManual(true);
    } else {
      setMapViewState(mapViewForTheme(theme));
      setManual(false);
    }
  }, [theme]);

  useEffect(() => {
    if (!manual) {
      setMapViewState(mapViewForTheme(theme));
    }
  }, [theme, manual]);

  const setMapView = useCallback((view: MapViewId) => {
    setMapViewState(view);
    setManual(true);
    localStorage.setItem(STORAGE_KEY, view);
    localStorage.setItem(MANUAL_KEY, "1");
  }, []);

  const resetToTheme = useCallback(() => {
    setManual(false);
    localStorage.removeItem(MANUAL_KEY);
    const next = mapViewForTheme(theme);
    setMapViewState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [theme]);

  return { mapView, setMapView, manual, resetToTheme };
}
