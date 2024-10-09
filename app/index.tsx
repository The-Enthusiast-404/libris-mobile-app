import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { BookList } from '../components/BookList';
import { EpubReader } from '../components/EpubReader';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';

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
          <EpubReader
            bookUri={selectedBook.uri}
            onClose={handleCloseReader}
          />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
});