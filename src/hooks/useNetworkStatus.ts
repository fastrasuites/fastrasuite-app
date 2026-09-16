import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlow: boolean;
  lastChecked: Date;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlow: false,
    lastChecked: new Date(),
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        lastChecked: new Date(),
      }));
    };

    const updateConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const isSlow = connection?.effectiveType === 'slow-2g' ||
                      connection?.effectiveType === '2g' ||
                      connection?.downlink < 1;
        setNetworkStatus(prev => ({
          ...prev,
          isSlow,
          lastChecked: new Date(),
        }));
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes if supported
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateConnectionSpeed);
    }

    // Initial check
    updateConnectionSpeed();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateConnectionSpeed);
      }
    };
  }, []);

  return networkStatus;
}