'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { serverURL } from '@/utils/utils';

function PaymentSuccessContent() {
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
        setErrorMessage(error instanceof Error ? error.message : 'An error occurred during payment verification');
        toast.error(error instanceof Error ? error.message : 'An error occurred during payment verification');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-error text-2xl mb-4">❌</div>
          <p className="text-lg text-error">{errorMessage}</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => router.push('/dashboard')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-success text-2xl mb-4">✅</div>
          <p className="text-lg text-success">Payment verified successfully!</p>
          <p className="mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
} 