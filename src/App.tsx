/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchNasaPowerData } from './services/nasaService';
import { BatterySpecs, WeatherData, PredictionResult } from './types';
import BatteryForm from './components/BatteryForm';
import Dashboard from './components/Dashboard';
import ChatWidget from './components/ChatWidget';
import { Sun, Battery, MapPin, AlertCircle, Wrench, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { getNearbyRepairShops } from './services/geminiService';

export default function App() {
  const { location, locationName, error: geoError } = useGeolocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [batterySpecs, setBatterySpecs] = useState<BatterySpecs | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyHelp, setNearbyHelp] = useState<{ text: string; links: any[] } | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  useEffect(() => {
    if (location) {
      setLoading(true);
      fetchNasaPowerData(location.lat, location.lon)
        .then(setWeather)
        .finally(() => setLoading(false));
      
      // Automatically fetch help when location is found
      fetchHelp();
    }
  }, [location]);

  const fetchHelp = async () => {
    if (!location) return;
    setLoadingHelp(true);
    try {
      const help = await getNearbyRepairShops(location.lat, location.lon);
      setNearbyHelp(help);
    } catch (error) {
      console.error('Failed to fetch nearby help:', error);
    } finally {
      setLoadingHelp(false);
    }
  };

  const prediction = useMemo((): PredictionResult | null => {
    if (!batterySpecs || !weather) return null;

    const dod = batterySpecs.type === 'Lead Acid' ? 0.8 : 0.95;
    const availableWh = batterySpecs.voltageV * batterySpecs.capacityAh * dod;
    
    // Base load assumption: 50W (minimal rural usage: 2 lights + phone)
    const baseLoad = 50;
    
    // Solar gain: Insolation (kWh/m2/day) * efficiency (assume 15%) * panel size (assume 1m2)
    // This is a simplified model for the rural assistant
    const solarGainWh = weather.solarInsolation * 1000 * 0.15;
    
    // Net energy per hour (assuming 12h of usage)
    // If it's raining, we assume 0 solar gain
    const effectiveSolarGain = weather.precipitation > 0 ? 0 : solarGainWh;
    
    // Safe usage hours = Capacity / (Load - (SolarGain / 24))
    // We'll simplify: (Available Energy + Solar Gain) / Load
    const totalEnergy = availableWh + effectiveSolarGain;
    const safeUsageHours = Math.min(48, totalEnergy / baseLoad);

    let warning = null;
    if (weather.precipitation > 0) {
      warning = "Heavy rain detected. Solar charging is unavailable. Conserve power now to avoid a blackout.";
    } else if (weather.solarInsolation < 2) {
      warning = "Low solar radiation today. Battery will drain faster than usual.";
    }

    return {
      availableWh,
      safeUsageHours,
      warning
    };
  }, [batterySpecs, weather]);

  const contextString = useMemo(() => {
    if (!weather || !prediction || !batterySpecs) return "No data available yet.";
    return `
      Location: ${location?.lat}, ${location?.lon}
      Battery: ${batterySpecs.capacityAh}Ah, ${batterySpecs.voltageV}V, ${batterySpecs.type}
      Weather: Solar ${weather.solarInsolation}kWh/m2, Rain ${weather.precipitation}mm, Temp ${weather.temperature}C
      Prediction: ${prediction.safeUsageHours.toFixed(1)} hours left, ${prediction.availableWh}Wh available.
      Warning: ${prediction.warning || 'None'}
    `;
  }, [weather, prediction, batterySpecs, location]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <Sun size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SolarGuard</h1>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-500">
            {location ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full max-w-[200px] md:max-w-xs">
                <MapPin size={14} className="shrink-0" />
                <span className="truncate">{locationName || 'Active'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <AlertCircle size={14} />
                <span>Locating...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Config */}
          <div className="lg:col-span-1 space-y-6">
            <BatteryForm onSave={setBatterySpecs} />
            
            <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Battery className="text-emerald-400" size={20} />
                Rural Energy Tip
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                During rainy days, switch off non-essential appliances like TVs or large fans. 
                Prioritize lighting and mobile charging to ensure your battery lasts through the night.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-black/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-900">
                <Wrench className="text-zinc-500" size={20} />
                Nearby Support
              </h3>
              <p className="text-xs text-zinc-500 mb-4">
                Finding solar experts near {locationName || 'your location'}...
              </p>
              {!nearbyHelp ? (
                <button
                  onClick={fetchHelp}
                  disabled={loadingHelp || !location}
                  className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingHelp ? (
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <MapPin size={18} />
                      Find Local Repair Shops
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {nearbyHelp.text}
                  </p>
                  <div className="space-y-2">
                    {nearbyHelp.links.map((chunk, i) => (
                      chunk.maps && (
                        <a
                          key={i}
                          href={chunk.maps.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-100 transition-all group"
                        >
                          <span className="text-sm font-medium text-zinc-700">{chunk.maps.title}</span>
                          <ExternalLink size={14} className="text-zinc-400 group-hover:text-emerald-600" />
                        </a>
                      )
                    ))}
                  </div>
                  <button 
                    onClick={() => setNearbyHelp(null)}
                    className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                  >
                    Clear results
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="lg:col-span-2">
            <Dashboard weather={weather} prediction={prediction} loading={loading} />
          </div>
        </div>
      </main>

      {/* AI Assistant */}
      <ChatWidget context={contextString} />
    </div>
  );
}
