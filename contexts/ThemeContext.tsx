import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeType } from './Colors';

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: typeof Colors.dark;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(deviceTheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    setTheme(deviceTheme === 'dark' ? 'dark' : 'light');
  }, [deviceTheme]);

  const colors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};