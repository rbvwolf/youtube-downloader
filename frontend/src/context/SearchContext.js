import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from './ThemeContext';

const RECENT_SEARCHES_KEY = '@recent_searches';
const DEFAULT_CHIPS = ['music', 'podcasts', 'news'];

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
    const { t } = useTheme();
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
        loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
        try {
            const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
            if (saved !== null) {
                setRecentSearches(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load recent searches', e);
        }
    };

    const saveRecentSearch = async (query) => {
        if (!query.trim()) return;
        try {
            const lowerQuery = query.toLowerCase().trim();
            const translatedChips = [t('music').toLowerCase(), t('podcasts').toLowerCase(), t('news').toLowerCase()];

            // Don't save default chips to history
            if (translatedChips.includes(lowerQuery) || DEFAULT_CHIPS.includes(lowerQuery)) return;

            const filtered = recentSearches.filter(q => q.toLowerCase().trim() !== lowerQuery);
            const updated = [query.trim(), ...filtered].slice(0, 10);

            setRecentSearches(updated);
            await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recent search', e);
        }
    };

    const clearRecentSearches = async () => {
        try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
            setRecentSearches([]);
        } catch (e) {
            console.error('Failed to clear recent searches', e);
        }
    };

    return (
        <SearchContext.Provider value={{ recentSearches, saveRecentSearch, clearRecentSearches, loadRecentSearches }}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearchHistory = () => useContext(SearchContext);
