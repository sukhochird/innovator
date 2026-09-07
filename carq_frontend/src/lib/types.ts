export type UserRole = "SUPER_ADMIN" | "COMPANY_ADMIN" | "DRIVER";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: UserRole;
  company: number | null;
  company_name?: string | null;
  is_active: boolean;
}

export interface TelemetryData {
  vehicle_id?: number;
  timestamp?: string;
  latitude?: number | null;
  longitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  rpm?: number | null;
  coolant_temperature?: number | null;
  engine_load?: number | null;
  throttle_position?: number | null;
  battery_voltage?: number | null;
  fuel_level?: number | null;
  intake_air_temperature?: number | null;
  engine_runtime?: number | null;
  odometer?: number | null;
  ignition?: boolean | null;
  status?: string;
  is_online?: boolean;
  device_serial?: string;
}

export interface Vehicle {
  id: number;
  company: number;
  driver: number | null;
  driver_name: string | null;
  device_id: number | null;
  device_serial: string | null;
  plate_number: string;
  vin: string;
  make: string;
  model: string;
  year: number | null;
  color: string;
  fuel_type: string;
  status: string;
  nickname: string;
  current_telemetry: TelemetryData | null;
}

export interface FleetStats {
  total: number;
  online: number;
  offline: number;
  moving: number;
  idle: number;
  stopped: number;
  alert: number;
}

export interface CompanyDashboard {
  company?: {
    id: number;
    name: string;
    registration_number: string;
    status: string;
  } | null;
  fleet: FleetStats;
  alerts: { critical: number; warning: number };
  dtc: { active: number };
  vehicles: Vehicle[];
}

export interface DTCCode {
  id: number;
  code: string;
  description: string;
  severity: string;
  is_active: boolean;
  first_detected_at?: string;
  last_detected_at?: string;
  resolved_at?: string | null;
}

export interface FleetDTC extends DTCCode {
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_make: string;
  vehicle_model: string;
}

export interface VehicleAlert {
  id: number;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  value?: number | null;
  resolved_at?: string | null;
}

export interface FleetAlert extends VehicleAlert {
  vehicle_id: number;
  vehicle_plate: string;
  vehicle_make: string;
  vehicle_model: string;
  threshold?: number | null;
  acknowledged_at?: string | null;
}

export interface FleetAlertsResponse {
  summary: { total: number; critical: number; warning: number; info: number };
  alerts: FleetAlert[];
}

export interface FleetDtcResponse {
  summary: { total: number; active: number; critical: number; warning: number };
  codes: FleetDTC[];
}

export interface VehicleDashboard {
  vehicle: Vehicle;
  current: TelemetryData | null;
  telemetry_history: TelemetryData[];
  dtc: DTCCode[];
  alerts: VehicleAlert[];
}

export interface TelemetryRawLog {
  id: number;
  timestamp: string;
  device: number | null;
  device_serial: string | null;
  protocol: string;
  speed: number | null;
  latitude: number | null;
  longitude: number | null;
  raw_payload: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AdminDashboard {
  companies: { total: number; active: number; pending: number };
  devices: { total: number; online: number; active: number };
  vehicles: { total: number; online: number };
  alerts: { critical: number };
  recent_companies: Array<{ id: number; name: string; status: string; created_at: string }>;
}

export interface Company {
  id: number;
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address?: string;
  status: string;
  vehicle_count?: number;
  device_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type CompanyFormData = {
  name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
};

export type CompanyStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export interface Device {
  id: number;
  serial_number: string;
  imei: string;
  model: string;
  firmware_version: string;
  status: string;
  company: number | null;
  vehicle_id: number | null;
  vehicle_plate: string | null;
  last_seen_at: string | null;
  terminal_phone?: string | null;
  is_online: boolean;
}
