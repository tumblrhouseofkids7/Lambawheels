import React from 'react';
import useAuthStore from '../store/useAuthStore';
import logo from '../assets/logo.jpg';

const Login = () => {
  const { isLoading } = useAuthStore();

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'https://lambawheels-backend-orcin.vercel.app/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans p-4 overflow-hidden">
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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
        
        <div className="flex flex-col items-center gap-4 animate-fade-in delay-200">
          <img
            src={logo}
            alt="Lamba Wheels Logo"
            className="w-24 h-24 object-contain rounded-full shadow-md border-2 border-black hover:scale-110 hover:-rotate-3 transition-transform duration-300 ease-out cursor-pointer"
          />
          <div className="text-center">
            <h1 className="text-3xl font-black text-black tracking-tight">Lamba Wheels</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mt-1">Foreman Portal</p>
          </div>
        </div>

        <div className="w-full flex items-center gap-3 animate-fade-in delay-200">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Secure Sign In</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <div className="w-full animate-fade-in delay-400">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group w-full bg-white border-2 border-black hover:border-blue-600 hover:text-blue-600 text-black font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-300" 
            />
            {isLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center leading-relaxed animate-fade-in delay-400">
          Only authorized foreman accounts can access this portal.<br/>
          <span className="text-blue-600 font-semibold">Contact superadmin for access.</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
