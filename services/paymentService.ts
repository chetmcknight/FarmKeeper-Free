
export const loadPaypalScript = async (): Promise<any> => {
  if (window.paypal) return window.paypal;

  const getEnv = (key: string) => {
    try { return process.env[key]; } catch (e) { return undefined; }
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
