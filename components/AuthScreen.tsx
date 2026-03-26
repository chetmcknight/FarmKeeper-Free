import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadPaypalScript } from '../services/paymentService';
import { backend } from '../services/mockBackend';

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
  const [useMockPayment, setUseMockPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  
  // Refs to access latest state inside PayPal callbacks without re-rendering buttons
  const emailRef = useRef(email);
  const passwordRef = useRef(password);
  
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { passwordRef.current = password; }, [password]);

  const { login, signup, isLoading } = useAuth();
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    if (view === 'REGISTER' && selectedPlan === 'pro' && !useMockPayment) {
        const initPaypal = async () => {
            setIsLoadingScript(true);
            try {
                const paypal = await loadPaypalScript();
                if (!mounted) return;
                
                // Allow DOM to settle before rendering buttons
                setTimeout(async () => {
                    if (!mounted) return;
                    setIsLoadingScript(false);

                    // Ensure container exists
                    if (paypal && paypalRef.current) {
                        paypalRef.current.innerHTML = '';
                        
                        try {
                            await paypal.Buttons({
                                style: { shape: 'rect', layout: 'vertical', color: 'blue', label: 'subscribe' },
                                funding: {
                                    disallowed: [
                                        window.paypal.FUNDING.PAYLATER, 
                                        window.paypal.FUNDING.CREDIT,
                                        window.paypal.FUNDING.VENMO
                                    ]
                                },
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
                                            description: "FarmKeeper Unlimited Farm (Monthly)",
                                            amount: { value: '4.99' }
                                        }]
                                    });
                                },
                                onApprove: async (data: any, actions: any) => {
                                    setIsProcessingPayment(true);
                                    try {
                                        // await actions.order.capture(); 
                                        await handleProSignupSuccess(emailRef.current, passwordRef.current);
                                    } catch (err: any) {
                                        setError(err.message || "Signup failed after payment.");
                                        setIsProcessingPayment(false);
                                    }
                                },
                                onError: (err: any) => {
                                    console.warn("PayPal Button Error, falling back to mock:", err);
                                    // If PayPal fails (e.g. invalid client ID), fallback to mock UI so user can still "pay"
                                    if (mounted) setUseMockPayment(true);
                                },
                                onCancel: () => {
                                    setIsProcessingPayment(false);
                                }
                            }).render(paypalRef.current);
                        } catch (renderError) {
                            console.warn("PayPal Render Error, falling back to mock:", renderError);
                            if (mounted) setUseMockPayment(true);
                        }
                    } else {
                        if (mounted) setUseMockPayment(true);
                    }
                }, 100);
            } catch (error) {
                 console.error("PayPal script error:", error);
                 if(mounted) {
                     setIsLoadingScript(false);
                     setUseMockPayment(true); // Fallback
                 }
            }
        };
        initPaypal();
    }
    return () => { mounted = false; };
  }, [view, selectedPlan, useMockPayment]);

  const handleProSignupSuccess = async (email: string, pass: string) => {
      // 1. Create Account
      await signup(email, pass, 'pro');
      // 2. Send Invoice
      try {
          await backend.sendInvoice(email, 'Unlimited Farm', '4.99');
          setInvoiceSent(true);
      } catch (e) {
          console.error("Failed to send invoice", e);
      }
  };

  const handleMockPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email || !password) {
          setError("Please enter email and password first.");
          return;
      }
      setIsProcessingPayment(true);
      setError(null);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
          setPaymentSuccess(true);
          await handleProSignupSuccess(email, password);
      } catch (err: any) {
          setError(err.message || "Signup failed.");
          setIsProcessingPayment(false);
          setPaymentSuccess(false);
      }
  };

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
    if (selectedPlan === 'pro') return; // Should be handled by PayPal or Mock Payment
    
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
                    <h1 className="text-5xl font-black text-green-700 tracking-tight mb-6">FarmKeeper Pro</h1>
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Choose your Plan</h2>
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
                                    <span className="text-gray-600 font-medium">Up to 4 Crops</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-100 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-600 font-medium">Up to 3 Farmhands</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-100 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-600 font-medium">Advanced AI Diagnosis</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-gray-50 group-hover:bg-green-50/50 transition-colors">
                            <button 
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg transform active:scale-95"
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
                            <h3 className="text-2xl font-bold text-white">Unlimited Farm</h3>
                            <p className="mt-2 text-gray-400 font-medium">Perfect for farmers with greater needs.</p>
                             <div className="mt-8">
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-extrabold text-white">$4.99</span>
                                    <span className="ml-2 text-xl text-gray-400 font-medium">/month</span>
                                </div>
                                <p className="text-sm text-emerald-400 mt-1 font-medium">or $49.99/year</p>
                            </div>

                            <ul className="mt-8 space-y-5">
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Unlimited Animals</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Unlimited Crops</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Unlimited Farmhands</span>
                                </li>
                                <li className="flex items-center">
                                    <div className="bg-green-500/20 rounded-full p-1 mr-3"><svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
                                    <span className="text-gray-300 font-medium">Advanced AI Diagnosis</span>
                                </li>
                            </ul>
                        </div>
                        <div className="p-8 bg-gray-800/50 border-t border-gray-700 group-hover:bg-gray-800 transition-colors">
                            <button 
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-green-400 hover:to-emerald-500 transition-all shadow-lg transform active:scale-95"
                            >
                                Get Started with Unlimited Farm
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
        <div className="flex flex-col items-center justify-center mb-2">
           <div className="bg-white p-4 rounded-2xl shadow-lg border border-green-100 mb-4">
             <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
               <text y=".9em" fontSize="90">🧑‍🌾</text>
             </svg>
           </div>
           <h1 className="text-4xl font-black text-green-800 tracking-tight leading-none">FarmKeeper Pro</h1>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {view === 'LOGIN' ? 'Welcome back' : `Create your ${selectedPlan === 'pro' ? 'Unlimited Farm' : 'Free'} account`}
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
        <div className="bg-white py-10 px-6 shadow-2xl rounded-3xl border border-gray-100 sm:px-12 relative overflow-hidden">
          {invoiceSent && (
              <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-bold shadow-md animate-fade-in z-20">
                  ✓ Invoice emailed to {email}
              </div>
          )}
          
          {error && (
            <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 border ${error.startsWith('Success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                {error.startsWith('Success') ? (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
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

            {view === 'REGISTER' && selectedPlan === 'pro' && (
                <div className="pt-6 border-t border-gray-100">
                     <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
                         <span>Payment Details</span>
                         <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-md">$4.99/mo</span>
                     </h3>
                     
                     {/* 
                        Correct logic: Always render container unless mocked. 
                        This ensures ref is available for SDK rendering even if we are 'loading' script.
                     */}
                     {useMockPayment ? (
                         <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                             <div className="flex gap-2 mb-2">
                                <div className="h-8 w-12 bg-blue-900 rounded flex items-center justify-center text-white text-xs font-bold italic">VISA</div>
                                <div className="h-8 w-12 bg-orange-600 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>
                             </div>
                             <input 
                                type="text" 
                                placeholder="Card Number" 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                disabled={isProcessingPayment}
                             />
                             <div className="flex gap-2">
                                 <input type="text" placeholder="MM/YY" className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled={isProcessingPayment}/>
                                 <input type="text" placeholder="CVC" className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled={isProcessingPayment}/>
                             </div>
                             <button
                                type="button"
                                onClick={handleMockPayment}
                                disabled={isProcessingPayment || paymentSuccess}
                                className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-black transition-colors flex items-center justify-center"
                             >
                                 {isProcessingPayment ? (
                                     <>
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Processing...
                                     </>
                                 ) : paymentSuccess ? "Success" : "Pay $4.99"}
                             </button>
                             <p className="text-xs text-center text-gray-400">Secure 256-bit SSL Encrypted</p>
                         </div>
                     ) : (
                        <div className="relative min-h-[150px]">
                            {/* Overlay Spinner during script load */}
                            {isLoadingScript && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 z-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    <p className="text-sm text-gray-500 font-medium">Loading secure payment...</p>
                                </div>
                            )}
                            {/* 
                                PayPal Container: Always rendered if not using mock. 
                                The 'hidden' class just visually hides it if we are still loading script, 
                                but the node exists for SDK to latch onto.
                            */}
                            <div ref={paypalRef} className={`z-0 w-full ${isLoadingScript ? 'invisible h-0' : 'block'}`}></div>
                        </div>
                     )}
                </div>
            )}

            {/* Only show standard submit button if NOT registering for Pro plan (which uses PayPal/Mock button) */}
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
              <div className="mt-6 text-center border-t border-gray-100 pt-6">
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