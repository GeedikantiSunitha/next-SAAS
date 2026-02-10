/**
 * Cookie Preference Center Component
 *
 * Modal dialog for customizing cookie preferences
 * - Display individual toggles for each cookie category
 * - Essential cookies always enabled (non-toggleable)
 * - Load current preferences from backend
 * - Save preferences to backend API
 * - Keyboard accessible (ESC to close)
 */

import { useState, useEffect, useRef } from 'react';
import { gdprApi, type CookiePreferences } from '../../api/gdpr';

const COOKIE_VERSION = '1.0.0';
const STORAGE_KEY = 'cookie_consent';

const setStoredConsent = (preferences: CookiePreferences) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...preferences, version: COOKIE_VERSION }));
  } catch {
    // ignore
  }
};

interface CookiePreferenceCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CookiePreferenceCenter = ({ isOpen, onClose, onSave }: CookiePreferenceCenterProps) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Load existing preferences
  useEffect(() => {
    if (!isOpen) return;

    const loadPreferences = async () => {
      try {
        setLoading(true);
        const response = await gdprApi.getCookieConsent();
        if (response.success && response.data) {
          setPreferences(response.data);
        } else {
          // Default to all false except essential
          setPreferences({
            essential: true,
            analytics: false,
            marketing: false,
            functional: false,
          });
        }
      } catch (error) {
        console.error('Failed to load cookie preferences:', error);
        // Use defaults on error
        setPreferences({
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Focus first interactive element
      const firstButton = dialogRef.current.querySelector('button, input');
      if (firstButton instanceof HTMLElement) {
        firstButton.focus();
      }
    }
  }, [isOpen, loading]);

  const handleToggle = (category: keyof CookiePreferences) => {
    if (category === 'essential') return; // Can't toggle essential
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await gdprApi.saveCookieConsent({
        ...preferences,
        version: COOKIE_VERSION,
      });
      setStoredConsent(preferences);
      onSave();
    } catch {
      setError('Failed to save preferences. Please try again.');
      // Do not call onSave() when API fails so parent knows save did not succeed
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preference-title"
          className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 transform transition-all"
        >
          {/* Header */}
          <div className="mb-6">
            <h2 id="cookie-preference-title" className="text-2xl font-bold text-gray-900">
              Cookie Preferences
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-600">Loading preferences...</div>
          ) : (
            <>
              {/* Cookie Categories */}
              <div className="space-y-6 mb-6">
                {/* Essential Cookies */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={preferences.essential}
                      disabled={true}
                      aria-label="Essential cookies (always enabled)"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label className="font-medium text-gray-900">Essential Cookies</label>
                    <p className="text-sm text-gray-600">
                      These cookies are required for the website to function properly. They cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => handleToggle('analytics')}
                      aria-label="Analytics cookies"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label className="font-medium text-gray-900">Analytics Cookies</label>
                    <p className="text-sm text-gray-600">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                    </p>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handleToggle('marketing')}
                      aria-label="Marketing cookies"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label className="font-medium text-gray-900">Marketing Cookies</label>
                    <p className="text-sm text-gray-600">
                      These cookies are used to deliver personalized advertisements that are relevant to you and your interests.
                    </p>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={() => handleToggle('functional')}
                      aria-label="Functional cookies"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </div>
                  <div className="ml-3 flex-1">
                    <label className="font-medium text-gray-900">Functional Cookies</label>
                    <p className="text-sm text-gray-600">
                      These cookies enable enhanced functionality and personalization, such as remembering your preferences.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
