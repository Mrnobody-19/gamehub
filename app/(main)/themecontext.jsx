import React, { createContext, useState, useContext } from 'react';

// Define light and dark themes
const lightTheme = {
    background: '#FFFFFF',
    text: '#000000',
    card: '#F5F5F5',
    border: '#E0E0E0',
};

const darkTheme = {
    background: '#193940',
    text: '#FFFFFF',
    card: '#1F1F1F',
    border: '#333333',
};

// Create the ThemeContext
const ThemeContext = createContext();

// Create a custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Function to toggle between light and dark mode
    const toggleTheme = () => {
        setIsDarkMode((prevMode) => !prevMode);
    };

    // Provide the current theme and toggle function
    const value = {
        theme: isDarkMode ? darkTheme : lightTheme,
        isDarkMode,
        toggleTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
