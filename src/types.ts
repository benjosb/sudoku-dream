export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export type CellValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | null;

export interface Cell {
  row: number;
  col: number;
  value: CellValue;
  solution: number; // Het correcte antwoord (zodat we niet steeds hoeven te rekenen)
  isGiven: boolean; // Was dit cijfer al gegeven bij start?
  pencilMarks: number[]; // De aantekeningen van de speler
  isError: boolean; // Als de speler een fout maakt
}

export type Grid = Cell[][];

export interface GameState {
  grid: Grid;
  difficulty: Difficulty;
  mistakes: number;
  history: Grid[]; // Voor undo functionaliteit
}


