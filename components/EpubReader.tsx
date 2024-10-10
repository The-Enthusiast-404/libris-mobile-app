import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface EpubReaderProps {
  bookUri: string;
  onClose: () => void;
}

const ReaderContent: React.FC<EpubReaderProps> = ({ bookUri, onClose }) => {
  const { changeFontSize, goToLocation, goPrevious, goNext, getCurrentLocation, atStart, atEnd } = useReader();
  const [fontSize, setFontSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const handleLocationChange = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentPage(location.start.location);
      setTotalPages(location.end.location);
    }
  };

  const changeFontSizeHandler = (delta: number) => {
    const newSize = fontSize + delta;
    setFontSize(newSize);
    changeFontSize(`${newSize}%`);
  };

  return (
    <ThemedView style={styles.container}>
      <Reader
        src={bookUri}
        width={300}
        height={600}
        fileSystem={useFileSystem}
        onLocationChange={handleLocationChange}
        initialLocation="epubcfi(/6/4[chap01ref]!/4/2/1:0)"
      />
      <View style={styles.controls}>
        <TouchableOpacity onPress={goPrevious} style={styles.navButton} disabled={atStart}>
          <Ionicons name="chevron-back" size={24} color={atStart ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeFontSizeHandler(-10)} style={styles.controlButton}>
          <Ionicons name="remove" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeFontSizeHandler(10)} style={styles.controlButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.navButton} disabled={atEnd}>
          <Ionicons name="chevron-forward" size={24} color={atEnd ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>
      <View style={styles.pageInfo}>
        <ThemedText style={styles.pageNumber}>{`${currentPage} / ${totalPages}`}</ThemedText>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <ThemedText style={styles.closeButtonText}>Close</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

export const EpubReader: React.FC<EpubReaderProps> = (props) => {
  return (
    <ReaderProvider>
      <ReaderContent {...props} />
    </ReaderProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    padding: 10,
  },
  controlButton: {
    padding: 10,
  },
  pageInfo: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  pageNumber: {
    fontSize: 12,
    color: '#888',
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
  },
});