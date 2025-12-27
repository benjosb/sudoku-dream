import { Grid, Cell } from '../types';
import { translations, Language } from '../constants/translations';

export interface Hint {
  type: 'last_remaining' | 'naked_single' | 'hidden_single' | 'none';
  cell: [number, number]; // [row, col]
  value: number;
  message: string;
}

// Helper: Haal alle mogelijke kandidaten op voor een cel
const getCandidates = (grid: Grid, row: number, col: number): number[] => {
  if (grid[row][col].value !== null) return [];

  const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Check rij
  for (let c = 0; c < 9; c++) {
    if (grid[row][c].value) candidates.delete(grid[row][c].value as number);
  }
  // Check kolom
  for (let r = 0; r < 9; r++) {
    if (grid[r][col].value) candidates.delete(grid[r][col].value as number);
  }
  // Check blok
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const val = grid[startRow + r][startCol + c].value;
      if (val) candidates.delete(val as number);
    }
  }

  return Array.from(candidates);
};

export const getSmartHint = (grid: Grid, lang: Language = 'en'): Hint => {
  const t = translations[lang].solver;

  // Stap 1: Zoek naar "Last Remaining" (rij/kolom/box met nog 1 leeg vakje)
  // Dit is de makkelijkste strategie voor een mens om te zien.
  
  // (We scannen hier rijen en kolommen, vereenvoudigde implementatie voor nu)
  for (let r = 0; r < 9; r++) {
    let emptyCount = 0;
    let lastCol = -1;
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === null) {
        emptyCount++;
        lastCol = c;
      }
    }
    if (emptyCount === 1) {
      const candidates = getCandidates(grid, r, lastCol);
      if (candidates.length === 1) {
        return {
          type: 'last_remaining',
          cell: [r, lastCol],
          value: candidates[0],
          message: t.lastRemaining(r + 1)
        };
      }
    }
  }

  // Stap 2: Zoek naar "Naked Singles" (een vakje waar nog maar 1 cijfer in past)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === null) {
        const candidates = getCandidates(grid, r, c);
        if (candidates.length === 1) {
          return {
            type: 'naked_single',
            cell: [r, c],
            value: candidates[0],
            message: t.nakedSingle(r + 1, c + 1)
          };
        }
      }
    }
  }

  // Stap 3: Zoek naar "Hidden Singles" (een cijfer dat in een regio/rij/kolom nog maar op 1 plek kan)
  // Check blokken (vaak makkelijkst te zien voor mensen)
  for (let boxRow = 0; boxRow < 9; boxRow += 3) {
    for (let boxCol = 0; boxCol < 9; boxCol += 3) {
      // Voor elk cijfer 1-9 checken of het nog maar op 1 plek in dit blok kan
      for (let num = 1; num <= 9; num++) {
        let possiblePositions: [number, number][] = [];
        let alreadyPresent = false;

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = grid[boxRow + r][boxCol + c];
            if (cell.value === num) alreadyPresent = true;
            if (cell.value === null) {
              if (getCandidates(grid, boxRow + r, boxCol + c).includes(num)) {
                possiblePositions.push([boxRow + r, boxCol + c]);
              }
            }
          }
        }

        if (!alreadyPresent && possiblePositions.length === 1) {
          const [targetR, targetC] = possiblePositions[0];
          return {
            type: 'hidden_single',
            cell: [targetR, targetC],
            value: num,
            message: t.hiddenSingle(num)
          };
        }
      }
    }
  }

  // Fallback: Als we geen slimme strategie vinden, zoek dan de EERSTE cel die leeg is en geef daar de OPLOSSING van terug.
  // We moeten hier NIET zomaar een waarde gokken, maar de solution uit de cell gebruiken.
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === null) {
         // CRITICAL FIX: Gebruik de solution van de cel, niet zomaar een kandidaat
         const correctValue = grid[r][c].solution;
         
         return {
            type: 'none',
            cell: [r, c],
            value: correctValue,
            message: t.fallback(correctValue)
          };
      }
    }
  }

  return { type: 'none', cell: [0, 0], value: 0, message: 'Gefeliciteerd, de puzzel is af!' };
};


