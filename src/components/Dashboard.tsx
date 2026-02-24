import { WeatherData, PredictionResult } from '../types';
import { Sun, CloudRain, Thermometer, Clock, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  weather: WeatherData | null;
  prediction: PredictionResult | null;
  loading?: boolean;
}

export default function Dashboard({ weather, prediction, loading }: Props) {
  if (!weather || !prediction) {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-md border border-black/5 h-80 animate-pulse flex flex-col items-center justify-center">
            <div className="w-48 h-48 bg-zinc-100 rounded-full mb-6" />
            <div className="w-32 h-4 bg-zinc-100 rounded" />
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-black/5 h-48 animate-pulse" />
            <div className="bg-white p-6 rounded-2xl shadow-md border border-black/5 h-24 animate-pulse" />
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
        <p className="text-zinc-400 font-medium text-center px-6">Configure battery and allow location to see dashboard</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Battery Health / Usage Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-md border border-black/5 flex flex-col items-center justify-center text-center"
      >
        <div className="relative w-48 h-48 mb-6">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="#f4f4f5"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={prediction.safeUsageHours > 5 ? "#10b981" : "#f59e0b"}
              strokeWidth="8"
              strokeDasharray={`${(prediction.safeUsageHours / 24) * 283} 283`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-zinc-900">{prediction.safeUsageHours.toFixed(1)}</span>
            <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Hours Left</span>
          </div>
        </div>
        
        <div className="flex gap-8 w-full">
          <div className="flex-1">
            <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
              <Zap size={18} />
              <span className="font-bold text-lg">{prediction.availableWh.toFixed(0)}</span>
            </div>
            <span className="text-xs text-zinc-500 uppercase font-semibold">Total Wh</span>
          </div>
          <div className="w-px bg-zinc-100" />
          <div className="flex-1">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-1">
              <Clock size={18} />
              <span className="font-bold text-lg">{prediction.safeUsageHours.toFixed(1)}h</span>
            </div>
            <span className="text-xs text-zinc-500 uppercase font-semibold">Safe Usage</span>
          </div>
        </div>
      </motion.div>

      {/* Weather Forecast Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="bg-white p-6 rounded-2xl shadow-md border border-black/5">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Sun className="text-amber-500" size={20} />
            Today's Solar Conditions
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <div className="text-amber-600 mb-1"><Sun size={20} /></div>
              <div className="text-2xl font-bold text-amber-900">{weather.solarInsolation.toFixed(2)}</div>
              <div className="text-xs text-amber-700 font-medium">kWh/m²/day</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="text-blue-600 mb-1"><CloudRain size={20} /></div>
              <div className="text-2xl font-bold text-blue-900">{weather.precipitation.toFixed(2)}</div>
              <div className="text-xs text-blue-700 font-medium">mm Rain</div>
            </div>
            
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-rose-600"><Thermometer size={24} /></div>
                <div>
                  <div className="text-xl font-bold text-rose-900">{weather.temperature.toFixed(1)}°C</div>
                  <div className="text-xs text-rose-700 font-medium">Average Temperature</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {prediction.warning && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-amber-100 border-2 border-amber-500 p-4 rounded-2xl flex items-start gap-3"
          >
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-amber-900">Power Cut Warning</h4>
              <p className="text-sm text-amber-800">{prediction.warning}</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
