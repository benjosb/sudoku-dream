export const COLORS = {
  light: {
    background: '#ffffff',
    text: '#000000',
    gridLine: '#333333',
    cellBackground: '#ffffff',
    cellSelected: '#e3f2fd', // Lichtblauw voor geselecteerd vakje
    sameNumber: '#bbdefb', // Iets donkerder blauw voor alle 5-en als je op een 5 klikt
    givenText: '#000000', // Startcijfers
    userText: '#1976d2', // Ingevulde cijfers (blauw)
    pencilText: '#757575', // Potlood notities (grijs)
    error: '#ffcdd2', // Rood achtergrondje bij fout
    errorText: '#d32f2f',
    buttonBg: '#f0f0f0',
  },
  dark: {
    background: '#121212',
    text: '#ffffff',
    gridLine: '#555555',
    cellBackground: '#1e1e1e',
    cellSelected: '#333333',
    sameNumber: '#444444',
    givenText: '#ffffff',
    userText: '#90caf9', // Lichtblauw voor contrast
    pencilText: '#aaaaaa',
    error: '#cf6679',
    errorText: '#000000',
    buttonBg: '#333333',
  }
};

export type Theme = typeof COLORS.light;


