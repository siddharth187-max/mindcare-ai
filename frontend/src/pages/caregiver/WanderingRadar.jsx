import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';

const WanderingRadar = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  // Safe Zone Config form
  const [radiusInput, setRadiusInput] = useState(500);
  const [addressInput, setAddressInput] = useState('');
  const [savingZone, setSavingZone] = useState(false);

  const { chime, playCaregiverAlert } = useVoice();

  // Load caregiver's linked patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const { data } = await api.get('/caregiver/patients');
        const patList = data.patients || [];
        setPatients(patList);
        if (patList.length > 0) {
          setSelectedPatientId(patList[0]._id || patList[0].id);
        }
      } catch (err) {
        console.error('Failed to load caregiver patients:', err);
      }
    }
    loadPatients();
  }, []);

  // Fetch geofence status
  const fetchGeofenceData = async (pId) => {
    if (!pId) return;
    try {
      const { data } = await api.get(`/geofence/${pId}`);
      setRadarData(data);
      setRadiusInput(data.safeZone?.radiusMeters || 500);
      setAddressInput(data.safeZone?.address || '442 Maplewood Enclave, Block B, New Delhi');

      // If breach detected, trigger audio alert
      if (!data.lastKnownLocation?.isSafe) {
        playCaregiverAlert();
      }
    } catch (err) {
      console.error('Failed to fetch geofence status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      fetchGeofenceData(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Simulation handlers for Hackathon Demo
  const simulateLocation = async (metersOffset, label, isSOS = false) => {
    if (!selectedPatientId || !radarData) return;
    setSimulating(true);
    try {
      const centerLat = radarData.safeZone?.center?.lat || 28.6139;
      const centerLng = radarData.safeZone?.center?.lng || 77.2090;

      // Approximate degree offset (1 deg lat ~= 111,000 meters)
      const latOffset = (metersOffset / 111000) * (Math.random() > 0.5 ? 1 : -1);
      const lngOffset = (metersOffset / 111000) * (Math.random() > 0.5 ? 1 : -1);

      const targetLat = centerLat + latOffset;
      const targetLng = centerLng + lngOffset;

      if (isSOS) {
        const { data } = await api.post('/geofence/trigger-sos', {
          patientId: selectedPatientId,
          lat: targetLat,
          lng: targetLng,
        });
        playCaregiverAlert();
        setAlertMsg(`🚨 CRITICAL: Patient triggered SOS broadcast at ${metersOffset}m!`);
      } else {
        const { data } = await api.post('/geofence/ping-location', {
          patientId: selectedPatientId,
          lat: targetLat,
          lng: targetLng,
          batteryLevel: Math.max(15, 92 - Math.floor(metersOffset / 50)),
        });

        if (!data.isSafe) {
          playCaregiverAlert();
          setAlertMsg(`⚠️ ALERT: Patient breached ${radarData.safeZone?.radiusMeters}m safe zone perimeter! Distance: ${data.distanceFromCenter}m.`);
        } else {
          chime('success');
          setAlertMsg(`✓ Telemetry updated: Patient is safe inside perimeter (${label}, ${data.distanceFromCenter}m).`);
        }
      }

      await fetchGeofenceData(selectedPatientId);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
      setTimeout(() => setAlertMsg(''), 6000);
    }
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) return;
    setSavingZone(true);
    try {
      await api.post('/geofence/update-zone', {
        patientId: selectedPatientId,
        radiusMeters: radiusInput,
        address: addressInput,
      });
      chime('success');
      setAlertMsg('✓ Safe Zone configuration saved successfully!');
      fetchGeofenceData(selectedPatientId);
      setTimeout(() => setAlertMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update safe zone:', err);
    } finally {
      setSavingZone(false);
    }
  };

  const isSafe = radarData?.lastKnownLocation?.isSafe ?? true;
  const distanceMeters = radarData?.lastKnownLocation?.distanceFromCenter ?? 0;
  const safeRadius = radarData?.safeZone?.radiusMeters ?? 500;
  const battery = radarData?.lastKnownLocation?.batteryLevel ?? 92;

  // Radar position calculation (normalized 0% to 100% relative to 1200m display limit)
  const maxRadarScaleMeters = Math.max(1000, safeRadius * 1.5);
  const normalizedDistance = Math.min(1, distanceMeters / maxRadarScaleMeters);
  // angle in radians for visual positioning
  const angle = 0.75 * Math.PI; // diagonal visual position
  const dotX = 50 + normalizedDistance * 40 * Math.cos(angle);
  const dotY = 50 - normalizedDistance * 40 * Math.sin(angle);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${radarData?.lastKnownLocation?.lat || 28.6139},${radarData?.lastKnownLocation?.lng || 77.2090}`;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-purple-900/50 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-blue-950/80 text-blue-300 border border-blue-500/40">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>📍 Geofencing & Wandering Safety Radar</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Wandering Prevention Radar
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium">
            Real-time GPS boundary surveillance, wandering anomaly radar, and 1-click rescue navigation.
          </p>
        </div>

        {patients.length > 1 && (
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-4 py-3 rounded-xl bg-slate-950 border border-purple-900 text-white text-sm font-bold focus:outline-none focus:border-purple-400"
          >
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                👤 {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-2xl text-sm font-black border shadow-lg animate-fadeIn ${
          alertMsg.includes('ALERT') || alertMsg.includes('CRITICAL')
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/80'
        }`}>
          {alertMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Acquiring GPS Satellite Telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* RADAR VISUALIZER (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            
            {/* Ambient Cyber Grid */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.4) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Radar Header */}
            <div className="w-full flex items-center justify-between pb-4 mb-2 border-b border-slate-800 text-xs font-mono">
              <span className="text-blue-400 font-bold tracking-widest">[LIVE_RADAR_SCOPE]</span>
              <span className="text-slate-400">RANGE: {maxRadarScaleMeters}m</span>
            </div>

            {/* Circular Scanning Radar Container */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-blue-500/30 flex items-center justify-center my-4 bg-slate-950/90 shadow-[0_0_50px_rgba(59,130,246,0.15)]">
              
              {/* Rotating Radar Sweep Beam */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(59, 130, 246, 0.35) 0deg, transparent 60deg, transparent 360deg)',
                  animation: 'spin 4s linear infinite',
                }}
              />

              {/* Concentric Distance Rings */}
              <div className="absolute w-3/4 h-3/4 rounded-full border border-blue-500/20"></div>
              <div className="absolute w-1/2 h-1/2 rounded-full border border-blue-500/20"></div>
              <div className="absolute w-1/4 h-1/4 rounded-full border border-blue-500/20"></div>

              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-blue-500/20"></div>
              <div className="absolute h-full w-[1px] bg-blue-500/20"></div>

              {/* Safe Zone Boundary Circle */}
              <div 
                className="absolute rounded-full border-2 border-dashed border-emerald-400/60 transition-all pointer-events-none"
                style={{
                  width: `${(safeRadius / maxRadarScaleMeters) * 80}%`,
                  height: `${(safeRadius / maxRadarScaleMeters) * 80}%`,
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.2) inset'
                }}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-emerald-400 bg-slate-950 px-1 rounded">
                  SAFE_LIMIT ({safeRadius}m)
                </span>
              </div>

              {/* Home Base Center Marker */}
              <div className="absolute z-10 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">🏠</span>
              </div>

              {/* Live Patient Beacon Dot */}
              <div
                className="absolute z-20 transition-all duration-700 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{
                  left: `${dotX}%`,
                  top: `${dotY}%`,
                }}
              >
                <div className={`relative w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${
                  isSafe ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-bounce'
                }`}>
                  <span className={`absolute inset-0 rounded-full animate-ping ${
                    isSafe ? 'bg-emerald-400/60' : 'bg-rose-400/80'
                  }`}></span>
                  <span className="text-xs relative z-10">👤</span>
                </div>
                <span className={`text-[10px] font-mono font-black mt-1 px-1.5 py-0.5 rounded shadow ${
                  isSafe ? 'bg-emerald-950 text-emerald-200 border border-emerald-500/50' : 'bg-rose-950 text-rose-200 border border-rose-500/80'
                }`}>
                  {distanceMeters}m
                </span>
              </div>
            </div>

            {/* Radar Status Bar */}
            <div className={`w-full p-4 rounded-2xl border flex items-center justify-between mt-2 font-mono text-xs sm:text-sm font-bold ${
              isSafe 
                ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/60' 
                : 'bg-rose-950/80 text-rose-200 border-rose-500/80 animate-pulse'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isSafe ? '🟢' : '🔴'}</span>
                <span>{isSafe ? 'STATUS: INSIDE SAFE ZONE' : 'STATUS: GEOFENCE BREACH DETECTED'}</span>
              </div>
              <span>BATTERY: {battery}%</span>
            </div>
          </div>

          {/* TELEMETRY & CONTROLS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Action Card */}
            <div className="bg-slate-900/90 border border-purple-900/40 p-6 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>⚡</span>
                <span>Immediate Emergency Dispatch</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                >
                  <span>🗺️</span>
                  <span>Open Google Maps</span>
                </a>
                <a
                  href={`tel:${radarData?.caregiverPhone || '+91 98765 43210'}`}
                  className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 text-center"
                >
                  <span>📞</span>
                  <span>Call Emergency Line</span>
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">PATIENT:</span>
                  <span className="text-white font-bold">{radarData?.patientName || 'Arthur Pendelton'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">HOME ADDRESS:</span>
                  <span className="text-purple-300 font-bold truncate max-w-[200px]">{radarData?.safeZone?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LAST PING:</span>
                  <span className="text-emerald-300 font-bold">Just now</span>
                </div>
              </div>
            </div>

            {/* SIH HACKATHON LIVE SIMULATION PANEL */}
            <div className="bg-slate-900/90 border-2 border-purple-500/40 p-6 rounded-3xl shadow-[0_0_30px_rgba(147,51,234,0.2)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <span>🎮</span>
                  <span>SIH26003 Radar Simulator</span>
                </h3>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-500/30">
                  DEMO_MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate real-time wandering scenarios to evaluate boundary alarms:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(0, 'Inside Living Room')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>🏠</span>
                  <span>At Home (0m)</span>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(140, 'Front Garden')}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>🚶</span>
                  <span>Garden (140m)</span>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(380, 'Neighborhood Park')}
                  className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>🌳</span>
                  <span>Near Limit (380m)</span>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(850, 'Main Highway Out of Bounds')}
                  className="p-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/70 text-rose-200 text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  <span>🚨</span>
                  <span>Breach (850m)</span>
                </button>
              </div>

              <button
                type="button"
                disabled={simulating}
                onClick={() => simulateLocation(750, 'Emergency SOS Location', true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md mt-2"
              >
                <span>🆘</span>
                <span>Simulate Patient "I'm Lost" SOS</span>
              </button>
            </div>

            {/* SAFE ZONE CONFIGURATION FORM */}
            <form onSubmit={handleSaveZone} className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚙️</span>
                <span>Safe Zone Boundary Settings</span>
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1 flex justify-between">
                  <span>Safe Radius Perimeter</span>
                  <span className="text-purple-400 font-mono font-bold">{radiusInput} meters</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Home Safe Anchor Address
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400 font-mono"
                  placeholder="e.g. 442 Maplewood Enclave, Block B, New Delhi"
                />
              </div>

              <button
                type="submit"
                disabled={savingZone}
                className="w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-black transition-all"
              >
                {savingZone ? 'Saving...' : 'Update Safe Zone Limits'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECENT WANDERING INCIDENT HISTORY */}
      {radarData?.wanderingAlerts && radarData.wanderingAlerts.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>📋</span>
            <span>Recent Wandering Incident Logs</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Distance</th>
                  <th className="py-3 px-3">Trigger Source</th>
                  <th className="py-3 px-3">Incident Note</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {radarData.wanderingAlerts.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-300">
                      {alert.distanceMeters}m from home
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alert.triggeredBy === 'PATIENT_SOS'
                          ? 'bg-rose-950 text-rose-200 border border-rose-500/50'
                          : 'bg-amber-950 text-amber-200 border border-amber-500/50'
                      }`}>
                        {alert.triggeredBy}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">
                      {alert.note}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 font-bold underline"
                      >
                        View Map →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WanderingRadar;
