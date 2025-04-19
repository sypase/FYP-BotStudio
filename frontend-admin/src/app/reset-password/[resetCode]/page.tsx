'use client';
import { useState } from 'react';
import axios from 'axios';
import { serverURL } from '@/utils/utils';
import { useRouter } from 'next/navigation';

const ResetPasswordPage = ({ params }: { params: { resetCode: string } }) => {
  const router = useRouter();
  const resetCode = params.resetCode;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${serverURL}/users/reset-password/confirm`, {
        resetCode,
        newPassword,
      });

      setSuccess(response.data);
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="animate-fade-in-bottom bg-white rounded-xl p-8 max-w-md w-full shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Reset Password</h1>
        <p className="mb-6">
          <span className="font-semibold">Reset Code:</span> {resetCode}
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white font-bold py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-300"
          >
            Reset Password
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {success && <p className="text-green-500 mt-4">{success}</p>}
      </div>
    </main>
  );
};

export default ResetPasswordPage;