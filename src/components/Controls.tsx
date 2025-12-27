import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../constants/theme';

interface Props {
  onNumberPress: (num: number) => void;
  onDelete: () => void;
  onUndo: () => void;
  onHint: () => void;
  togglePencil: () => void;
  isPencilMode: boolean;
  theme: Theme;
  completedNumbers?: number[]; // Optioneel gemaakt
  highlightedNumber?: number | null; // Optioneel gemaakt
  t: any; // Vertalingen object
}

export const Controls: React.FC<Props> = ({ 
  onNumberPress, 
  onDelete, 
  onUndo, 
  onHint, 
  togglePencil, 
  isPencilMode, 
  theme,
  completedNumbers = [], // Default waarde
  highlightedNumber = null, // Default waarde
  t
}) => {
  return (
    <View style={styles.container}>
      {/* Cijfer knoppen */}
      <View style={styles.numberRow}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isCompleted = completedNumbers.includes(num);
          const isHighlighted = highlightedNumber === num;
          
          return (
            <TouchableOpacity
              key={num}
              disabled={isCompleted}
              style={[
                styles.numberButton, 
                { 
                  backgroundColor: isHighlighted ? theme.sameNumber : theme.buttonBg,
                  opacity: isCompleted ? 0.3 : 1
                }
              ]}
              onPress={() => onNumberPress(num)}
            >
              <Text style={[styles.numberText, { color: theme.text }]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Actie knoppen */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.buttonBg }]} onPress={onUndo}>
          <Text style={{ color: theme.text }}>{t.undo}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isPencilMode ? theme.sameNumber : theme.buttonBg }]} 
          onPress={togglePencil}
        >
          <Text style={{ color: theme.text }}>{t.pencil} {isPencilMode ? t.on : t.off}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.buttonBg }]} onPress={onDelete}>
          <Text style={{ color: theme.text }}>{t.eraser}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ff9800' }]} onPress={onHint}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t.hint}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    width: '100%',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  numberButton: {
    width: 35,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  numberText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  }
});

