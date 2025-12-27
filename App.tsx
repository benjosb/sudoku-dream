import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Dimensions, Alert, TouchableOpacity, Switch, StatusBar, Image } from 'react-native';
import { generateSudoku } from './src/logic/SudokuGenerator';
import { getSmartHint } from './src/logic/SudokuSolver';
import { Grid, Difficulty } from './src/types';
import { SudokuCell } from './src/components/SudokuCell';
import { Controls } from './src/components/Controls';
import { COLORS, ThemeKey } from './src/constants/theme';

import * as Localization from 'expo-localization';
import { translations, Language } from './src/constants/translations';
import ConfettiCannon from 'react-native-confetti-cannon';

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
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('dark'); // Standaard thema
  const [history, setHistory] = useState<Grid[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);

  // Bepaal taal (nl of en)
  const deviceLanguage = Localization.getLocales()[0]?.languageCode;
  const lang: Language = deviceLanguage === 'nl' ? 'nl' : 'en';
  const t = translations[lang];

  // Bepaal thema
  const theme = COLORS[currentTheme];

  // Start een nieuw spel
  const startNewGame = (diff: Difficulty) => {
    const newGrid = generateSudoku(diff);
    setGrid(newGrid);
    setDifficulty(diff);
    setMistakes(0);
    setHistory([]);
    setSelectedCell(null);
    setGameStarted(true);
    setIsGameWon(false);
  };

  // Stop spel en ga terug naar menu
  const stopGame = () => {
    Alert.alert(
      t.stopTitle,
      t.stopMessage,
      [
        { text: t.stopCancel, style: "cancel" },
        { text: t.stopConfirm, style: "destructive", onPress: () => setGameStarted(false) }
      ]
    );
  };

  // VEILIGHEIDSCHECK: Als het bord nog niet geladen is, toon dan een laadschermpje
  // Dit is alleen relevant als het spel al gestart is
  if (gameStarted && (!grid || grid.length === 0)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <Text style={{ color: theme.text }}>{t.loading}</Text>
      </View>
    );
  }

  // Bereken welke cijfers compleet zijn (9x ingevuld)
  const completedNumbers = React.useMemo(() => {
    const counts: {[key: number]: number} = {};
    if (!grid) return [];
    
    grid.forEach(row => {
        row.forEach(cell => {
            if (cell.value) {
                counts[cell.value] = (counts[cell.value] || 0) + 1;
            }
        });
    });

    return Object.keys(counts)
        .map(Number)
        .filter(n => counts[n] >= 9);
  }, [grid]);

  // Highlight state
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);

  // Update highlightNumber als selectedCell verandert
  useEffect(() => {
    if (selectedCell && grid[selectedCell[0]][selectedCell[1]].value) {
        setHighlightNumber(grid[selectedCell[0]][selectedCell[1]].value);
    } else {
        setHighlightNumber(null);
    }
  }, [selectedCell, grid]);

  // WIN DETECTIE - checkt bij ELKE grid wijziging of de puzzel af is
  useEffect(() => {
    if (!grid || grid.length === 0 || isGameWon) return;
    
    const isComplete = grid.every(row => 
      row.every(cell => cell.value !== null && cell.value === cell.solution)
    );
    
    if (isComplete) {
      setIsGameWon(true);
      setTimeout(() => {
        Alert.alert(t.wonTitle, t.wonMessage);
      }, 800); // Iets langer wachten zodat confetti goed zichtbaar is
    }
  }, [grid, isGameWon, t]);

  // Cijfer invoeren via Controls
  const handleControlPress = (num: number) => {
    // 1. Highlight aanzetten
    setHighlightNumber(num);
    
    // 2. Als er een cel geselecteerd is, probeer in te vullen
    if (selectedCell) {
        handleNumberInput(num);
    }
  };

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
    // Win detectie gebeurt nu automatisch via useEffect
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
    // 1. Als er een cel geselecteerd is, geef hint voor die specifieke cel
    if (selectedCell) {
        const [r, c] = selectedCell;
        const cell = grid[r][c];

        // Als er al iets staat (wat geen error is), hoeven we geen hint te geven
        if (cell.value && !cell.isError) {
             Alert.alert(t.hintTitle, t.hintCellFilled);
             return;
        }

        // Als er een fout staat
        if (cell.value && cell.isError) {
            Alert.alert(t.hintTitle, t.hintCellError);
            return;
        }

        // Als hij leeg is, geef het antwoord (eerlijk)
        Alert.alert(
            t.hintAskTitle,
            t.hintAskMessage,
            [
                { text: t.hintAskNo, style: "cancel" },
                { 
                    text: t.hintAskYes, 
                    onPress: () => {
                        const newGrid = [...grid];
                        newGrid[r][c] = { ...newGrid[r][c], value: cell.solution as any, isError: false };
                        setGrid(newGrid);
                    }
                }
            ]
        );
        return;
    }

    // 2. Als er GEEN cel geselecteerd is, gebruik de slimme solver voor een algemene hint
    const hint = getSmartHint(grid, lang);
    
    if (hint.type === 'none') {
       // Hier komt de fallback tekst uit de solver
       Alert.alert(
         t.hintNoSmartMove, 
         hint.message,
         [
           { text: t.hintBtnCancel, style: "cancel" },
           { 
             text: t.hintBtnSolve, 
             onPress: () => {
               const [r, c] = hint.cell;
               const newGrid = [...grid];
               newGrid[r][c] = { ...newGrid[r][c], value: hint.value as any, isError: false };
               setGrid(newGrid);
             }
           }
         ]
       );
       return;
    }

    Alert.alert(
      t.hintTitle,
      hint.message,
      [
        { text: t.hintBtnCancel, style: "cancel" },
        { 
          text: t.hintBtnSolve, 
          onPress: () => {
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
      <StatusBar barStyle={currentTheme === 'light' || currentTheme === 'ocean' ? 'dark-content' : 'light-content'} />
      
      {!gameStarted ? (
        // Startscherm
        <View style={styles.menuContainer}>
          <Image 
            source={require('./assets/logo.png')} 
            style={{ width: 150, height: 150, marginBottom: 20, borderRadius: 20 }} 
          />
          <Text style={[styles.title, { color: theme.text, fontSize: 40, marginBottom: 10 }]}>{t.title}</Text>
          <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 40 }}>{t.chooseLevel}</Text>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBg }]} onPress={() => startNewGame('easy')}>
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t.easy}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBg }]} onPress={() => startNewGame('medium')}>
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t.medium}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBg }]} onPress={() => startNewGame('hard')}>
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t.hard}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuButton, { backgroundColor: theme.buttonBg }]} onPress={() => startNewGame('expert')}>
            <Text style={[styles.menuButtonText, { color: theme.text }]}>{t.expert}</Text>
          </TouchableOpacity>

          <Text style={{ color: theme.text, marginTop: 40, marginBottom: 10 }}>{t.chooseTheme}</Text>
          <View style={{ flexDirection: 'row', gap: 15 }}>
            {(Object.keys(COLORS) as ThemeKey[]).map((key) => (
              <TouchableOpacity 
                key={key} 
                onPress={() => setCurrentTheme(key)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: COLORS[key].previewColor,
                  borderWidth: 2,
                  borderColor: currentTheme === key ? theme.text : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {currentTheme === key && <Text style={{ color: COLORS[key].text }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ marginTop: 20, color: theme.text, opacity: 0.3, fontSize: 10 }}>v2.0.3</Text>
        </View>
      ) : (
        // Game Scherm
        <>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <TouchableOpacity 
                onPress={stopGame}
                style={{ padding: 8, backgroundColor: theme.buttonBg, borderRadius: 5 }}
              >
                <Text style={{ color: theme.errorText, fontWeight: 'bold' }}>{t.stop}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>{(t as any)[difficulty]}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: theme.error }}>{t.mistakes}: {mistakes}/3</Text>
            </View>
          </View>

          {/* Grid */}
          <View style={styles.gridContainer}>
            {grid.map((row, rIndex) => (
              <View key={rIndex} style={styles.row}>
                {row.map((cell, cIndex) => {
                  // Extra dikke randen voor 3x3 blokken
                  const borderRightWidth = (cIndex + 1) % 3 === 0 && cIndex !== 8 ? 3 : 0.5;
                  const borderBottomWidth = (rIndex + 1) % 3 === 0 && rIndex !== 8 ? 3 : 0.5;

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
                            highlightNumber === cell.value
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
            onNumberPress={handleControlPress}
            onDelete={handleDelete}
            onUndo={handleUndo}
            onHint={handleHint}
            togglePencil={() => setIsPencilMode(!isPencilMode)}
            isPencilMode={isPencilMode}
            theme={theme}
            completedNumbers={completedNumbers}
            highlightedNumber={highlightNumber}
            t={t}
          />
          {/* Confetti - absoluut gepositioneerd over hele scherm */}
          {isGameWon && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} pointerEvents="none">
              <ConfettiCannon 
                count={200} 
                origin={{x: 200, y: 0}} 
                autoStart={true}
                fadeOut={true}
                fallSpeed={3000}
              />
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  menuButton: {
    width: '80%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '600',
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

