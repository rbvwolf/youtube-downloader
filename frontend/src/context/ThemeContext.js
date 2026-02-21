import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../utils/locales';

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
    // Hooks for detecting system theme changes
    const systemColorScheme = useColorScheme();

    // State
    const [themePref, setThemePref] = useState('system'); // 'system', 'light', 'dark'
    const [language, setLanguage] = useState('en');
    const [fontSize, setFontSize] = useState('medium');
    const [isReady, setIsReady] = useState(false);

    // Compute actual theme based on preference and system
    const isDarkMode = themePref === 'system' ? (systemColorScheme === 'dark') : (themePref === 'dark');

    // Load from memory
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('@settings_theme');
                if (savedTheme) setThemePref(savedTheme);

                const savedLang = await AsyncStorage.getItem('@settings_lang');
                if (savedLang) setLanguage(savedLang);

                const savedFont = await AsyncStorage.getItem('@settings_font');
                if (savedFont) setFontSize(savedFont);
            } catch (e) {
                console.error("Failed to load settings", e);
            } finally {
                setIsReady(true);
            }
        };
        loadSettings();
    }, []);

    const setAppTheme = async (mode) => {
        setThemePref(mode);
        try { await AsyncStorage.setItem('@settings_theme', mode); } catch (e) { }
    };

    const setAppLanguage = async (lang) => {
        setLanguage(lang);
        try { await AsyncStorage.setItem('@settings_lang', lang); } catch (e) { }
    };

    const setAppFontSize = async (size) => {
        setFontSize(size);
        try { await AsyncStorage.setItem('@settings_font', size); } catch (e) { }
    };

    const theme = {
        ...(isDarkMode ? darkTheme : lightTheme),
        themePref,
        fontSize,
        fontScale: fontScaleMap[fontSize]
    };

    const t = (key) => {
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    // Prevent flicker on boot
    if (!isReady) return null;

    return (
        <ThemeContext.Provider value={{
            theme,
            isDarkMode,
            themePref,
            setAppTheme,
            language,
            setAppLanguage,
            setFontSize: setAppFontSize,
            t
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
