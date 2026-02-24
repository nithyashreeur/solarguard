export type BatteryType = 'Lead Acid' | 'Lithium';

export interface BatterySpecs {
  capacityAh: number;
  voltageV: number;
  type: BatteryType;
}

export interface WeatherData {
  solarInsolation: number; // ALLSKY_SFC_SW_DWN
  precipitation: number;   // PRECTOTCORR
  temperature: number;     // T2M
}

export interface PredictionResult {
  availableWh: number;
  safeUsageHours: number;
  warning: string | null;
}
