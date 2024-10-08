import React, { useState, useEffect } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

interface EpubFile {
  id: string;
  title: string;
}

export default function LibraryScreen() {
  const [books, setBooks] = useState<EpubFile[]>([]);

  useEffect(() => {
    scanForEpubFiles();
  }, []);

  const scanForEpubFiles = async () => {
    try {
      console.log("Starting to scan for EPUB files...");
      const docDir = FileSystem.documentDirectory;
      if (!docDir) {
        console.log("Document directory not found");
        return;
      }

      console.log(`Scanning directory: ${docDir}`);
      const files = await FileSystem.readDirectoryAsync(docDir);
      console.log(`Found ${files.length} files/folders`);

      const epubFiles = files.filter(file => file.toLowerCase().endsWith('.epub'));
      console.log(`Found ${epubFiles.length} EPUB files`);

      const newBooks = epubFiles.map(file => ({
        id: file,
        title: file.replace('.epub', ''),
      }));

      setBooks(newBooks);
    } catch (error) {
      console.error('Error scanning for EPUB files:', error);
      Alert.alert('Error', 'Failed to scan for EPUB files.');
    }
  };

  const renderBookItem = ({ item }: { item: EpubFile }) => (
    <TouchableOpacity style={styles.bookItem}>
      <ThemedText style={styles.bookTitle}>{item.title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.header}>Your Library</ThemedText>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <ThemedText style={styles.emptyText}>No EPUB files found in the document directory.</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bookItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  bookTitle: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
  },
});