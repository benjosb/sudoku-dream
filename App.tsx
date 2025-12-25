import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, Alert, TouchableOpacity, Switch, StatusBar } from 'react-native';
import { generateSudoku } from './src/logic/SudokuGenerator';
import { getSmartHint } from './src/logic/SudokuSolver';
import { Grid, Difficulty } from './src/types';
import { SudokuCell } from './src/components/SudokuCell';
import { Controls } from './src/components/Controls';
import { COLORS } from './src/constants/theme';

const { width } = Dimensions.get('window');
// Bereken celgrootte (schermbreedte - padding) / 9
const CELL_SIZE = (width - 40) / 9;

export default function App() {
  // State voor het spel
  const [grid, setGrid] = useState<Grid>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isPencilMode, setIsPencilMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true); // Standaard Dark Mode voor je dochter
  const [history, setHistory] = useState<Grid[]>([]);

  // Bepaal thema
  const theme = isDarkMode ? COLORS.dark : COLORS.light;

  // Start een nieuw spel
  const startNewGame = (diff: Difficulty = difficulty) => {
    const newGrid = generateSudoku(diff);
    setGrid(newGrid);
    setDifficulty(diff);
    setMistakes(0);
    setHistory([]);
    setSelectedCell(null);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  // VEILIGHEIDSCHECK: Als het bord nog niet geladen is, toon dan een laadschermpje
  if (!grid || grid.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <Text style={{ color: theme.text }}>Sudoku wordt geladen...</Text>
      </View>
    );
  }

  // Cijfer invoeren
  const handleNumberInput = (num: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    const cell = grid[r][c];

    if (cell.isGiven) return; // Kan startcijfers niet wijzigen

    // Save history voor undo
    setHistory([...history, JSON.parse(JSON.stringify(grid))]);

    const newGrid = [...grid];

    if (isPencilMode) {
      // Potlood modus logic
      const marks = cell.pencilMarks.includes(num)
        ? cell.pencilMarks.filter(n => n !== num)
        : [...cell.pencilMarks, num];
      newGrid[r][c] = { ...cell, value: null, pencilMarks: marks, isError: false };
    } else {
      // Normale modus
      const isCorrect = num === cell.solution;
      if (!isCorrect) {
        setMistakes(m => m + 1);
      }
      // Check of dit cijfer al ergens anders in rij/kolom/blok staat (optioneel, nu checken we alleen op solution)
      newGrid[r][c] = { 
        ...cell, 
        value: num as any, 
        isError: !isCorrect,
        pencilMarks: [] // Wis potlood als je een cijfer invult
      };
    }
    setGrid(newGrid);
  };

  // Verwijderen
  const handleDelete = () => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (grid[r][c].isGiven) return;

    setHistory([...history, JSON.parse(JSON.stringify(grid))]);
    const newGrid = [...grid];
    newGrid[r][c] = { ...newGrid[r][c], value: null, isError: false, pencilMarks: [] };
    setGrid(newGrid);
  };

  // Undo functie
  const handleUndo = () => {
    if (history.length === 0) return;
    const previousGrid = history[history.length - 1];
    setGrid(previousGrid);
    setHistory(history.slice(0, -1));
  };

  // Hint functie
  const handleHint = () => {
    const hint = getSmartHint(grid);
    
    if (hint.type === 'none') {
       Alert.alert("Bijna klaar!", hint.message);
       return;
    }

    Alert.alert(
      "Strategische Hint",
      hint.message,
      [
        { text: "Oké, ik ga kijken!", style: "cancel" },
        { 
          text: "Vul in voor mij", 
          onPress: () => {
            // Als ze het echt niet ziet, vullen we het in
            const [r, c] = hint.cell;
            const newGrid = [...grid];
            newGrid[r][c] = { ...newGrid[r][c], value: hint.value as any, isError: false };
            setGrid(newGrid);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Sudoku</Text>
          <Text style={{ color: theme.text, opacity: 0.7 }}>Niveau: {difficulty}</Text>
          <Text style={{ color: theme.error }}>Fouten: {mistakes}/3</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.text, fontSize: 12, marginBottom: 4 }}>Dark Mode</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridContainer}>
        {grid.map((row, rIndex) => (
          <View key={rIndex} style={styles.row}>
            {row.map((cell, cIndex) => {
              // Extra dikke randen voor 3x3 blokken
              const borderRightWidth = (cIndex + 1) % 3 === 0 && cIndex !== 8 ? 2 : 0.5;
              const borderBottomWidth = (rIndex + 1) % 3 === 0 && rIndex !== 8 ? 2 : 0.5;

              return (
                <View 
                  key={`${rIndex}-${cIndex}`} 
                  style={{ 
                    borderRightWidth, 
                    borderBottomWidth, 
                    borderColor: theme.gridLine 
                  }}
                >
                  <SudokuCell
                    cell={cell}
                    isSelected={selectedCell?.[0] === rIndex && selectedCell?.[1] === cIndex}
                    isRelated={selectedCell ? (selectedCell[0] === rIndex || selectedCell[1] === cIndex) : false}
                    isSameNumber={
                        selectedCell && grid[selectedCell[0]] && grid[selectedCell[0]][selectedCell[1]] && grid[selectedCell[0]][selectedCell[1]].value !== null
                        ? cell.value === grid[selectedCell[0]][selectedCell[1]].value
                        : false
                    }
                    onPress={() => setSelectedCell([rIndex, cIndex])}
                    theme={theme}
                    cellSize={CELL_SIZE}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {/* Controls */}
      <Controls 
        onNumberPress={handleNumberInput}
        onDelete={handleDelete}
        onUndo={handleUndo}
        onHint={handleHint}
        togglePencil={() => setIsPencilMode(!isPencilMode)}
        isPencilMode={isPencilMode}
        theme={theme}
      />
      
      {/* Footer / New Game */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => startNewGame('easy')}><Text style={{color: theme.userText}}>Nieuw Spel</Text></TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  gridContainer: {
    borderWidth: 2,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  footer: {
    padding: 20,
  }
});

