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
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-[#8DB7A5]/20 text-[#397F7A] border border-[#8DB7A5]/40">
            <span className="w-2 h-2 rounded-full bg-[#397F7A] animate-ping"></span>
            <span>📍 Geofencing & Wandering Safety Radar</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#263B42] tracking-tight">
            Wandering Prevention Radar
          </h1>
          <p className="text-base text-[#566D75] font-medium">
            Real-time GPS boundary surveillance, wandering anomaly radar, and 1-click rescue navigation.
          </p>
        </div>

        {patients.length > 1 && (
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white border border-[#EADBCC] text-[#263B42] text-sm font-bold focus:outline-none focus:border-[#397F7A]"
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
        <div className={`p-4 rounded-2xl text-sm font-bold border shadow-sm animate-fadeIn ${
          alertMsg.includes('ALERT') || alertMsg.includes('CRITICAL')
            ? 'bg-[#FFF5F5] text-[#C95C5C] border-[#C95C5C]/50'
            : 'bg-[#F0FDF4] text-[#4F8A5B] border-[#4F8A5B]/40'
        }`}>
          {alertMsg}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-[#566D75] font-bold">
          <div className="w-10 h-10 border-4 border-[#397F7A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Acquiring GPS Telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* RADAR VISUALIZER (7 cols) */}
          <div className="lg:col-span-7 bg-[#FFFDF7] border border-[#EADBCC] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            
            {/* Radar Header */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-[#EADBCC] text-xs font-semibold text-[#566D75]">
              <span className="text-[#397F7A] font-bold tracking-wider">● LIVE SAFETY RADAR</span>
              <span>RANGE: {maxRadarScaleMeters}m</span>
            </div>

            {/* Circular Scanning Radar Container */}
            <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-2 border-[#8DB7A5]/50 flex items-center justify-center my-4 bg-[#F7F3E8] shadow-inner">
              
              {/* Rotating Radar Sweep Beam */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(57, 127, 122, 0.25) 0deg, transparent 60deg, transparent 360deg)',
                  animation: 'spin 4s linear infinite',
                }}
              />

              {/* Concentric Distance Rings */}
              <div className="absolute w-3/4 h-3/4 rounded-full border border-[#8DB7A5]/40"></div>
              <div className="absolute w-1/2 h-1/2 rounded-full border border-[#8DB7A5]/40"></div>
              <div className="absolute w-1/4 h-1/4 rounded-full border border-[#8DB7A5]/40"></div>

              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-[#8DB7A5]/30"></div>
              <div className="absolute h-full w-[1px] bg-[#8DB7A5]/30"></div>

              {/* Safe Zone Boundary Circle */}
              <div 
                className="absolute rounded-full border-2 border-dashed border-[#4F8A5B] transition-all pointer-events-none"
                style={{
                  width: `${(safeRadius / maxRadarScaleMeters) * 80}%`,
                  height: `${(safeRadius / maxRadarScaleMeters) * 80}%`,
                  boxShadow: '0 0 15px rgba(79, 138, 91, 0.15) inset'
                }}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#4F8A5B] bg-[#FFFDF7] px-2 py-0.5 rounded-full border border-[#4F8A5B]/30 shadow-sm">
                  SAFE LIMIT ({safeRadius}m)
                </span>
              </div>

              {/* Home Base Center Marker */}
              <div className="absolute z-10 w-6 h-6 rounded-full bg-[#397F7A] border-2 border-white shadow-md flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">🏠</span>
              </div>

              {/* Live Patient Beacon Dot */}
              <div
                className="absolute z-20 transition-all duration-700 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{
                  left: `${dotX}%`,
                  top: `${dotY}%`,
                }}
              >
                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                  isSafe ? 'bg-[#4F8A5B] text-white' : 'bg-[#C95C5C] text-white animate-bounce'
                }`}>
                  <span className={`absolute inset-0 rounded-full animate-ping ${
                    isSafe ? 'bg-[#4F8A5B]/50' : 'bg-[#C95C5C]/60'
                  }`}></span>
                  <span className="text-sm relative z-10">👤</span>
                </div>
                <span className={`text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full shadow-sm ${
                  isSafe ? 'bg-[#FFFDF7] text-[#4F8A5B] border border-[#4F8A5B]/40' : 'bg-[#FFF5F5] text-[#C95C5C] border border-[#C95C5C]/60'
                }`}>
                  {distanceMeters}m
                </span>
              </div>
            </div>

            {/* Radar Status Bar */}
            <div className={`w-full p-4 rounded-2xl border flex items-center justify-between mt-2 text-xs sm:text-sm font-bold ${
              isSafe 
                ? 'bg-[#F0FDF4] text-[#4F8A5B] border-[#4F8A5B]/40' 
                : 'bg-[#FFF5F5] text-[#C95C5C] border-[#C95C5C]/60 animate-pulse'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{isSafe ? '🟢' : '🔴'}</span>
                <span>{isSafe ? 'STATUS: INSIDE SAFE ZONE' : 'STATUS: GEOFENCE BREACH DETECTED'}</span>
              </div>
              <span className="text-[#263B42]">BATTERY: {battery}%</span>
            </div>
          </div>

          {/* TELEMETRY & CONTROLS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Action Card */}
            <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-[#263B42] flex items-center gap-2">
                <span>⚡</span>
                <span>Emergency Dispatch & Rescue</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-[#397F7A] hover:bg-[#2E6B66] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-center"
                >
                  <span>🗺️</span>
                  <span>Open Google Maps</span>
                </a>
                <a
                  href={`tel:${radarData?.caregiverPhone || '+91 98765 43210'}`}
                  className="p-3.5 rounded-2xl bg-[#4F8A5B] hover:bg-[#41754c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 text-center"
                >
                  <span>📞</span>
                  <span>Call Emergency Line</span>
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F7F3E8] border border-[#EADBCC] text-xs text-[#263B42] space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-[#566D75]">PATIENT:</span>
                  <span className="text-[#263B42] font-bold">{radarData?.patientName || 'Arthur Pendelton'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566D75]">HOME ADDRESS:</span>
                  <span className="text-[#397F7A] font-bold truncate max-w-[200px]">{radarData?.safeZone?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#566D75]">LAST PING:</span>
                  <span className="text-[#4F8A5B] font-bold">Just now</span>
                </div>
              </div>
            </div>

            {/* SIH HACKATHON LIVE SIMULATION PANEL */}
            <div className="bg-[#FFFDF7] border-2 border-[#8DB7A5]/50 p-6 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#397F7A] uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎮</span>
                  <span>Safety Radar Simulator</span>
                </h3>
                <span className="text-[10px] font-bold text-[#397F7A] bg-[#8DB7A5]/20 px-2 py-0.5 rounded-full border border-[#8DB7A5]/40">
                  DEMO MODE
                </span>
              </div>
              <p className="text-xs text-[#566D75]">
                Simulate wandering scenarios to evaluate boundary alarms:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(0, 'Inside Living Room')}
                  className="p-2.5 rounded-xl bg-[#F7F3E8] hover:bg-[#EADBCC] text-[#263B42] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-[#EADBCC]"
                >
                  <span>🏠</span>
                  <span>At Home (0m)</span>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(140, 'Front Garden')}
                  className="p-2.5 rounded-xl bg-[#F7F3E8] hover:bg-[#EADBCC] text-[#263B42] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-[#EADBCC]"
                >
                  <span>🚶</span>
                  <span>Garden (140m)</span>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(380, 'Neighborhood Park')}
                  className="p-2.5 rounded-xl bg-[#FFF9E6] hover:bg-[#faeec7] border border-[#D9A441]/50 text-[#D9A441] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>🌳</span>
                  <span>Near Limit (380m)</span>
                </button>
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => simulateLocation(850, 'Main Highway Out of Bounds')}
                  className="p-2.5 rounded-xl bg-[#FFF5F5] hover:bg-[#fde2e2] border border-[#C95C5C]/60 text-[#C95C5C] text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>🚨</span>
                  <span>Breach (850m)</span>
                </button>
              </div>

              <button
                type="button"
                disabled={simulating}
                onClick={() => simulateLocation(750, 'Emergency SOS Location', true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#C95C5C] hover:bg-[#b04a4a] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm mt-2"
              >
                <span>🆘</span>
                <span>Simulate Patient "I'm Lost" SOS</span>
              </button>
            </div>

            {/* SAFE ZONE CONFIGURATION FORM */}
            <form onSubmit={handleSaveZone} className="bg-[#FFFDF7] border border-[#EADBCC] p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#263B42] flex items-center gap-2">
                <span>⚙️</span>
                <span>Safe Zone Boundary Settings</span>
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-[#566D75] mb-1 flex justify-between">
                  <span>Safe Radius Perimeter</span>
                  <span className="text-[#397F7A] font-bold">{radiusInput} meters</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                  className="w-full accent-[#397F7A] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#566D75] mb-1">
                  Home Safe Anchor Address
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EADBCC] text-[#263B42] text-xs focus:outline-none focus:border-[#397F7A]"
                  placeholder="e.g. 442 Maplewood Enclave, Block B, New Delhi"
                />
              </div>

              <button
                type="submit"
                disabled={savingZone}
                className="w-full py-2.5 rounded-xl bg-[#397F7A] hover:bg-[#2E6B66] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                {savingZone ? 'Saving...' : 'Update Safe Zone Limits'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECENT WANDERING INCIDENT HISTORY */}
      {radarData?.wanderingAlerts && radarData.wanderingAlerts.length > 0 && (
        <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-[#263B42] flex items-center gap-2">
            <span>📋</span>
            <span>Recent Wandering Incident Logs</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase font-bold text-[#566D75] border-b border-[#EADBCC] bg-[#F7F3E8]">
                <tr>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Distance</th>
                  <th className="py-3 px-3">Trigger Source</th>
                  <th className="py-3 px-3">Incident Note</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EADBCC] text-xs">
                {radarData.wanderingAlerts.map((alert, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F3E8] transition-colors">
                    <td className="py-3 px-3 text-[#566D75]">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#C95C5C]">
                      {alert.distanceMeters}m from home
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        alert.triggeredBy === 'PATIENT_SOS'
                          ? 'bg-[#FFF5F5] text-[#C95C5C] border border-[#C95C5C]/40'
                          : 'bg-[#FFF9E6] text-[#D9A441] border border-[#D9A441]/40'
                      }`}>
                        {alert.triggeredBy}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#263B42]">
                      {alert.note}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#397F7A] hover:underline font-bold"
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
