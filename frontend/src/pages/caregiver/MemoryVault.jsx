import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';

const MemoryVault = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [year, setYear] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [audioPrompt, setAudioPrompt] = useState('');
  const [tags, setTags] = useState('Family');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const { speak, chime } = useVoice();

  // Load patients on mount
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

  // Load memories whenever selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId) {
      setLoading(false);
      return;
    }
    async function fetchMemories() {
      setLoading(true);
      try {
        const { data } = await api.get(`/memories/${selectedPatientId}`);
        setMemories(data.memories || []);
      } catch (err) {
        console.error('Failed to fetch patient memories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMemories();
  }, [selectedPatientId]);

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !title || !imageUrl) return;

    setSubmitting(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      const { data } = await api.post('/memories', {
        patientId: selectedPatientId,
        title,
        relationship,
        year,
        imageUrl,
        caption,
        audioPrompt: audioPrompt || caption || title,
        tags: tagArray.length > 0 ? tagArray : ['Family']
      });

      chime('success');
      setMemories(prev => [data.memory, ...prev]);
      setShowAddModal(false);
      setActionMsg('Memory card successfully added to vault!');
      setTimeout(() => setActionMsg(''), 4000);

      // Reset form
      setTitle('');
      setYear('');
      setImageUrl('');
      setCaption('');
      setAudioPrompt('');
      setTags('Family');
    } catch (err) {
      console.error('Failed to add memory:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Are you sure you want to remove this memory card?')) return;
    try {
      await api.delete(`/memories/${id}`);
      chime('click');
      setMemories(prev => prev.filter(m => m._id !== id));
      setActionMsg('Memory card deleted.');
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handlePreviewVoice = (text) => {
    chime('click');
    speak(text);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-slate-900/90 border border-purple-900/50 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-950/80 text-purple-300 border border-purple-500/40">
            <span>🖼️ Clinical Reminiscence Vault</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Digital Memory Vault
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium">
            Upload tagged family photos and comforting voice scripts to reduce sundowning & anxiety.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
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

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all active:scale-95 flex items-center gap-2"
          >
            <span>➕</span>
            <span>Add Family Memory</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-sm font-bold shadow-md animate-fadeIn">
          ✓ {actionMsg}
        </div>
      )}

      {/* Memory Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading memory cards...
        </div>
      ) : memories.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
          <p className="text-xl font-bold text-white">No memories stored for this patient yet.</p>
          <p className="text-sm text-slate-400">Click "+ Add Family Memory" to upload their first cherished photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memories.map((mem) => (
            <div
              key={mem._id}
              className="bg-slate-900/90 rounded-3xl overflow-hidden border border-purple-900/40 shadow-xl hover:border-purple-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={mem.imageUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-950/90 text-purple-200 border border-purple-500/40">
                      {mem.relationship}
                    </span>
                    {mem.year && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-900/90 text-slate-300 border border-slate-700">
                        {mem.year}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-lg font-black text-white">{mem.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-3">{mem.caption}</p>
                  
                  {mem.audioPrompt && (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/40 text-[11px] text-purple-200 mt-2">
                      <span className="font-bold">🔊 Voice Reassurance: </span>
                      <span className="italic">{mem.audioPrompt}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-800/80 mt-3">
                <button
                  type="button"
                  onClick={() => handlePreviewVoice(mem.audioPrompt || mem.caption)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>🔊 Test Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMemory(mem._id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD MEMORY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/40 p-6 sm:p-8 rounded-3xl max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>➕</span>
                <span>Add Reminiscence Memory</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-3 py-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                  Memory Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  placeholder="e.g. Grandson Aarav's Graduation"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                    Relationship / Tag
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="Grandson">Grandson</option>
                    <option value="Granddaughter">Granddaughter</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Family Pet">Family Pet</option>
                    <option value="Family Vacation">Family Vacation</option>
                    <option value="Childhood Home">Childhood Home</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                    Era / Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400"
                    placeholder="e.g. 1998, 2018"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                  Photo URL *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  placeholder="https://images.unsplash.com/... or image link"
                />
                {/* Preset quick image suggestions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 text-purple-300 hover:bg-slate-700"
                  >
                    Preset: Grandchild 👦
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 text-purple-300 hover:bg-slate-700"
                  >
                    Preset: Mountains 🏔️
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800 text-purple-300 hover:bg-slate-700"
                  >
                    Preset: Golden Dog 🐕
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                  Story / Caption Description
                </label>
                <textarea
                  rows="2"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  placeholder="Brief memory context..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-purple-200 mb-1">
                  Voice Reassurance Script (Read Aloud to Patient)
                </label>
                <textarea
                  rows="2"
                  value={audioPrompt}
                  onChange={(e) => setAudioPrompt(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400"
                  placeholder="e.g. This is your grandson Aarav. He loves you very much and is studying engineering."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-black shadow-lg"
                >
                  {submitting ? 'Saving...' : 'Save to Memory Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryVault;
