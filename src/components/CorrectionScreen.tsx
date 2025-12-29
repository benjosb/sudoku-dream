import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface Props {
  theme: any;
  t: any;
  scannedPuzzle: number[][];
  onConfirm: (puzzle: number[][]) => void;
  onCancel: () => void;
}

export const CorrectionScreen: React.FC<Props> = ({ 
  theme, 
  t, 
  scannedPuzzle, 
  onConfirm, 
  onCancel 
}) => {
  // Maak een kopie van de puzzel om te bewerken
  const [puzzle, setPuzzle] = useState<number[][]>(
    scannedPuzzle.map(row => [...row])
  );
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);

  // Cel selecteren
  const handleCellPress = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  // Nummer invullen
  const handleNumberPress = (num: number) => {
    if (!selectedCell) return;
    
    const newPuzzle = puzzle.map(row => [...row]);
    newPuzzle[selectedCell.row][selectedCell.col] = num;
    setPuzzle(newPuzzle);
  };

  // Cel wissen
  const handleClear = () => {
    if (!selectedCell) return;
    
    const newPuzzle = puzzle.map(row => [...row]);
    newPuzzle[selectedCell.row][selectedCell.col] = 0;
    setPuzzle(newPuzzle);
  };

  // Vind duplicaten en geef details terug
  const findDuplicates = (): string[] => {
    const errors: string[] = [];
    
    // Check voor duplicaten in rijen
    for (let row = 0; row < 9; row++) {
      const seen = new Map<number, number>(); // value -> column
      for (let col = 0; col < 9; col++) {
        const val = puzzle[row][col];
        if (val !== 0) {
          if (seen.has(val)) {
            errors.push(`Rij ${row + 1}: cijfer ${val} staat dubbel (kolom ${seen.get(val)! + 1} en ${col + 1})`);
          }
          seen.set(val, col);
        }
      }
    }
    
    // Check voor duplicaten in kolommen
    for (let col = 0; col < 9; col++) {
      const seen = new Map<number, number>(); // value -> row
      for (let row = 0; row < 9; row++) {
        const val = puzzle[row][col];
        if (val !== 0) {
          if (seen.has(val)) {
            errors.push(`Kolom ${col + 1}: cijfer ${val} staat dubbel (rij ${seen.get(val)! + 1} en ${row + 1})`);
          }
          seen.set(val, row);
        }
      }
    }
    
    // Check voor duplicaten in 3x3 blokken
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      for (let blockCol = 0; blockCol < 3; blockCol++) {
        const seen = new Map<number, string>(); // value -> position
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = blockRow * 3 + r;
            const col = blockCol * 3 + c;
            const val = puzzle[row][col];
            if (val !== 0) {
              if (seen.has(val)) {
                errors.push(`Blok ${blockRow * 3 + blockCol + 1}: cijfer ${val} staat dubbel`);
              }
              seen.set(val, `${row},${col}`);
            }
          }
        }
      }
    }
    
    return errors;
  };
  
  // Valideer puzzel
  const validatePuzzle = (): boolean => {
    return findDuplicates().length === 0;
  };

  // Tel aantal ingevulde cijfers
  const countFilled = (): number => {
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (puzzle[row][col] !== 0) count++;
      }
    }
    return count;
  };

  // Start het spel
  const handleStart = () => {
    const duplicates = findDuplicates();
    if (duplicates.length > 0) {
      // Toon maximaal 3 fouten om het overzichtelijk te houden
      const errorList = duplicates.slice(0, 3).join('\n• ');
      const moreErrors = duplicates.length > 3 ? `\n\n...en nog ${duplicates.length - 3} andere fouten` : '';
      
      Alert.alert(
        '❌ Dubbele cijfers gevonden',
        `Corrigeer deze fouten:\n\n• ${errorList}${moreErrors}`,
        [{ text: 'OK, ik pas het aan' }]
      );
      return;
    }
    
    const filled = countFilled();
    if (filled < 17) {
      Alert.alert(
        t.correctionTooFewTitle || 'Te weinig cijfers',
        t.correctionTooFewMsg || `Een geldige Sudoku heeft minimaal 17 cijfers. Je hebt er nu ${filled}.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    onConfirm(puzzle);
  };

  // Bepaal of een cel geselecteerd is
  const isSelected = (row: number, col: number) => 
    selectedCell?.row === row && selectedCell?.col === col;

  // Bepaal of een cel in dezelfde rij/kolom/blok zit als geselecteerde cel
  const isHighlighted = (row: number, col: number) => {
    if (!selectedCell) return false;
    return (
      row === selectedCell.row ||
      col === selectedCell.col ||
      (Math.floor(row / 3) === Math.floor(selectedCell.row / 3) &&
       Math.floor(col / 3) === Math.floor(selectedCell.col / 3))
    );
  };

  // Check of een cel een conflict heeft (duplicaat in rij/kolom/blok)
  const hasConflict = (row: number, col: number): boolean => {
    const val = puzzle[row][col];
    if (val === 0) return false;
    
    // Check rij
    for (let c = 0; c < 9; c++) {
      if (c !== col && puzzle[row][c] === val) return true;
    }
    
    // Check kolom
    for (let r = 0; r < 9; r++) {
      if (r !== row && puzzle[r][col] === val) return true;
    }
    
    // Check 3x3 blok
    const blockRow = Math.floor(row / 3) * 3;
    const blockCol = Math.floor(col / 3) * 3;
    for (let r = blockRow; r < blockRow + 3; r++) {
      for (let c = blockCol; c < blockCol + 3; c++) {
        if ((r !== row || c !== col) && puzzle[r][c] === val) return true;
      }
    }
    
    return false;
  };

  // Tel aantal conflicten
  const countConflicts = (): number => {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (hasConflict(r, c)) count++;
      }
    }
    return count;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        ✏️ {t.correctionTitle || 'Controleer & Corrigeer'}
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
        {t.correctionSubtitle || 'Tik op een vakje om te bewerken'}
      </Text>
      
      <Text style={[styles.count, { color: theme.text }]}>
        {t.correctionCount || 'Gevonden cijfers'}: {countFilled()}/81
      </Text>
      
      {countConflicts() > 0 && (
        <Text style={[styles.conflictWarning]}>
          ⚠️ {countConflicts()} cellen met conflict (rood)
        </Text>
      )}

      {/* Sudoku Grid */}
      <View style={[styles.grid, { borderColor: theme.text }]}>
        {puzzle.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.cell,
                  {
                    backgroundColor: hasConflict(rowIndex, colIndex)
                      ? '#ff6b6b' // ROOD voor conflicten!
                      : isSelected(rowIndex, colIndex)
                      ? theme.selectedCell
                      : isHighlighted(rowIndex, colIndex)
                      ? theme.highlightedCell
                      : theme.cellBg,
                    borderRightWidth: (colIndex + 1) % 3 === 0 && colIndex < 8 ? 3 : 1,
                    borderBottomWidth: (rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 3 : 1,
                    borderColor: theme.gridLine,
                  },
                ]}
                onPress={() => handleCellPress(rowIndex, colIndex)}
              >
                <Text
                  style={[
                    styles.cellText,
                    { 
                      color: hasConflict(rowIndex, colIndex) 
                        ? '#fff' 
                        : cell !== 0 ? theme.text : 'transparent',
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {cell !== 0 ? cell : '·'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Number buttons */}
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.numberButton,
              { backgroundColor: theme.buttonBg },
            ]}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={[styles.numberButtonText, { color: theme.text }]}>
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.buttonBg }]}
          onPress={handleClear}
        >
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            🗑️ {t.correctionClear || 'Wissen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Start/Cancel buttons */}
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: '#4CAF50' }]}
        onPress={handleStart}
      >
        <Text style={styles.startButtonText}>
          ▶️ {t.correctionStart || 'Start Spel'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: theme.text }]}
        onPress={onCancel}
      >
        <Text style={[styles.cancelButtonText, { color: theme.text }]}>
          ← {t.correctionBack || 'Terug naar scanner'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 5,
  },
  count: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '600',
  },
  conflictWarning: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  grid: {
    borderWidth: 3,
    borderRadius: 4,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cellText: {
    fontSize: 20,
  },
  numberRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 15,
  },
  numberButton: {
    width: 34,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
  },
});

