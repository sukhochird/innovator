"use client";

import { useCallback, useState } from "react";

import type { MapViewId } from "@/lib/map-utils";

/** Map view — always starts on Standard unless user switches in control. */
export function useMapView() {
  const [mapView, setMapViewState] = useState<MapViewId>("standard");

  const setMapView = useCallback((view: MapViewId) => {
    setMapViewState(view);
  }, []);

  const resetToTheme = useCallback(() => {
    setMapViewState("standard");
  }, []);

  return { mapView, setMapView, manual: mapView !== "standard", resetToTheme };
}
