// frontend/app/(dashboard)/report/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { interviewAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (interviewId) fetchReport();
  }, [interviewId]);

  const fetchReport = async () => {
    try {
      const response = await interviewAPI.getReport(interviewId!);
      setReport(response.data);
    } catch (err) {
      console.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const chartData = report?.questions
    ?.filter((q: any) => q.ai_score)
    ?.map((q: any, i: number) => ({
      name: `Q${i + 1}`,
      score: q.ai_score,
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-xl">Loading report...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Interview Report 📊</h1>
          <p className="text-gray-500 mt-2">Role: {report?.job_role}</p>
        </div>

        {/* Overall Score */}
        <Card className="mb-6 text-center">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {report?.overall_score || report?.average_score || '—'}/10
          </div>
          <div className="text-gray-500 text-lg">Overall Score</div>
          <div className="text-gray-400 text-sm mt-2">
            {report?.answered_questions} questions answered
          </div>
        </Card>

        {/* Score Chart */}
        {chartData?.length > 0 && (
          <Card title="📈 Score Per Question" className="mb-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Question Breakdown */}
        <Card title="📝 Question Breakdown" className="mb-6">
          <div className="space-y-6">
            {report?.questions?.map((q: any, index: number) => (
              <div key={q.question_id} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">Q{index + 1}: {q.question_text}</h3>
                  {q.ai_score && (
                    <span className={`text-2xl font-bold ${getScoreColor(q.ai_score)}`}>
                      {q.ai_score}/10
                    </span>
                  )}
                </div>

                {q.transcribed_text && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-gray-500 text-xs mb-1">Your Answer:</p>
                    <p className="text-gray-700 text-sm">{q.transcribed_text}</p>
                  </div>
                )}

                {q.ai_feedback && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-blue-500 text-xs mb-1">AI Feedback:</p>
                    <p className="text-gray-700 text-sm">{q.ai_feedback}</p>
                  </div>
                )}

                {q.filler_words_detected?.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-yellow-600 text-xs mb-1">⚠️ Filler Words:</p>
                    <p className="text-gray-700 text-sm">{q.filler_words_detected.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => router.push('/dashboard')}>
            ← Back to Dashboard
          </Button>
          <Button onClick={() => router.push('/interview/setup')} variant="success">
            Start New Interview
          </Button>
        </div>
      </div>
    </div>
  );
}