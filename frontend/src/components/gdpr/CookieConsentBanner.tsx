/**
 * Cookie Consent Banner Component
 *
 * GDPR/PECR compliant cookie consent banner
 * - Shows at bottom of screen when no consent exists
 * - Allows accepting all, rejecting non-essential, or customizing
 * - Persists preferences to backend API
 */

import { useState, useEffect } from 'react';
import { gdprApi, type CookiePreferences } from '../../api/gdpr';
import { CookiePreferenceCenter } from './CookiePreferenceCenter';

const COOKIE_VERSION = '1.0.0';

export const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreferenceCenter, setShowPreferenceCenter] = useState(false);

  // Check if consent already exists
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const response = await gdprApi.getCookieConsent();
        if (response.success && response.data) {
          // Consent exists, don't show banner
          setVisible(false);
        } else {
          // No consent, show banner
          setVisible(true);
        }
      } catch (error) {
        // On error, show banner (safe default)
        setVisible(true);
      } finally {
        setLoading(false);
      }
    };

    checkConsent();
  }, []);

  const saveConsent = async (preferences: CookiePreferences) => {
    try {
      await gdprApi.saveCookieConsent({
        ...preferences,
        version: COOKIE_VERSION,
      });
      setVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      // Keep banner visible on error
    }
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  };

  const handleCustomize = () => {
    setShowPreferenceCenter(true);
  };

  const handlePreferenceSaved = () => {
    setShowPreferenceCenter(false);
    setVisible(false);
  };

  if (loading || !visible) {
    return null;
  }

  return (
    <>
      <CookiePreferenceCenter
        isOpen={showPreferenceCenter}
        onClose={() => setShowPreferenceCenter(false)}
        onSave={handlePreferenceSaved}
      />
      <div
        role="banner"
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
      >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. By clicking "Accept
              All", you consent to our use of cookies.{' '}
              <a
                href="/cookie-policy"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Learn more
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <button
              onClick={handleCustomize}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Customize
            </button>
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
