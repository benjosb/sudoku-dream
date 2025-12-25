import { Cell, Difficulty, Grid } from '../types';

// Hulpfunctie om te checken of een getal veilig geplaatst kan worden
const isSafe = (grid: number[][], row: number, col: number, num: number): boolean => {
  // Check rij en kolom
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
};

// Backtracking algoritme om een bord te vullen
const fillGrid = (grid: number[][]): boolean => {
  let row = -1;
  let col = -1;
  let isEmpty = false;

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] === 0) {
        row = i;
        col = j;
        isEmpty = true;
        break;
      }
    }
    if (isEmpty) break;
  }

  // Geen lege plekken meer? Dan is het bord vol!
  if (!isEmpty) return true;

  // Probeer getallen 1-9 in willekeurige volgorde (voor variatie)
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

  for (const num of numbers) {
    if (isSafe(grid, row, col, num)) {
      grid[row][col] = num;
      if (fillGrid(grid)) return true;
      grid[row][col] = 0; // Backtrack
    }
  }

  return false;
};

// Bepaal hoeveel gaten er moeten vallen per niveau
const getCluesCount = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'beginner': return 50; // Veel hints
    case 'easy': return 40;
    case 'medium': return 32;
    case 'hard': return 26;
    case 'expert': return 22; // Heel weinig hints
    default: return 32;
  }
};

export const generateSudoku = (difficulty: Difficulty): Grid => {
  // 1. Maak een leeg 9x9 rooster
  const rawGrid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));

  // 2. Vul het volledig met een geldig patroon
  fillGrid(rawGrid);

  // Maak een kopie voor de oplossing
  const solutionGrid = rawGrid.map(row => [...row]);

  // 3. Haal cijfers weg op basis van moeilijkheid
  // We moeten er zeker van zijn dat de puzzel nog steeds oplosbaar is (en idealiter uniek)
  // Voor nu gebruiken we een simpele random removal, in een echte app check je op unieke oplossing.
  let attempts = 81 - getCluesCount(difficulty);
  
  while (attempts > 0) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    
    if (rawGrid[r][c] !== 0) {
      rawGrid[r][c] = 0;
      attempts--;
    }
  }

  // 4. Zet om naar ons rijke Cell formaat
  const grid: Grid = rawGrid.map((row, rIndex) => 
    row.map((val, cIndex) => ({
      row: rIndex,
      col: cIndex,
      value: val === 0 ? null : val as any,
      solution: solutionGrid[rIndex][cIndex],
      isGiven: val !== 0,
      pencilMarks: [],
      isError: false
    }))
  );

  return grid;
};


