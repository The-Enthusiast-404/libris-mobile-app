import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { BookList } from '../components/BookList';
import { EpubReader } from '../components/EpubReader';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

interface Book {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string | undefined;
  cover: string | null;
  coverLoading: boolean;
}

export default function Index() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleBookSelect = (book: Book) => {
    console.log('Book selected:', book);
    setSelectedBook(book);
  };

  const handleCloseReader = () => {
    console.log('Closing reader');
    setSelectedBook(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ThemedView style={styles.content}>
        <ThemedText style={styles.title}>LibriVox - Open Source E-Book Reader</ThemedText>
        {selectedBook ? (
          <View style={styles.readerContainer}>
            <ThemedText style={styles.readingTitle}>Reading: {selectedBook.name}</ThemedText>
            <EpubReader bookUri={selectedBook.uri} onClose={handleCloseReader} />
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseReader}>
              <ThemedText style={styles.closeButtonText}>Close Reader</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <BookList onBookSelect={handleBookSelect} />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  readerContainer: {
    flex: 1,
  },
  readingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});