// frontend/app/(dashboard)/interview/room/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { interviewAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function InterviewRoomPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [interviewId, setInterviewId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interviewIdStored = localStorage.getItem('current_interview_id');
    const questionStored = localStorage.getItem('current_question');
    const questionNumberStored = localStorage.getItem('question_number');

    if (!interviewIdStored || !questionStored) {
      router.push('/interview/setup');
      return;
    }

    setInterviewId(interviewIdStored);
    setQuestion(questionStored);
    setQuestionNumber(parseInt(questionNumberStored || '1'));

    // Get the latest question ID from DB
    fetchLatestQuestionId(interviewIdStored);
  }, []);

  const fetchLatestQuestionId = async (intId: string) => {
    try {
      const response = await interviewAPI.getReport(intId);
      const questions = response.data.questions;
      if (questions.length > 0) {
        const lastQuestion = questions[questions.length - 1];
        setQuestionId(lastQuestion.question_id);
      }
    } catch (err) {
      console.error('Failed to fetch question ID');
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const submitAnswer = async () => {
    if (!audioBlob) return setError('Please record your answer first');

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.wav');
      formData.append('interview_id', interviewId);
      formData.append('question_id', questionId);

      const response = await interviewAPI.submitAnswer(formData);
      const data = response.data;

      setFeedback(data);

      // Update for next question
      localStorage.setItem('current_question', data.next_question);
      localStorage.setItem('question_number', String(questionNumber + 1));

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setQuestion(feedback.next_question);
    setQuestionNumber(prev => prev + 1);
    setQuestionId(feedback.next_question_id);
    setFeedback(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const endInterview = async () => {
    try {
      await interviewAPI.endInterview(interviewId);
      router.push(`/report?id=${interviewId}`);
    } catch (err) {
      router.push(`/report?id=${interviewId}`);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">
            Question {questionNumber}
          </h1>
          <button
            onClick={endInterview}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            End Interview
          </button>
        </div>

        {/* Question Card */}
        <div className="bg-blue-900 border border-blue-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-blue-300 text-sm font-semibold mb-2">AI Interviewer asks:</p>
              <p className="text-white text-lg leading-relaxed">{question}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Recording Section */}
        {!feedback && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4">🎤 Your Answer</h2>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-semibold">Recording... {formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Audio Preview */}
            {audioBlob && !isRecording && (
              <div className="mb-4">
                <p className="text-green-400 text-sm mb-2">✅ Recording complete! Preview:</p>
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  className="w-full"
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 flex-wrap">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <span>⏺</span> {audioBlob ? 'Re-record' : 'Start Recording'}
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <span>⏹</span> Stop Recording
                </button>
              )}

              {audioBlob && !isRecording && (
                <Button
                  onClick={submitAnswer}
                  loading={isSubmitting}
                  variant="success"
                >
                  Submit Answer →
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        {feedback && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold text-lg mb-4">📊 AI Feedback</h2>

            {/* Score */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-5xl font-bold ${
                feedback.ai_score >= 8 ? 'text-green-400' :
                feedback.ai_score >= 6 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {feedback.ai_score}/10
              </div>
              <div className="text-gray-400 text-sm">Score for this answer</div>
            </div>

            {/* Transcription */}
            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm mb-1">What you said:</p>
              <p className="text-white text-sm">{feedback.transcribed_text}</p>
            </div>

            {/* Feedback */}
            <div className="bg-blue-900 rounded-lg p-4 mb-4">
              <p className="text-blue-300 text-sm mb-1">AI Feedback:</p>
              <p className="text-white text-sm">{feedback.ai_feedback}</p>
            </div>

            {/* Filler Words */}
            {feedback.filler_words_detected?.length > 0 && (
              <div className="bg-yellow-900 rounded-lg p-4 mb-4">
                <p className="text-yellow-300 text-sm mb-1">⚠️ Filler words detected:</p>
                <p className="text-white text-sm">{feedback.filler_words_detected.join(', ')}</p>
              </div>
            )}

            {/* Next Question Buttons */}
            <div className="flex gap-4 mt-4">
              <Button onClick={nextQuestion} variant="primary">
                Next Question →
              </Button>
              <Button onClick={endInterview} variant="danger">
                End & See Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}