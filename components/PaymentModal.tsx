import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadPaypalScript } from '../services/paymentService';

declare global {
    interface Window {
        paypal: any;
    }
}

interface PaymentModalProps {
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const { upgradeToPro } = useAuth();
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [loadingScript, setLoadingScript] = useState(true);
  const [orderId, setOrderId] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const paypalRef = useRef<HTMLDivElement>(null);

  const price = billingCycle === 'monthly' ? '9.99' : '99.99';

  useEffect(() => {
    let mounted = true;
    
    const initPaypal = async () => {
        try {
            const paypal = await loadPaypalScript();
            if (!mounted) return;
            
            // Keep loadingScript true until we confirm we can render
            if (paypal && paypalRef.current && !success) {
                // Clear any existing buttons
                paypalRef.current.innerHTML = '';
                
                await paypal.Buttons({
                    style: { shape: 'rect', layout: 'vertical', color: 'blue', label: 'pay' },
                    funding: {
                        disallowed: [window.paypal.FUNDING.PAYLATER, window.paypal.FUNDING.CREDIT]
                    },
                    createOrder: (data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [{
                                description: `FarmKeeper Pro Upgrade - ${billingCycle}`,
                                amount: { value: price }
                            }]
                        });
                    },
                    onInit: () => {
                        // The buttons are initialized, safe to hide spinner
                        if(mounted) setLoadingScript(false);
                    },
                    onApprove: async (data: any, actions: any) => {
                        setProcessing(true);
                        try {
                            // await actions.order.capture(); // Mock capture for frontend-only
                            await upgradeToPro();
                            setOrderId(data.orderID || "TEST-ORDER-123");
                            setSuccess(true);
                        } catch (e) {
                            console.error(e);
                            alert("Payment processing failed.");
                        } finally {
                            if(mounted) setProcessing(false);
                        }
                    },
                    onError: (err: any) => {
                        console.error("PayPal Error:", err);
                        alert("Payment failed. Please try again.");
                        if(mounted) setLoadingScript(false);
                    }
                }).render(paypalRef.current);
            } else {
               if(mounted) setLoadingScript(false); 
            }
        } catch (error) {
            console.error("Failed to load PayPal", error);
            if(mounted) setLoadingScript(false);
        }
    };

    initPaypal();

    return () => { mounted = false; };
  }, [billingCycle, price, upgradeToPro, success]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        
        {/* Background Overlay */}
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true"></div>

        {/* Modal Container */}
        <div className="bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:max-w-md w-full relative flex flex-col max-h-[90vh] overflow-hidden">
          
          <button 
             onClick={onClose}
             className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/40 rounded-full p-1"
          >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {success ? (
            <div className="p-8 text-center bg-white overflow-y-auto">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6 animate-bounce">
                <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">You're a Pro!</h3>
              <p className="text-gray-500 mb-6">Thank you for upgrading. Your account now has access to all premium features.</p>
              
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8">
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Transaction Reference</p>
                  <p className="font-mono text-sm text-gray-800 break-all">{orderId}</p>
              </div>

              <button 
                onClick={onClose}
                className="w-full rounded-xl shadow-lg shadow-green-200 px-6 py-3.5 bg-green-600 text-base font-bold text-white hover:bg-green-700 focus:outline-none transition-all transform hover:-translate-y-1"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              {/* Header - Fixed */}
              <div className="bg-gray-900 p-6 text-center relative shrink-0">
                   <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-transparent"></div>
                   <div className="relative z-10">
                        <div className="inline-block p-2 rounded-full bg-gray-800 mb-2 shadow-xl">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white">Upgrade to Pro</h3>
                        <p className="text-gray-400 mt-1 text-xs sm:text-sm">Unlock full potential with AI tools.</p>
                   </div>
              </div>

              {/* Body - Scrollable */}
              <div className="p-6 overflow-y-auto">
                {/* Billing Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-xl inline-flex w-full">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        disabled={processing}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                        billingCycle === 'monthly' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        disabled={processing}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        billingCycle === 'yearly' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Yearly
                        <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide">Save 16%</span>
                    </button>
                    </div>
                </div>

                <div className="flex items-baseline justify-center mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">${price}</span>
                    <span className="text-gray-500 ml-1 font-medium">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                    <li className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Unlimited Crop & Livestock entries
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Advanced AI Disease Diagnosis
                    </li>
                    <li className="flex items-center text-sm text-gray-600">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Export Data & Full History
                    </li>
                </ul>

                {processing || loadingScript ? (
                    <div className="py-6 flex flex-col items-center justify-center space-y-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="text-sm text-gray-500 font-medium">{loadingScript ? 'Loading payment system...' : 'Processing secure payment...'}</p>
                    </div>
                ) : null}
                
                {/* PayPal Container */}
                <div 
                    ref={paypalRef} 
                    className={`relative min-h-[150px] z-0 ${processing || loadingScript ? 'hidden' : 'block'}`}
                ></div>
                
                <p className="text-xs text-center text-gray-400 mt-4 pb-2">
                    Secure payment processed by PayPal. Cancel anytime.
                </p>
              </div>
            </>
          )}
        </div>
    </div>
  );
};