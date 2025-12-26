import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/api/entities';

const ThemeContext = createContext({
    theme: 'auto',
    resolvedTheme: 'light',
    setTheme: () => {},
});

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
};

const applyTheme = (theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    root.classList.remove('light', 'dark');
    
    // Apply new theme
    if (theme === 'dark') {
        body.classList.add('theme-dark');
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
    } else {
        body.classList.add('theme-light');
        root.classList.add('light');
        root.style.colorScheme = 'light';
    }
};

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('auto');
    const [resolvedTheme, setResolvedTheme] = useState('light');
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize theme from user preferences
    useEffect(() => {
        const initializeTheme = async () => {
            try {
                const user = await User.me();
                console.log('[ThemeProvider] Loaded user from database:', { 
                    id: user?.id, 
                    email: user?.email,
                    theme_preference: user?.theme_preference,
                    theme_preference_type: typeof user?.theme_preference 
                });
                // Use nullish coalescing (??) instead of || to properly handle empty strings and null/undefined
                const userTheme = user?.theme_preference ?? 'auto';
                console.log('[ThemeProvider] Resolved userTheme after nullish coalescing:', userTheme);
                setThemeState(userTheme);
                
                const resolved = userTheme === 'auto' ? getSystemTheme() : userTheme;
                console.log('[ThemeProvider] Final resolved theme:', resolved);
                setResolvedTheme(resolved);
                applyTheme(resolved);
            } catch (error) {
                console.error('[ThemeProvider] Error initializing theme:', error);
                // User not logged in, use system preference
                const systemTheme = getSystemTheme();
                setThemeState('auto');
                setResolvedTheme(systemTheme);
                applyTheme(systemTheme);
            }
            setIsInitialized(true);
        };

        initializeTheme();
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        if (!isInitialized) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'auto') {
                const newResolvedTheme = getSystemTheme();
                setResolvedTheme(newResolvedTheme);
                applyTheme(newResolvedTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, isInitialized]);

    const setTheme = async (newTheme) => {
        console.log('[ThemeProvider] setTheme called with:', newTheme);
        setThemeState(newTheme);
        
        // Save to user preferences
        try {
            console.log('[ThemeProvider] Saving theme preference to database:', newTheme);
            const updatedUser = await User.updateMyUserData({ theme_preference: newTheme });
            console.log('[ThemeProvider] Theme preference saved successfully. Updated user:', {
                id: updatedUser?.id,
                theme_preference: updatedUser?.theme_preference,
                theme_preference_type: typeof updatedUser?.theme_preference
            });
        } catch (error) {
            console.error('[ThemeProvider] Error saving theme preference:', error);
            console.warn('Could not save theme preference:', error);
        }

        // Apply theme immediately
        const resolved = newTheme === 'auto' ? getSystemTheme() : newTheme;
        console.log('[ThemeProvider] Applying resolved theme immediately:', resolved);
        setResolvedTheme(resolved);
        applyTheme(resolved);
    };

    const value = {
        theme,
        resolvedTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}