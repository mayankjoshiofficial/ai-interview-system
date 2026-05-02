// frontend/components/Navbar.tsx
'use client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-lg">
      <div
        className="text-xl font-bold cursor-pointer flex items-center gap-2"
        onClick={() => router.push('/dashboard')}
      >
        <span className="text-blue-400">🤖</span>
        <span>AI Interview System</span>
      </div>

      {isAuthenticated && (
        <div className="flex items-center gap-6">
          <span className="text-gray-300">
            👋 Hello, <span className="text-white font-semibold">{user?.name}</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}