import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Cell } from '../types';
import { Theme } from '../constants/theme';

interface Props {
  cell: Cell;
  isSelected: boolean;
  isRelated: boolean; // Zelfde rij/kolom/blok
  isSameNumber: boolean; // Zelfde getal als geselecteerd
  onPress: () => void;
  theme: Theme;
  cellSize: number;
}

export const SudokuCell: React.FC<Props> = ({ 
  cell, 
  isSelected, 
  isRelated, 
  isSameNumber, 
  onPress, 
  theme,
  cellSize 
}) => {
  // Bepaal achtergrondkleur
  let backgroundColor = theme.cellBackground;
  if (cell.isError) backgroundColor = theme.error;
  else if (isSelected) backgroundColor = theme.cellSelected;
  else if (isSameNumber) backgroundColor = theme.sameNumber;
  else if (isRelated) backgroundColor = theme.buttonBg; // Subtiel highlighten van rij/kolom

  // Bepaal tekstkleur
  let textColor = theme.givenText;
  if (!cell.isGiven) textColor = theme.userText;
  if (cell.isError) textColor = theme.errorText;

  // Render Pencil Marks (kleine cijfertjes)
  if (cell.value === null && cell.pencilMarks.length > 0) {
    return (
      <TouchableOpacity 
        style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor, borderColor: theme.gridLine }]} 
        onPress={onPress}
      >
        <View style={styles.pencilContainer}>
          {[1,2,3,4,5,6,7,8,9].map(num => (
            <Text key={num} style={[styles.pencilText, { color: theme.pencilText, opacity: cell.pencilMarks.includes(num) ? 1 : 0 }]}>
              {num}
            </Text>
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.cell, { width: cellSize, height: cellSize, backgroundColor, borderColor: theme.gridLine }]} 
      onPress={onPress}
    >
      <Text style={{ fontSize: cellSize * 0.6, color: textColor, fontWeight: cell.isGiven ? 'bold' : 'normal' }}>
        {cell.value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
  },
  pencilContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
  },
  pencilText: {
    width: '33%',
    height: '33%',
    textAlign: 'center',
    fontSize: 8,
    lineHeight: 10,
  }
});


