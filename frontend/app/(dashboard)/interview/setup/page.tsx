// frontend/app/(dashboard)/interview/setup/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { interviewAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const JOB_ROLES = [
  'Python Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Backend Developer',
  'Android Developer',
  'iOS Developer',
  'Cloud Engineer',
];

export default function SetupPage() {
  const router = useRouter();
  const [resume, setResume] = useState<File | null>(null);
  const [jobRole, setJobRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartInterview = async () => {
    if (!resume) return setError('Please upload your resume');
    if (!jobRole && !customRole) return setError('Please select or enter a job role');

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('job_role', customRole || jobRole);

      const response = await interviewAPI.init(formData);
      const { interview_id, first_question } = response.data;

      // Store interview data for the room page
      localStorage.setItem('current_interview_id', interview_id);
      localStorage.setItem('current_question', first_question);
      localStorage.setItem('question_number', '1');

      router.push('/interview/room');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Setup Interview</h1>
          <p className="text-gray-500 mt-2">Upload your resume and select the job role</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Resume Upload */}
        <Card title="📄 Upload Your Resume" className="mb-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-all"
            onClick={() => document.getElementById('resume-input')?.click()}
          >
            {resume ? (
              <div>
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-600 font-semibold">{resume.name}</p>
                <p className="text-gray-400 text-sm mt-1">Click to change file</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📁</div>
                <p className="text-gray-600 font-semibold">Click to upload PDF resume</p>
                <p className="text-gray-400 text-sm mt-1">Only PDF files accepted</p>
              </div>
            )}
            <input
              id="resume-input"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
            />
          </div>
        </Card>

        {/* Job Role Selection */}
        <Card title="💼 Select Job Role" className="mb-6">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {JOB_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => { setJobRole(role); setCustomRole(''); }}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                  jobRole === role
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 text-gray-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Or enter custom role:
            </label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => { setCustomRole(e.target.value); setJobRole(''); }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              placeholder="e.g. React Native Developer"
            />
          </div>
        </Card>

        {/* Microphone Check */}
        <Card title="🎤 Before You Start" className="mb-6">
          <ul className="space-y-2 text-gray-600">
            <li>✅ Make sure your microphone is connected and working</li>
            <li>✅ Find a quiet place with no background noise</li>
            <li>✅ Allow microphone access when the browser asks</li>
            <li>✅ Speak clearly and at a normal pace</li>
          </ul>
        </Card>

        <Button
          onClick={handleStartInterview}
          loading={loading}
          className="w-full py-4 text-xl"
        >
          🚀 Start AI Interview
        </Button>
      </div>
    </div>
  );
}