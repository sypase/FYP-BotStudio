'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { serverURL } from '@/utils/utils';

export default function PaymentSuccess() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paymentIntentId = searchParams.get('payment_intent');
        if (!paymentIntentId) {
          throw new Error('No payment intent ID found in URL');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }

        console.log('Verifying payment with ID:', paymentIntentId);
        const response = await fetch(`${serverURL}/credits/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentIntentId })
        });

        const data = await response.json();
        console.log('Verification response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setIsSuccess(true);
        toast.success(`Successfully added ${data.credits} credits to your account!`);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } catch (error) {
        console.error('Payment verification error:', error);
        setErrorMessage(error.message || 'Failed to verify payment. Please contact support if this persists.');
        toast.error(error.message || 'Failed to verify payment');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {isVerifying ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verifying your payment...</h2>
            <p className="mt-2 text-gray-600">Please wait while we process your payment.</p>
          </div>
        ) : isSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-gray-600">Your credits have been added to your account.</p>
            <p className="mt-2 text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">{errorMessage}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 