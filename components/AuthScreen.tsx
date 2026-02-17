import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadPaypalScript } from '../services/paymentService';

type ViewState = 'LOGIN' | 'PLAN_SELECTION' | 'REGISTER';

declare global {
    interface Window {
        paypal: any;
    }
}

export const AuthScreen: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro'>('free');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  
  // Refs to access latest state inside PayPal callbacks without re-rendering buttons
  const emailRef = useRef(email);
  const passwordRef = useRef(password);
  
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { passwordRef.current = password; }, [password]);

  const { login, signup, isLoading } = useAuth();
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    if (view === 'REGISTER' && selectedPlan === 'pro') {
        const initPaypal = async () => {
            setIsLoadingScript(true);
            try {
                const paypal = await loadPaypalScript();
                if (!mounted) return;
                setIsLoadingScript(false);

                if (paypal && paypalRef.current) {
                    paypalRef.current.innerHTML = '';
                    
                    paypal.Buttons({
                        style: { shape: 'rect', layout: 'vertical', color: 'blue', label: 'subscribe' },
                        createOrder: (data: any, actions: any) => {
                            const currentEmail = emailRef.current;
                            const currentPass = passwordRef.current;

                            if (!currentEmail || !currentPass) {
                                setError("Please enter your email and password before proceeding with payment.");
                                return actions.reject();
                            }
                            setError(null);
                            
                            return actions.order.create({
                                purchase_units: [{
                                    description: "FarmKeeper Commercial Plan (Monthly)",
                                    amount: { value: '9.99' }
                                }]
                            });
                        },
                        onApprove: async (data: any, actions: any) => {
                            setIsProcessingPayment(true);
                            try {
                                // await actions.order.capture(); 
                                await signup(emailRef.current, passwordRef.current, 'pro');
                            } catch (err: any) {
                                setError(err.message || "Signup failed after payment.");
                                setIsProcessingPayment(false);
                            }
                        },
                        onError: (err: any) => {
                            console.error("PayPal Error:", err);
                            if (!emailRef.current || !passwordRef.current) return;
                            setError("Payment initialization failed. Please try again.");
                            setIsProcessingPayment(false);
                        },
                        onCancel: () => {
                            setIsProcessingPayment(false);
                        }
                    }).render(paypalRef.current);
                }
            } catch (error) {
                 console.error("PayPal script error:", error);
                 if(mounted) {
                     setIsLoadingScript(false);
                     setError("Failed to load payment system.");
                 }
            }
        };
        initPaypal();
    }
    return () => { mounted = false; };
  }, [view, selectedPlan, signup]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
        await login(email, password);
    } catch (err: any) {
        setError(err.message || "Login failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Standard registration for Free plan
    if (selectedPlan === 'pro') return; // Should be handled by PayPal
    
    try {
        await signup(email, password, 'free');
    } catch (err: any) {
        setError(err.message || "Signup failed.");
    }
  };

  // 1. Plan Selection View
  if (view === 'PLAN_SELECTION') {
      return (
        <div className="min-h-screen bg-[#f0fdf4] py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center animate-fade-in">
            <div className="max-w-5xl w-full space-y-12">
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Choose your FarmKeeper Plan</h2>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">Select the best tools for your agricultural needs. Scale as you grow.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mt-8">
                    {/* Free Plan */}
                    <div 
                        onClick={() => { setSelectedPlan('free'); setView('REGISTER'); }}
                        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform md:-translate-y-4 flex flex-col relative hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                        <div className="p-10 flex-1">
                            <h3 className="text-2xl font-bold text-gray-900">Hobby Farm</h3>
                            <p className="mt-2 text-gray-500 font-medium">Perfect for small plots and backyard farmers.</p>
                            <div className="mt-8 flex items-baseline">
                                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                                <span className="ml-2 text-xl text-gray-500 font-medium">/forever</span>
                            </div>

                            <ul className="mt-8 space-y-5">
                                <li className="flex items-center">
                                    <div className="bg-green-100 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-600 font-medium">Up to 6 Animals</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-100 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-600 font-medium">Basic Crop Tracking</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-100 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-600 font-medium">Limited History (5 records)</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-gray-50 group-hover:bg-green-50/50 transition-colors">
                            <button 
                                className="w-full bg-white border-2 border-green-600 text-green-700 font-bold py-4 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm"
                            >
                                Select Free Plan
                            </button>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div 
                        onClick={() => { setSelectedPlan('pro'); setView('REGISTER'); }}
                        className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 overflow-hidden transform md:-translate-y-4 flex flex-col relative hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-all cursor-pointer group"
                    >
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-lg">MOST POPULAR</div>
                        <div className="p-10 flex-1">
                            <h3 className="text-2xl font-bold text-white">Commercial Farm</h3>
                            <p className="mt-2 text-gray-400 font-medium">Advanced tools for serious producers.</p>
                             <div className="mt-8">
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-extrabold text-white">$9.99</span>
                                    <span className="ml-2 text-xl text-gray-400 font-medium">/month</span>
                                </div>
                                <p className="text-sm text-emerald-400 mt-1 font-medium">or $99.99/year</p>
                            </div>

                            <ul className="mt-8 space-y-5">
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Unlimited Animals & Crops</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Advanced AI Disease Diagnosis</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Market Prices & Forecasting</span>
                                </li>
                                 <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Unlimited History & Export</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-gray-800/50 border-t border-gray-700 group-hover:bg-gray-800 transition-colors">
                            <button 
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg transform active:scale-95"
                            >
                                Get Started with Pro
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                     <button onClick={() => setView('LOGIN')} className="text-base text-green-700 font-bold hover:underline transition-all">
                         Already have an account? Sign in &rarr;
                     </button>
                </div>
            </div>
        </div>
      );
  }

  // 2. Register / Login View
  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
           <div className="bg-white p-4 rounded-2xl shadow-lg border border-green-100">
             <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
               <text y=".9em" fontSize="90">🚜</text>
             </svg>
           </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {view === 'LOGIN' ? 'Welcome back' : `Create your ${selectedPlan === 'pro' ? 'Pro' : 'Free'} account`}
        </h2>
        {view === 'REGISTER' && (
             <p className="mt-3 text-center text-sm text-gray-500">
                 <button onClick={() => setView('PLAN_SELECTION')} className="text-green-600 font-semibold hover:text-green-500 transition-colors">
                     &larr; Change Plan
                 </button>
             </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl rounded-3xl border border-gray-100 sm:px-12">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
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

            {view === 'REGISTER' && selectedPlan === 'pro' && (
                <div className="pt-6 border-t border-gray-100">
                     <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                         <span>Payment Details</span>
                         <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">$9.99/mo</span>
                     </h3>
                     {isProcessingPayment || isLoadingScript ? (
                         <div className="py-8 flex flex-col items-center justify-center space-y-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                             <p className="text-sm text-gray-500 font-medium">
                                 {isLoadingScript ? "Loading secure payment..." : "Securely processing..."}
                             </p>
                         </div>
                     ) : (
                        <div ref={paypalRef} className="z-0 w-full min-h-[150px]"></div>
                     )}
                </div>
            )}

            {/* Only show standard submit button if NOT registering for Pro plan (which uses PayPal button) */}
            {!(view === 'REGISTER' && selectedPlan === 'pro') && (
                <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : null}
                    {view === 'LOGIN' ? 'Sign In' : 'Create Free Account'}
                </button>
                </div>
            )}
          </form>
          
          {view === 'LOGIN' && (
              <div className="mt-8 text-center border-t border-gray-100 pt-6">
                  <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <button onClick={() => setView('PLAN_SELECTION')} className="font-bold text-green-600 hover:text-green-500 transition-colors">
                          Get Started
                      </button>
                  </p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};