// frontend/app/(dashboard)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { interviewAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Interview {
  interview_id: string;
  job_role: string;
  status: string;
  overall_score: number | null;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await interviewAPI.getMyInterviews();
      setInterviews(response.data.interviews);
    } catch (err) {
      console.error('Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Completed</span>;
    }
    return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">In Progress</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-500 mt-2">Ready to practice your interview skills?</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-4xl font-bold text-blue-600">{interviews.length}</div>
            <div className="text-gray-500 mt-1">Total Interviews</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {interviews.filter(i => i.status === 'completed').length}
            </div>
            <div className="text-gray-500 mt-1">Completed</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {interviews.length > 0
                ? (interviews
                    .filter(i => i.overall_score)
                    .reduce((sum, i) => sum + (i.overall_score || 0), 0) /
                    interviews.filter(i => i.overall_score).length || 0
                  ).toFixed(1)
                : '—'}
            </div>
            <div className="text-gray-500 mt-1">Average Score</div>
          </Card>
        </div>

        {/* Start New Interview Button */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/interview/setup')}
            className="text-lg px-8 py-4"
          >
            🎤 Start New Interview
          </Button>
        </div>

        {/* Previous Interviews Table */}
        <Card title="Previous Interviews">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-500 text-lg">No interviews yet!</p>
              <p className="text-gray-400">Click "Start New Interview" to begin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Job Role</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Score</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview.interview_id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 font-semibold text-gray-800">{interview.job_role}</td>
                      <td className="py-4 px-4">{getStatusBadge(interview.status)}</td>
                      <td className={`py-4 px-4 font-bold text-lg ${getScoreColor(interview.overall_score)}`}>
                        {interview.overall_score ? `${interview.overall_score}/10` : '—'}
                      </td>
                      <td className="py-4 px-4 text-gray-500">
                        {new Date(interview.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        {interview.status === 'completed' && (
                          <button
                            onClick={() => router.push(`/report?id=${interview.interview_id}`)}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            View Report
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}