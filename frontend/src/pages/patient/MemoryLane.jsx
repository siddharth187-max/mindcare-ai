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
        speak('Let us look at your family photos. Tap who is in each picture.');
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
    }
  };

  const handleAnswerSelect = (option, question) => {
    if (quizFeedback) return;

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
          speak('Splendid job! You remembered your family memories today!');
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
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16 font-sans">
      <ConfettiCanvas active={showConfetti} />

      {/* Top Header Card */}
      <div className="bg-[#FFFDF7] border border-[#EADBCC] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#EAF2EE] text-[#397F7A] border border-[#C8DDD4]">
            <span>🖼️ Family Memory Album</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#263B42] tracking-tight">
            My Memory Lane
          </h1>
          <p className="text-base text-[#566D75] font-medium">
            Cherished family stories, loved ones, and reassuring memories of home.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startQuiz}
            className="px-5 py-3 rounded-2xl bg-[#8DB7A5] hover:bg-[#79A391] text-[#263B42] font-bold text-base shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <span>✨</span>
            <span>Family Recall Quiz</span>
          </button>
          <Link
            to="/patient"
            className="px-5 py-3 rounded-2xl bg-[#F7F3E8] hover:bg-[#EAF2EE] text-[#263B42] border border-[#C8DDD4] font-bold text-base transition-all flex items-center gap-1.5"
          >
            <span>← Dashboard</span>
          </Link>
        </div>
      </div>

      {/* QUIZ MODAL / OVERLAY */}
      {quizMode && (
        <div className="bg-[#FFFDF7] border-2 border-[#8DB7A5] p-6 sm:p-8 rounded-3xl shadow-md relative animate-fadeIn">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EADBCC]">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#263B42]">Family Recall Quiz</h2>
            </div>
            <button
              onClick={() => setQuizMode(false)}
              className="text-[#566D75] hover:text-[#263B42] text-sm font-bold bg-[#F7F3E8] hover:bg-[#EAF2EE] px-3.5 py-1.5 rounded-xl border border-[#C8DDD4]"
            >
              ✕ Close Quiz
            </button>
          </div>

          {!quizFinished && quizQuestions[currentQuestionIndex] && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Image Column */}
              <div className="relative group overflow-hidden rounded-2xl border border-[#C8DDD4] shadow-sm max-h-80 flex items-center justify-center bg-[#F7F3E8]">
                <img
                  src={quizQuestions[currentQuestionIndex].imageUrl}
                  alt="Memory recall"
                  className="w-full h-full object-cover max-h-80"
                />
                <button
                  type="button"
                  onClick={() => speak(quizQuestions[currentQuestionIndex].question)}
                  className="absolute bottom-3 right-3 px-3.5 py-2 bg-[#FFFDF7]/95 backdrop-blur-sm rounded-xl text-xs font-bold text-[#397F7A] border border-[#C8DDD4] shadow-sm hover:bg-[#EAF2EE] flex items-center gap-1.5"
                >
                  <span>🔊 Hear Question</span>
                </button>
              </div>

              {/* Options Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#566D75] uppercase tracking-wider">
                  <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                  <span className="text-[#397F7A]">Score: {quizScore} Correct</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-[#263B42]">
                  {quizQuestions[currentQuestionIndex].question}
                </h3>

                {quizFeedback && (
                  <div className={`p-4 rounded-2xl text-sm font-bold border ${
                    quizFeedback.type === 'correct'
                      ? 'bg-[#EBF5ED] text-[#4F8A5B] border-[#B7D9BE]'
                      : 'bg-[#FBF4E4] text-[#D9A441] border-[#EED7A6]'
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
                      className="w-full min-h-14 p-4 rounded-2xl text-left font-bold text-base sm:text-lg bg-[#FFFDF7] hover:bg-[#EAF2EE] border-2 border-[#C8DDD4] hover:border-[#397F7A] text-[#263B42] transition-all shadow-sm active:scale-98 flex items-center justify-between"
                    >
                      <span>👤 {opt.label}</span>
                      <span className="text-[#397F7A] text-sm">Select ➔</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {quizFinished && (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#263B42]">
                Wonderful Memory Activity!
              </h3>
              <p className="text-base text-[#566D75] font-medium max-w-md mx-auto">
                You correctly identified your family memories with a score of {quizScore} / {quizQuestions.length}.
              </p>
              <button
                type="button"
                onClick={() => setQuizMode(false)}
                className="px-8 py-3.5 rounded-2xl bg-[#397F7A] hover:bg-[#2E6B66] text-white font-bold text-lg shadow-sm active:scale-95 transition-all"
              >
                Back to Album Gallery
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {allTags.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#566D75] mr-2">Filter:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedTag === tag
                  ? 'bg-[#397F7A] text-white shadow-sm'
                  : 'bg-[#FFFDF7] text-[#263B42] hover:bg-[#EAF2EE] border border-[#C8DDD4]'
              }`}
            >
              {tag === 'All' ? '🌟 All Memories' : tag}
            </button>
          ))}
        </div>
      )}

      {/* Memory Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#263B42] font-bold">
          <div className="w-10 h-10 border-4 border-[#8DB7A5] border-t-[#397F7A] rounded-full animate-spin mx-auto mb-4"></div>
          Loading memory cards...
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFDF7] rounded-3xl border border-[#EADBCC] text-[#566D75]">
          <p className="text-lg font-bold">No memories found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {filteredMemories.map((mem) => (
            <div
              key={mem._id}
              className="bg-[#FFFDF7] rounded-3xl overflow-hidden border border-[#EADBCC] shadow-sm hover:border-[#8DB7A5] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo Header */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#F7F3E8]">
                  <img
                    src={mem.imageUrl}
                    alt={mem.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80';
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFFDF7]/95 text-[#263B42] border border-[#C8DDD4] shadow-sm">
                      👤 {mem.relationship || 'Family'}
                    </span>
                    {mem.year && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F7F3E8]/95 text-[#566D75] border border-[#EADBCC] shadow-sm">
                        📅 {mem.year}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-2.5">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#263B42]">
                    {mem.title}
                  </h3>
                  <p className="text-base text-[#566D75] font-medium leading-relaxed">
                    {mem.caption}
                  </p>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleSpeakMemory(mem)}
                  className={`w-full min-h-12 py-3 px-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 ${
                    speakingId === mem._id
                      ? 'bg-[#4F8A5B] text-white'
                      : 'bg-[#397F7A] hover:bg-[#2E6B66] text-white'
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
