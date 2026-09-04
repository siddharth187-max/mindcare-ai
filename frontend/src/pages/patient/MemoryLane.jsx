import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useVoice } from '../../hooks/useVoice';
import ConfettiCanvas from '../../components/ConfettiCanvas';

const MemoryLane = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('All');
  const [speakingId, setSpeakingId] = useState(null);
  const [patientId, setPatientId] = useState(null);

  // Quiz Mode State
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const { speak, chime } = useVoice();

  useEffect(() => {
    async function loadMemories() {
      try {
        const { data: patientData } = await api.get('/patients/me');
        const pId = patientData?.patient?._id || patientData?._id;
        setPatientId(pId);

        if (pId) {
          const { data } = await api.get(`/memories/${pId}`);
          setMemories(data.memories || []);
        }
      } catch (err) {
        console.error('Failed to load memories:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMemories();
  }, []);

  const handleSpeakMemory = (memory) => {
    setSpeakingId(memory._id);
    chime('click');
    const speech = memory.audioPrompt || `${memory.title}. ${memory.caption}`;
    speak(speech);
    setTimeout(() => setSpeakingId(null), 7000);
  };

  const startQuiz = async () => {
    if (!patientId) return;
    try {
      const { data } = await api.get(`/memories/quiz/${patientId}`);
      if (data.quiz && data.quiz.length > 0) {
        setQuizQuestions(data.quiz);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setQuizFeedback(null);
        setQuizFinished(false);
        setQuizMode(true);
        speak('Let us play a friendly memory recall activity. Look at the photo and pick who it is.');
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
    }
  };

  const handleAnswerSelect = (option, question) => {
    if (quizFeedback) return; // prevent multiple clicks

    if (option.isCorrect) {
      chime('success');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setQuizScore(prev => prev + 1);
      setQuizFeedback({
        type: 'correct',
        message: `Wonderful! Yes, this is your ${option.label} (${question.title})!`
      });
      speak(`Wonderful! Yes, that is correct!`);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < quizQuestions.length) {
          setCurrentQuestionIndex(prev => prev + 1);
          setQuizFeedback(null);
        } else {
          setQuizFinished(true);
          speak('Splendid job! You completed all the family memories today!');
        }
      }, 2500);
    } else {
      chime('click');
      setQuizFeedback({
        type: 'wrong',
        message: `That's okay! ${question.hint}`
      });
      speak(`Good try! Take your time and try the other options.`);
    }
  };

  const allTags = ['All', ...new Set(memories.flatMap(m => m.tags || []))];
  const filteredMemories = selectedTag === 'All' 
    ? memories 
    : memories.filter(m => m.tags?.includes(selectedTag) || m.relationship === selectedTag);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      <ConfettiCanvas active={showConfetti} />

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 p-6 sm:p-8 rounded-3xl border border-purple-800/40 shadow-[0_0_40px_rgba(147,51,234,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black bg-purple-900/60 text-purple-300 border border-purple-500/40">
            <span>🖼️ Digital Reminiscence Therapy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            My Memory Lane
          </h1>
          <p className="text-base text-purple-200/90 font-medium">
            Cherished family stories, loved ones, and reassuring memories of home.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startQuiz}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center gap-2"
          >
            <span>✨</span>
            <span>Family Recall Quiz</span>
          </button>
          <Link
            to="/patient"
            className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base transition-all flex items-center gap-1.5"
          >
            <span>← Dashboard</span>
          </Link>
        </div>
      </div>

      {/* QUIZ MODAL / OVERLAY */}
      {quizMode && (
        <div className="bg-slate-900/95 border-2 border-emerald-500/60 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] relative animate-fadeIn">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Family Recall Quiz</h2>
            </div>
            <button
              onClick={() => setQuizMode(false)}
              className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-3 py-1.5 rounded-xl"
            >
              ✕ Close Quiz
            </button>
          </div>

          {!quizFinished && quizQuestions[currentQuestionIndex] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Image Column */}
              <div className="relative group overflow-hidden rounded-2xl border-2 border-purple-500/40 shadow-xl max-h-80 flex items-center justify-center bg-black/40">
                <img
                  src={quizQuestions[currentQuestionIndex].imageUrl}
                  alt="Memory recall"
                  className="w-full h-full object-cover max-h-80"
                />
                <button
                  type="button"
                  onClick={() => speak(quizQuestions[currentQuestionIndex].question)}
                  className="absolute bottom-3 right-3 px-3.5 py-2 bg-slate-950/80 backdrop-blur-md rounded-xl text-xs font-bold text-purple-300 border border-purple-500/40 hover:text-white flex items-center gap-1.5"
                >
                  <span>🔊 Hear Question</span>
                </button>
              </div>

              {/* Options Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                  <span>Score: {quizScore} Correct</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {quizQuestions[currentQuestionIndex].question}
                </h3>

                {quizFeedback && (
                  <div className={`p-4 rounded-2xl text-sm font-black border ${
                    quizFeedback.type === 'correct'
                      ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-amber-950/80 text-amber-200 border-amber-500/60'
                  }`}>
                    {quizFeedback.message}
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  {quizQuestions[currentQuestionIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerSelect(opt, quizQuestions[currentQuestionIndex])}
                      className="w-full min-h-14 p-4 rounded-2xl text-left font-black text-base sm:text-lg bg-slate-800/80 hover:bg-purple-600/30 border-2 border-slate-700 hover:border-purple-400 text-white transition-all shadow-md active:scale-98 flex items-center justify-between"
                    >
                      <span>👤 {opt.label}</span>
                      <span className="text-slate-400 text-sm">Select ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {quizFinished && (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Wonderful Memory Activity!
              </h3>
              <p className="text-base text-purple-200 font-semibold max-w-md mx-auto">
                You correctly identified your family memories with a score of {quizScore} / {quizQuestions.length}.
              </p>
              <button
                type="button"
                onClick={() => setQuizMode(false)}
                className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-lg shadow-lg active:scale-95 transition-all"
              >
                Back to Memory Gallery
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {allTags.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 mr-2">Filter:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                selectedTag === tag
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tag === 'All' ? '🌟 All Memories' : tag}
            </button>
          ))}
        </div>
      )}

      {/* Memory Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading memory cards...
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
          <p className="text-lg font-bold">No memories found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {filteredMemories.map((mem) => (
            <div
              key={mem._id}
              className="bg-slate-900/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-900/40 shadow-xl hover:border-purple-500/50 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-950">
                  <img
                    src={mem.imageUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30"></div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-900/90 text-purple-200 backdrop-blur-md border border-purple-400/40 shadow-md">
                      👤 {mem.relationship || 'Family'}
                    </span>
                    {mem.year && (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/90 text-slate-200 backdrop-blur-md border border-slate-700 shadow-md">
                        📅 {mem.year}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                    {mem.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                    {mem.caption}
                  </p>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleSpeakMemory(mem)}
                  className={`w-full min-h-12 py-3 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                    speakingId === mem._id
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40'
                  }`}
                >
                  <span className="text-xl">🔊</span>
                  <span>{speakingId === mem._id ? 'Reading Story Aloud...' : 'Tell Me About This Photo'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryLane;
