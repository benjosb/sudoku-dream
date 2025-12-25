import { Grid, Cell } from '../types';

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

export const getSmartHint = (grid: Grid): Hint => {
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
          message: `Kijk naar rij ${r + 1}. Er ontbreekt nog maar één cijfer. Weet jij welke?`
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
            message: `Kijk eens naar het vakje op rij ${r + 1}, kolom ${c + 1}. Door te kijken naar de rij, kolom en het blok, past hier nog maar één cijfer.`
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
            message: `Kijk naar het blok waar dit vakje in zit. Het cijfer ${num} kan nergens anders in dit blok staan.`
          };
        }
      }
    }
  }

  // Fallback: Als we geen slimme strategie vinden, geven we gewoon een hint van een willekeurige cel
  // (In een echte app zou je hier moeilijkere strategieën toevoegen zoals Pairs/Triples)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value === null) {
         return {
            type: 'none',
            cell: [r, c],
            value: grid[r][c].solution,
            message: `Ik kan even geen slimme strategie vinden, maar in dit vakje hoort een ${grid[r][c].solution}.`
          };
      }
    }
  }

  return { type: 'none', cell: [0, 0], value: 0, message: 'Gefeliciteerd, de puzzel is af!' };
};


