import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

const computeIsDark = (currentTheme) => {
  if (currentTheme === 'dark') return true;
  if (currentTheme === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

// Applies theme to DOM instantly without animation jank
const applyThemeToDOM = (dark) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Temporarily disable transitions during theme flip to guarantee 120 FPS
  root.classList.add('disable-transitions');

  if (dark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  // Re-enable interactive transitions on next frame
  window.requestAnimationFrame(() => {
    root.classList.remove('disable-transitions');
  });
};

export function ThemeProvider({ children }) {
  // Theme: 'light' | 'dark' | 'system'
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('medflow-theme') || 'system';
  });

  // Effective dark mode boolean — computed synchronously
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('medflow-theme') || 'system';
    return computeIsDark(saved);
  });

  // Layout density: 'comfortable' | 'compact'
  const [density, setDensityState] = useState(() => {
    return localStorage.getItem('medflow-density') || 'comfortable';
  });

  // Notification audio / alerts toggle
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    return localStorage.getItem('medflow-sound') !== 'false';
  });

  // High contrast mode for accessibility
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('medflow-contrast') === 'true';
  });

  // Fast theme setter: writes to DOM synchronously
  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('medflow-theme', newTheme);
    const dark = computeIsDark(newTheme);
    setIsDark(dark);
    applyThemeToDOM(dark);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
  }, [isDark, setTheme]);

  // Synchronize OS theme changes when in 'system' mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleOSChange = () => {
      if (theme === 'system') {
        const dark = mediaQuery.matches;
        setIsDark(dark);
        applyThemeToDOM(dark);
      }
    };

    mediaQuery.addEventListener('change', handleOSChange);
    return () => mediaQuery.removeEventListener('change', handleOSChange);
  }, [theme]);

  // Apply Density effect
  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') {
      root.classList.add('density-compact');
    } else {
      root.classList.remove('density-compact');
    }
  }, [density]);

  // Apply High Contrast effect
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const setDensity = (newDensity) => {
    setDensityState(newDensity);
    localStorage.setItem('medflow-density', newDensity);
  };

  const setSoundEnabled = (enabled) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('medflow-sound', String(enabled));
  };

  const setHighContrast = (enabled) => {
    setHighContrastState(enabled);
    localStorage.setItem('medflow-contrast', String(enabled));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
        density,
        setDensity,
        soundEnabled,
        setSoundEnabled,
        highContrast,
        setHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
