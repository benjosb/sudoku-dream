/**
 * SudokuScanner - Herkent Sudoku puzzels uit foto's
 * Gebruikt OCR.space API (gratis, geen creditcard nodig)
 * 
 * Om een API key te krijgen: https://ocr.space/ocrapi/freekey
 */

import * as FileSystem from 'expo-file-system';

// Gratis API key van OCR.space 
// BELANGRIJK: Haal je eigen GRATIS key op: https://ocr.space/ocrapi/freekey
const OCR_API_KEY = 'K84354733288957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

interface OCRWord {
  WordText: string;
  Left: number;
  Top: number;
  Width: number;
  Height: number;
}

interface OCRLine {
  Words: OCRWord[];
}

interface OCROverlay {
  Lines: OCRLine[];
  HasOverlay: boolean;
}

interface OCRResult {
  success: boolean;
  text?: string;
  overlay?: OCROverlay;
  error?: string;
}

interface ScanResult {
  success: boolean;
  puzzle?: number[][];
  message?: string;
}

/**
 * Voert OCR uit op een afbeelding
 */
export async function performOCR(imageUri: string, base64Data?: string): Promise<OCRResult> {
  try {
    console.log('Reading image from:', imageUri);
    
    // Gebruik de meegegeven base64 data of lees van bestand
    let base64Image: string;
    
    if (base64Data) {
      base64Image = base64Data;
      console.log('Using provided base64 data, length:', base64Image.length);
    } else {
      try {
        base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('Read base64 from file, length:', base64Image.length);
      } catch (readError) {
        console.error('Error reading file:', readError);
        return {
          success: false,
          error: 'Kon de foto niet lezen. Probeer opnieuw.',
        };
      }
    }

    if (!base64Image || base64Image.length === 0) {
      return {
        success: false,
        error: 'Foto kon niet worden geladen.',
      };
    }

    // Bepaal het bestandstype
    const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    // Maak form data
    const formData = new FormData();
    formData.append('base64Image', `data:${mimeType};base64,${base64Image}`);
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng'); // Engels voor cijfers
    formData.append('isOverlayRequired', 'true'); // Positie data nodig!
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('isTable', 'true'); // Hint: dit is een tabel/grid
    formData.append('OCREngine', '1'); // Engine 1 voor gedrukte tekst (kranten)

    console.log('Sending to OCR API...');

    // Stuur naar OCR API
    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('OCR Response:', JSON.stringify(data).substring(0, 500));

    if (data.IsErroredOnProcessing) {
      return {
        success: false,
        error: data.ErrorMessage?.[0] || data.ErrorMessage || 'OCR processing failed',
      };
    }

    if (!data.ParsedResults || data.ParsedResults.length === 0) {
      return {
        success: false,
        error: 'Geen tekst gevonden in de afbeelding.',
      };
    }

    // Extraheer de tekst en overlay
    const parsedText = data.ParsedResults[0]?.ParsedText || '';
    const overlay = data.ParsedResults[0]?.TextOverlay as OCROverlay;
    
    console.log('OCR Overlay:', JSON.stringify(overlay).substring(0, 1000));
    
    return {
      success: true,
      text: parsedText,
      overlay: overlay,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Onbekende fout bij OCR',
    };
  }
}

/**
 * Parseert OCR tekst naar een 9x9 Sudoku grid
 * Verwacht tekst in het formaat van rijen met cijfers
 */
export function parseOCRToGrid(ocrText: string): number[][] | null {
  try {
    // Verwijder alle niet-cijfer karakters behalve newlines en spaties
    const cleanedText = ocrText
      .replace(/[^\d\n\s.·_-]/g, '') // Behoud cijfers, newlines, spaties, en lege-cel markers
      .replace(/[.·_-]/g, '0'); // Vervang lege-cel markers door 0

    // Splits op newlines
    const lines = cleanedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Probeer het grid te bouwen
    const grid: number[][] = [];
    
    for (const line of lines) {
      // Extraheer alle cijfers uit de regel
      const digits = line.match(/\d/g);
      
      if (digits && digits.length >= 9) {
        // Neem de eerste 9 cijfers
        const row = digits.slice(0, 9).map(d => parseInt(d, 10));
        grid.push(row);
      }
    }

    // Check of we precies 9 rijen hebben
    if (grid.length >= 9) {
      return grid.slice(0, 9);
    }

    // Als we niet genoeg rijen hebben, probeer een andere methode
    // Pak alle cijfers en verdeel ze over 9 rijen van 9
    const allDigits = cleanedText.match(/\d/g);
    if (allDigits && allDigits.length >= 81) {
      const fallbackGrid: number[][] = [];
      for (let i = 0; i < 9; i++) {
        const row = allDigits.slice(i * 9, (i + 1) * 9).map(d => parseInt(d, 10));
        fallbackGrid.push(row);
      }
      return fallbackGrid;
    }

    return null;
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

/**
 * Parseert overlay data naar een 9x9 grid op basis van posities
 */
function parseOverlayToGrid(overlay: OCROverlay): number[][] | null {
  if (!overlay || !overlay.HasOverlay || !overlay.Lines || overlay.Lines.length === 0) {
    console.log('No overlay data available');
    return null;
  }

  // Verzamel alle woorden met hun posities
  const allWords: { digit: number; x: number; y: number }[] = [];
  
  for (const line of overlay.Lines) {
    for (const word of line.Words) {
      // Alleen cijfers 1-9
      const digit = parseInt(word.WordText, 10);
      if (digit >= 1 && digit <= 9) {
        allWords.push({
          digit,
          x: word.Left + word.Width / 2, // Center x
          y: word.Top + word.Height / 2,  // Center y
        });
      }
    }
  }

  console.log(`Found ${allWords.length} digits with positions`);
  
  if (allWords.length < 17) { // Minimum voor een geldige Sudoku
    console.log('Not enough digits found');
    return null;
  }

  // Vind de bounding box van alle cijfers
  const minX = Math.min(...allWords.map(w => w.x));
  const maxX = Math.max(...allWords.map(w => w.x));
  const minY = Math.min(...allWords.map(w => w.y));
  const maxY = Math.max(...allWords.map(w => w.y));
  
  const gridWidth = maxX - minX;
  const gridHeight = maxY - minY;
  const cellWidth = gridWidth / 8; // 9 cellen = 8 gaps
  const cellHeight = gridHeight / 8;

  console.log(`Grid bounds: ${minX},${minY} to ${maxX},${maxY}`);
  console.log(`Cell size: ${cellWidth} x ${cellHeight}`);

  // Maak een leeg 9x9 grid
  const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  // Plaats elk cijfer in de juiste cel
  for (const word of allWords) {
    // Bereken grid positie (0-8)
    let col = Math.round((word.x - minX) / cellWidth);
    let row = Math.round((word.y - minY) / cellHeight);
    
    // Clamp to valid range
    col = Math.max(0, Math.min(8, col));
    row = Math.max(0, Math.min(8, row));
    
    console.log(`Digit ${word.digit} at (${word.x}, ${word.y}) -> cell [${row}][${col}]`);
    
    // Plaats het cijfer (overschrijf als er al iets staat)
    grid[row][col] = word.digit;
  }

  return grid;
}

/**
 * Hoofdfunctie: Scant een afbeelding en retourneert een Sudoku puzzel
 */
export async function scanSudokuFromImage(imageUri: string, base64Data?: string): Promise<ScanResult> {
  console.log('Starting Sudoku scan for:', imageUri);
  
  // Stap 1: Voer OCR uit
  const ocrResult = await performOCR(imageUri, base64Data);
  
  if (!ocrResult.success) {
    console.log('OCR Failed:', ocrResult.error);
    return {
      success: false,
      message: `OCR mislukt: ${ocrResult.error}`,
    };
  }

  console.log('OCR Text Result:', ocrResult.text?.substring(0, 200));

  // Stap 2: Probeer eerst overlay parsing (met posities)
  let puzzle: number[][] | null = null;
  
  if (ocrResult.overlay) {
    console.log('Trying overlay-based parsing...');
    puzzle = parseOverlayToGrid(ocrResult.overlay);
  }
  
  // Stap 3: Fallback naar tekst parsing
  if (!puzzle) {
    console.log('Falling back to text-based parsing...');
    puzzle = parseOCRToGrid(ocrResult.text || '');
  }
  
  if (!puzzle) {
    return {
      success: false,
      message: 'Kon geen 9x9 grid vinden. Probeer:\n- Alleen het Sudoku rooster in beeld\n- Goede belichting\n- Foto recht van boven',
    };
  }

  console.log('Parsed puzzle:', JSON.stringify(puzzle));

  // Stap 4: Check basis structuur (maar NIET voor duplicaten - dat doet correctie-scherm)
  if (!isBasicGridValid(puzzle)) {
    return {
      success: false,
      message: 'Kon geen geldig 9x9 rooster maken. Probeer een duidelijkere foto.',
    };
  }

  // Geef de puzzel door, ook als er duplicaten zijn!
  // De gebruiker kan ze fixen in het correctie-scherm
  return {
    success: true,
    puzzle: puzzle,
  };
}

/**
 * Checkt alleen of het grid de juiste structuur heeft (9x9, geldige waarden)
 * NIET voor duplicaten - dat doet het correctie-scherm
 */
function isBasicGridValid(grid: number[][]): boolean {
  if (grid.length !== 9) return false;
  
  for (const row of grid) {
    if (row.length !== 9) return false;
    for (const val of row) {
      if (val < 0 || val > 9) return false;
    }
  }

  // Tel hoeveel cijfers er gevonden zijn
  let filledCount = 0;
  for (const row of grid) {
    for (const val of row) {
      if (val !== 0) filledCount++;
    }
  }
  
  // Minimaal 10 cijfers nodig om iets zinnigs te hebben
  // (kan lager dan 17 zijn want gebruiker kan aanvullen)
  return filledCount >= 10;
}

/**
 * Test functie met een demo puzzel (voor ontwikkeling)
 */
export function getDemoPuzzle(): number[][] {
  return [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
}

