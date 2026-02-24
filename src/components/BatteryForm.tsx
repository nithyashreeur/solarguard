import React, { useState, useEffect } from 'react';
import { BatterySpecs, BatteryType } from '../types';
import { Save, Battery } from 'lucide-react';

interface Props {
  onSave: (specs: BatterySpecs) => void;
}

export default function BatteryForm({ onSave }: Props) {
  const [specs, setSpecs] = useState<BatterySpecs>({
    capacityAh: 100,
    voltageV: 12,
    type: 'Lead Acid',
  });

  useEffect(() => {
    const saved = localStorage.getItem('solar_guard_specs');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSpecs(parsed);
      onSave(parsed);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('solar_guard_specs', JSON.stringify(specs));
    onSave(specs);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-black/5">
      <div className="flex items-center gap-2 mb-6">
        <Battery className="text-emerald-600" size={24} />
        <h2 className="text-xl font-semibold text-zinc-900">Battery Configuration</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-1">Capacity (Ah)</label>
          <input
            type="number"
            value={specs.capacityAh}
            onChange={(e) => setSpecs({ ...specs, capacityAh: Number(e.target.value) })}
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
            placeholder="e.g. 100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-1">Voltage (V)</label>
          <input
            type="number"
            value={specs.voltageV}
            onChange={(e) => setSpecs({ ...specs, voltageV: Number(e.target.value) })}
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
            placeholder="e.g. 12"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-600 mb-1">Battery Type</label>
          <select
            value={specs.type}
            onChange={(e) => setSpecs({ ...specs, type: e.target.value as BatteryType })}
            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-lg"
          >
            <option value="Lead Acid">Lead Acid (80% Depth of Discharge)</option>
            <option value="Lithium">Lithium (95% Depth of Discharge)</option>
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg shadow-lg shadow-emerald-600/20"
        >
          <Save size={20} />
          Save Settings
        </button>
      </form>
    </div>
  );
}
