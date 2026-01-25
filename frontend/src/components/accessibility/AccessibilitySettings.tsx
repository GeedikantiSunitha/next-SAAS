import React, { useState, useEffect } from 'react';

interface AccessibilitySettingsState {
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export const AccessibilitySettings: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettingsState>({
    highContrast: false,
    reduceMotion: false,
    fontSize: 'medium'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      applySettings(parsed);
    }
  }, []);

  // Apply settings to document
  const applySettings = (newSettings: AccessibilitySettingsState) => {
    const root = document.documentElement;

    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (newSettings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.fontSize = fontSizeMap[newSettings.fontSize];
  };

  // Save settings and apply them
  const updateSettings = (updates: Partial<AccessibilitySettingsState>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    applySettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
  };

  const toggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast });
  };

  const toggleReduceMotion = () => {
    updateSettings({ reduceMotion: !settings.reduceMotion });
  };

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(settings.fontSize);
    let newIndex = currentIndex;

    if (direction === 'increase' && currentIndex < sizes.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'decrease' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    updateSettings({ fontSize: sizes[newIndex] });
  };

  return (
    <div className="accessibility-settings p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Accessibility Settings</h2>

      <div className="space-y-6">
        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="text-lg font-medium">
            High Contrast Mode
            <p className="text-sm text-gray-600 mt-1">
              Increases color contrast for better visibility
            </p>
          </label>
          <button
            id="high-contrast"
            role="switch"
            aria-checked={settings.highContrast}
            onClick={toggleHighContrast}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full
              ${settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'}
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
          >
            <span className="sr-only">Enable high contrast mode</span>
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white
                transition-transform ${settings.highContrast ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between">
          <label htmlFor="reduce-motion" className="text-lg font-medium">
            Reduce Motion
            <p className="text-sm text-gray-600 mt-1">
              Minimizes animations and transitions
            </p>
          </label>
          <button
            id="reduce-motion"
            role="switch"
            aria-checked={settings.reduceMotion}
            onClick={toggleReduceMotion}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full
              ${settings.reduceMotion ? 'bg-blue-600' : 'bg-gray-200'}
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
          >
            <span className="sr-only">Enable reduced motion</span>
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white
                transition-transform ${settings.reduceMotion ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Font Size */}
        <div>
          <label htmlFor="font-size" className="text-lg font-medium block mb-3">
            Font Size
            <p className="text-sm text-gray-600 mt-1">
              Adjust text size for better readability
            </p>
          </label>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => adjustFontSize('decrease')}
              disabled={settings.fontSize === 'small'}
              aria-label="Decrease font size"
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              A-
            </button>
            <span className="text-lg font-medium px-4">
              {settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)}
            </span>
            <button
              onClick={() => adjustFontSize('increase')}
              disabled={settings.fontSize === 'large'}
              aria-label="Increase font size"
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              A+
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Skip to main content:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Alt + S</kbd>
            </div>
            <div className="flex justify-between">
              <span>Toggle high contrast:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Alt + C</kbd>
            </div>
            <div className="flex justify-between">
              <span>Toggle reduced motion:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Alt + M</kbd>
            </div>
            <div className="flex justify-between">
              <span>Increase font size:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + +</kbd>
            </div>
            <div className="flex justify-between">
              <span>Decrease font size:</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + -</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};