import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

const lightTheme = {
    isDark: false,
    background: '#f8f6f6',
    contentBackground: '#f8f6f6',
    card: '#ffffff',
    text: '#0f172a',
    subText: '#64748b',
    border: '#f1f5f9',
    primary: '#ea2a33',
    primaryBg: '#fee2e2',
    iconInactive: '#94a3b8',
    danger: '#dc2626',
    dangerBg: '#fee2e2',
    headerBackground: '#f8f6f6',
    searchBackground: '#ffffff',
    chipInactiveBg: '#e2e8f0',
    chipInactiveText: '#0f172a',
    segmentedControlBg: '#f1f5f9',
};

const darkTheme = {
    isDark: true,
    background: '#0f172a',
    contentBackground: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    subText: '#94a3b8',
    border: '#334155',
    primary: '#ef4444',
    primaryBg: '#451a1e', // Dark red-ish background
    iconInactive: '#64748b',
    danger: '#f87171',
    dangerBg: '#451a1e',
    headerBackground: '#0f172a',
    searchBackground: '#1e293b',
    chipInactiveBg: '#334155',
    chipInactiveText: '#f8fafc',
    segmentedControlBg: '#0f172a',
};

const ThemeContext = createContext();

const fontScaleMap = {
    small: 0.85,
    medium: 1,
    large: 1.15
};

export const ThemeProvider = ({ children }) => {
    // Check system preference initially
    const colorScheme = Appearance.getColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
    const [fontSize, setFontSize] = useState('medium');

    const theme = {
        ...(isDarkMode ? darkTheme : lightTheme),
        fontSize,
        fontScale: fontScaleMap[fontSize]
    };

    const toggleTheme = (val) => {
        setIsDarkMode(val !== undefined ? val : !isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
