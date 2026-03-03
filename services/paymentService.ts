
export const loadPaypalScript = async (): Promise<any> => {
  if (window.paypal) return window.paypal;

const getEnv = (key: string) => {
    // 1. Try Vite's import.meta.env (VITE_ prefix usually required for client exposure)
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
      if ((import.meta as any).env[viteKey]) return (import.meta as any).env[viteKey];
    }
    
    // 2. Try process.env (Node.js / Polyfilled environments)
    try {
      if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
      }
    } catch (e) {
      // Ignore ReferenceError if process is not defined
    }
    
    return undefined;
  };

  // Defaults to 'test' if env var is missing to prevent crash, but logs warning
  const clientId = getEnv('PAYPAL_CLIENT_ID');
  const finalClientId = clientId || 'test';

  if (!clientId) {
      console.warn("PAYPAL_CLIENT_ID not found in environment variables. Using 'test' mode.");
  }

  return new Promise((resolve, reject) => {
    if (document.getElementById('paypal-sdk-script')) {
        // Script already loading
        const interval = setInterval(() => {
            if (window.paypal) {
                clearInterval(interval);
                resolve(window.paypal);
            }
        }, 100);
        return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${finalClientId}&currency=USD`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};
