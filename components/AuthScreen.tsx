import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

type ViewState = 'LOGIN' | 'REGISTER';

export const AuthScreen: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
        await login(email, password);
    } catch (err: any) {
        setError(err.message || "Login failed.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
        await signup(email, password);
    } catch (err: any) {
        setError(err.message || "Signup failed.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center mb-2">
           <div className="bg-white p-4 rounded-2xl shadow-lg border border-green-100 mb-4">
             <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
               <text y=".9em" fontSize="90">🧑‍🌾</text>
             </svg>
           </div>
            <h1 className="text-4xl font-black text-green-800 tracking-tight leading-none">FarmKeeper Free</h1>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {view === 'LOGIN' ? 'Welcome back' : 'Create your free account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl rounded-3xl border border-gray-100 sm:px-12 relative overflow-hidden">
          
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border bg-red-50 border-red-200 text-red-600">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="leading-tight">{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={view === 'LOGIN' ? handleLogin : handleRegister}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 bg-gray-50 text-gray-900 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : null}
                {view === 'LOGIN' ? 'Sign In' : 'Create Free Account'}
              </button>
            </div>
          </form>
          
          {view === 'LOGIN' ? (
            <div className="mt-6 text-center border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button onClick={() => { setView('REGISTER'); setError(null); }} className="font-bold text-green-600 hover:text-green-500 transition-colors">
                        Get Started
                    </button>
                </p>
            </div>
          ) : (
            <div className="mt-6 text-center border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button onClick={() => { setView('LOGIN'); setError(null); }} className="font-bold text-green-600 hover:text-green-500 transition-colors">
                        Sign In
                    </button>
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
