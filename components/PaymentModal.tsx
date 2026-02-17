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
            setLoadingScript(false);

            if (paypal && paypalRef.current && !success) {
                paypalRef.current.innerHTML = '';
                paypal.Buttons({
                    style: { shape: 'rect', layout: 'vertical', color: 'blue' },
                    createOrder: (data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [{
                                description: `FarmKeeper Pro Upgrade - ${billingCycle}`,
                                amount: { value: price }
                            }]
                        });
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
                    }
                }).render(paypalRef.current);
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          {success ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4 animate-bounce">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl leading-6 font-bold text-gray-900">Payment Successful!</h3>
              <p className="mt-2 text-sm text-gray-500">Welcome to FarmKeeper Pro.</p>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-700">{orderId}</p>
              </div>

              <div className="mt-6">
                  <button 
                    onClick={onClose}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm"
                  >
                    Continue to Dashboard
                  </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upgrade to Pro</h3>
                <p className="text-sm text-gray-500 mt-1">Unlock advanced AI analysis and unlimited history.</p>
              </div>

              {/* Billing Toggle */}
              <div className="flex justify-center mb-6">
                <div className="relative bg-gray-100 p-1 rounded-lg flex">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    disabled={processing}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      billingCycle === 'monthly' 
                        ? 'bg-white text-green-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Monthly ($9.99)
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    disabled={processing}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1 ${
                      billingCycle === 'yearly' 
                        ? 'bg-white text-green-700 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Yearly ($99.99)
                    <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded-full">Save 16%</span>
                  </button>
                </div>
              </div>

              {processing || loadingScript ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                      <p className="text-sm text-gray-500">{loadingScript ? 'Loading secure payment...' : 'Processing payment...'}</p>
                  </div>
              ) : (
                  <div className="mt-4 min-h-[150px]">
                     <div ref={paypalRef}></div>
                  </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={onClose}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};