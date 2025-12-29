import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { scanSudokuFromImage, getDemoPuzzle } from '../logic/SudokuScanner';
import { CorrectionScreen } from './CorrectionScreen';

interface Props {
  theme: any;
  t: any;
  onPuzzleScanned: (puzzle: number[][]) => void;
  onCancel: () => void;
}

export const ScanScreen: React.FC<Props> = ({ theme, t, onPuzzleScanned, onCancel }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedPuzzle, setScannedPuzzle] = useState<number[][] | null>(null);

  // Foto maken met camera
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera toegang nodig', 'Geef toestemming om foto\'s te maken.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1], // Vierkant voor Sudoku grid
      base64: true, // Direct base64 ophalen
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  // Foto kiezen uit galerij
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Galerij toegang nodig', 'Geef toestemming om foto\'s te selecteren.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true, // Direct base64 ophalen
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  // Verwerk de foto en extraheer Sudoku
  const processImage = async () => {
    if (!image) return;

    setIsProcessing(true);

    try {
      // Voer OCR uit met base64 data
      const result = await scanSudokuFromImage(image, imageBase64 || undefined);
      
      if (result.success && result.puzzle) {
        // Toon correctie-scherm in plaats van direct starten
        setScannedPuzzle(result.puzzle);
      } else {
        // Toon error en bied demo optie aan
        Alert.alert(
          t.scanFailed || 'Herkenning mislukt',
          `${result.message || t.scanFailedMsg || 'Kon de Sudoku niet herkennen.'}\n\nWil je de demo puzzel laden om te testen?`,
          [
            { text: 'Nee', style: 'cancel' },
            { text: 'Ja, laad demo', onPress: () => setScannedPuzzle(getDemoPuzzle()) }
          ]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        t.scanError || 'Fout', 
        (t.scanErrorMsg || 'Er ging iets mis bij het verwerken.') + ' Wil je de demo puzzel proberen?',
        [
          { text: 'Nee', style: 'cancel' },
          { text: 'Ja, laad demo', onPress: () => setScannedPuzzle(getDemoPuzzle()) }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Test met demo puzzel (voor ontwikkeling)
  const loadDemoPuzzle = () => {
    const demo = getDemoPuzzle();
    setScannedPuzzle(demo);
  };

  // Correctie bevestigd -> start het spel
  const handleCorrectionConfirm = (correctedPuzzle: number[][]) => {
    onPuzzleScanned(correctedPuzzle);
  };

  // Terug naar scanner vanuit correctie-scherm
  const handleCorrectionCancel = () => {
    setScannedPuzzle(null);
  };

  // Als er een gescande puzzel is, toon correctie-scherm
  if (scannedPuzzle) {
    return (
      <CorrectionScreen
        theme={theme}
        t={t}
        scannedPuzzle={scannedPuzzle}
        onConfirm={handleCorrectionConfirm}
        onCancel={handleCorrectionCancel}
      />
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        📸 Scan Sudoku
      </Text>
      
      <Text style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}>
        Maak een foto van een Sudoku uit de krant of een boek
      </Text>

      {/* Preview van geselecteerde foto */}
      {image ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.preview} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => setImage(null)}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.placeholder, { borderColor: theme.gridLine }]}>
          <Text style={{ color: theme.text, opacity: 0.5, fontSize: 48 }}>📷</Text>
          <Text style={{ color: theme.text, opacity: 0.5 }}>Geen foto geselecteerd</Text>
        </View>
      )}

      {/* Knoppen voor camera en galerij */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBg }]}
          onPress={takePhoto}
          disabled={isProcessing}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>📸 Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBg }]}
          onPress={pickImage}
          disabled={isProcessing}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>🖼️ Galerij</Text>
        </TouchableOpacity>
      </View>

      {/* Scan knop */}
      {image && (
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: '#4CAF50' }]}
          onPress={processImage}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.scanButtonText}>  Herkennen...</Text>
            </View>
          ) : (
            <Text style={styles.scanButtonText}>🔍 Herken Sudoku</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Demo knop (voor testen) */}
      <TouchableOpacity
        style={[styles.demoButton, { backgroundColor: theme.buttonBg }]}
        onPress={loadDemoPuzzle}
        disabled={isProcessing}
      >
        <Text style={[styles.demoButtonText, { color: theme.text }]}>
          🧪 Test met demo puzzel
        </Text>
      </TouchableOpacity>

      {/* Terug knop */}
      <TouchableOpacity
        style={[styles.cancelButton, { borderColor: theme.text }]}
        onPress={onCancel}
        disabled={isProcessing}
      >
        <Text style={[styles.cancelButtonText, { color: theme.text }]}>
          ← Terug naar menu
        </Text>
      </TouchableOpacity>

      {/* Tips */}
      <View style={[styles.tipsContainer, { backgroundColor: theme.buttonBg }]}>
        <Text style={[styles.tipsTitle, { color: theme.text }]}>💡 Tips voor beste resultaat:</Text>
        <Text style={[styles.tip, { color: theme.text, opacity: 0.8 }]}>• Zorg voor goede belichting</Text>
        <Text style={[styles.tip, { color: theme.text, opacity: 0.8 }]}>• Houd de camera recht boven de puzzel</Text>
        <Text style={[styles.tip, { color: theme.text, opacity: 0.8 }]}>• Alleen het Sudoku grid in beeld</Text>
        <Text style={[styles.tip, { color: theme.text, opacity: 0.8 }]}>• Vermijd schaduwen en reflecties</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  previewContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  preview: {
    width: 280,
    height: 280,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ff4444',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 280,
    height: 280,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scanButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 30,
  },
  cancelButtonText: {
    fontSize: 16,
  },
  demoButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  demoButtonText: {
    fontSize: 14,
    opacity: 0.7,
  },
  tipsContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tip: {
    fontSize: 14,
    marginBottom: 5,
  },
});

