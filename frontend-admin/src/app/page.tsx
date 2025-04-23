"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { serverURL } from "@/utils/utils";

const quotes = [
  "Empowering AI, Empowering You",
  "Innovate with Intelligence", 
  "Shaping the Future of AI",
  "Smart Solutions for a Smarter World",
  "Unleashing the Power of AI",
];

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [quote, setQuote] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      setIsLoggedIn(true);
      router.push("/admin/dashboard");
    }
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const login = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${serverURL}/users/admin-login`, {
        email,
        password,
      });
      
      toast.success("Logged In Successfully!");
      localStorage.setItem("token", response.data.token);
      setIsLoggedIn(true);
      router.push("/admin/dashboard");
    } catch (error: any) {
      const errorMessage = error.response?.data || "An error occurred during login";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    toast.success("Logged out successfully!");
    router.push("/admin");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="w-1/2 flex flex-col justify-center items-center text-white p-12">
        <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          Botstudio Admin
        </h1>
        <p className="text-2xl italic text-gray-300">{quote}</p>
      </div>
      <div className="w-1/2 flex items-center justify-center">
        {isLoggedIn ? (
          <div className="text-center">
            <p className="text-2xl mb-6 text-white">Welcome to the Admin Panel!</p>
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-200 hover:text-black transition-colors duration-300 font-semibold"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Admin Login</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  type="email"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
              </div>
              <button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={login}
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
              <div className="flex justify-end">
                <Link 
                  href="/forgotpassword" 
                  className="text-gray-300 hover:text-white font-medium text-sm"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer 
        position="bottom-right"
        theme="dark"
        autoClose={3000}
      />
    </div>
  );
}