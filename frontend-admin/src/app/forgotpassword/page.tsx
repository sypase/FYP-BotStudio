// page.tsx

"use client";
import axios from 'axios';
import Link from 'next/link';
import { useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { serverURL } from '@/utils/utils';
import { ToastContainer, toast } from 'react-toastify';

const Page = () => {
    const [email, setEmail] = useState<string>("");

    const resetPassword = async () => {
        try {
            const response = await axios.post(`${serverURL}/users/reset-password`, { email });
            toast.success("Reset password email sent successfully");
        } catch (error) {
            toast.error("Something went wrong while sending reset password email");
        }
    }

    return (
        <main className="w-screen h-screen bg-black flex flex-col items-center justify-center p-2 overflow-hidden">
            <div className="animate-fade-in-bottom flex flex-col w-full max-w-md bg-white rounded-xl p-10 shadow-md">
                <h1 className="text-4xl font-bold mb-8">Forgot Password</h1>
                <p className="mb-8 text-lg">
                    Remembered your password?{' '}
                    <Link href={'/login'}>
                        <span className="text-black hover:text-gray-700 cursor-pointer font-semibold">Login</span>
                    </Link>
                </p>
                <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
                        Email
                    </label>
                    <input
                        id="email"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Email"
                        type="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                    />
                </div>
                <button
                    className="w-full bg-black text-white font-bold py-3 px-6 rounded-md hover:bg-gray-800 transition-colors duration-300"
                    onClick={() => resetPassword()}
                >
                    Send Reset Link
                </button>
            </div>
            <ToastContainer />
        </main>
    )
}

export default Page;