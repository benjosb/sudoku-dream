export const COLORS = {
  light: {
    name: 'light',
    background: '#ffffff',
    text: '#000000',
    gridLine: '#333333',
    cellBackground: '#ffffff',
    cellSelected: '#e3f2fd',
    sameNumber: '#bbdefb',
    givenText: '#000000',
    userText: '#1976d2',
    pencilText: '#757575',
    error: '#ffcdd2',
    errorText: '#d32f2f',
    buttonBg: '#f0f0f0',
    previewColor: '#ffffff' // Voor het bolletje
  },
  dark: {
    name: 'dark',
    background: '#121212',
    text: '#ffffff',
    gridLine: '#555555',
    cellBackground: '#1e1e1e',
    cellSelected: '#333333',
    sameNumber: '#444444',
    givenText: '#ffffff',
    userText: '#90caf9',
    pencilText: '#aaaaaa',
    error: '#cf6679',
    errorText: '#000000',
    buttonBg: '#333333',
    previewColor: '#121212'
  },
  ocean: {
    name: 'ocean',
    background: '#e0f7fa',
    text: '#006064',
    gridLine: '#006064',
    cellBackground: '#e0f7fa',
    cellSelected: '#b2ebf2',
    sameNumber: '#80deea',
    givenText: '#006064',
    userText: '#0097a7',
    pencilText: '#5c9ea5',
    error: '#ffccbc',
    errorText: '#bf360c',
    buttonBg: '#b2ebf2',
    previewColor: '#006064'
  },
  purple: {
    name: 'purple',
    background: '#f3e5f5',
    text: '#4a148c',
    gridLine: '#4a148c',
    cellBackground: '#f3e5f5',
    cellSelected: '#e1bee7',
    sameNumber: '#ce93d8',
    givenText: '#4a148c',
    userText: '#8e24aa',
    pencilText: '#ab47bc',
    error: '#ffcdd2',
    errorText: '#b71c1c',
    buttonBg: '#e1bee7',
    previewColor: '#9c27b0'
  },
  midnight: {
    name: 'midnight',
    background: '#000022',
    text: '#eeeeff',
    gridLine: '#444488',
    cellBackground: '#050530',
    cellSelected: '#1a1a50',
    sameNumber: '#2a2a70',
    givenText: '#eeeeff',
    userText: '#66ccff',
    pencilText: '#8888aa',
    error: '#550000',
    errorText: '#ffcccc',
    buttonBg: '#111144',
    previewColor: '#000044'
  }
};

export type ThemeKey = keyof typeof COLORS;
export type Theme = typeof COLORS.light;


