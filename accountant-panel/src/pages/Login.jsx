import React from 'react';
import useAuthStore from '../store/useAuthStore';
import logo from '../assets/logo.jpg';

const Login = () => {
  const { isLoading } = useAuthStore();

  const handleGoogleLogin = () => {
    // 1. Get base URL and trim any trailing slashes to avoid "api//auth"
    const apiBase = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://lambawheels-backend-orcin.vercel.app/api').replace(/\/$/, "");
    
    // 2. Build the final URL
    const finalUrl = `${apiBase}/auth/google`;

    // 3. Log to console so you can debug the exact path being called
    console.log("Redirecting to Google Auth:", finalUrl);

    // 4. Perform the redirect
    window.location.href = finalUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans p-4 overflow-hidden">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-fade-in {
            animation: fadeIn 1s ease-out forwards;
            opacity: 0;
          }
          .delay-200 { animation-delay: 0.2s; }
          .delay-400 { animation-delay: 0.4s; }
        `}
      </style>

      <div className="animate-fade-in-up bg-white p-10 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center gap-8 border-t-4 border-blue-600 hover:shadow-[0_0_30px_rgba(37,99,235,0.15)] transition-shadow duration-500">

        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-4 animate-fade-in delay-200">
          <img
            src={logo}
            alt="Lamba Wheels Logo"
            className="w-28 h-28 object-contain bg-white rounded-2xl shadow-md border-2 border-gray-200 hover:scale-110 hover:-rotate-3 transition-transform duration-300 ease-out cursor-pointer"
          />
          <div className="text-center">
            <h1 className="text-3xl font-black text-black tracking-tight">Lamba Wheels</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-1">Accountant Portal</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 animate-fade-in delay-200">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Secure Sign In</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        {/* Google Login Button */}
        <div className="w-full animate-fade-in delay-400">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group w-full bg-white border-2 border-black hover:border-blue-600 hover:text-blue-600 text-black font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300"
            />
            {isLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-500 text-center leading-relaxed animate-fade-in delay-400">
          Only authorized accountant accounts can access this portal.<br />
          <span className="text-blue-600 font-semibold">Contact superadmin for access.</span>
        </p>
      </div>
    </div>
  );
};

export default Login;