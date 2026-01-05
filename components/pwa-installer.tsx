'use client';

import { useEffect } from 'react';

export default function PWAInstaller() {
  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered successfully:', registration);
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });
    }

    // Handle PWA install prompt
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      
      // Show install button if needed
      showInstallPromotion();
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      hideInstallPromotion();
      
      // Track install event if analytics available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pwa_installed');
      }
    });

    function showInstallPromotion() {
      // Show custom install UI
      const installBanner = document.getElementById('pwa-install-banner');
      if (installBanner) {
        installBanner.style.display = 'block';
      }
    }

    function hideInstallPromotion() {
      const installBanner = document.getElementById('pwa-install-banner');
      if (installBanner) {
        installBanner.style.display = 'none';
      }
    }

    // Global install function
    (window as any).installPWA = () => {
      if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted the install prompt');
          } else {
            console.log('[PWA] User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      }
    };

  }, []);

  return null; // This component doesn't render anything
}

// PWA Utility Functions
export const PWAUtils = {
  // Check if app is installed
  isInstalled: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  },

  // Check if install is available
  isInstallAvailable: (): boolean => {
    return !PWAUtils.isInstalled() && 'serviceWorker' in navigator;
  },

  // Get install prompt
  getInstallPrompt: (): Promise<any> => {
    return new Promise((resolve) => {
      window.addEventListener('beforeinstallprompt', (e) => {
        resolve(e);
      });
    });
  },

  // Check if Bluetooth is supported
  isBluetoothSupported: (): boolean => {
    return 'bluetooth' in navigator;
  },

  // Check if we're in PWA mode
  isPWAMode: (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches;
  },

  // Show notification
  showNotification: async (title: string, options: NotificationOptions = {}) => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const notification = new Notification(title, {
          icon: '/icon-192.png',
          badge: '/icon-72.png',
          ...options
        });
        
        return notification;
      }
    }
    return null;
  },

  // Share data
  share: async (data: ShareData): Promise<boolean> => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('[PWA] Share failed:', error);
      }
    }
    return false;
  }
};