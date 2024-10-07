import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Text, View, Button } from 'react-native';
import { BookList } from '../components/BookList';
import { EpubReader } from '../components/EpubReader';

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
      <Text style={styles.title}>LibriVox - Open Source E-Book Reader</Text>
      {selectedBook ? (
        <View style={styles.readerContainer}>
          <Text>Reading: {selectedBook.name}</Text>
          <EpubReader bookUri={selectedBook.uri} onClose={handleCloseReader} />
          <Button title="Close Reader" onPress={handleCloseReader} />
        </View>
      ) : (
        <BookList onBookSelect={handleBookSelect} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
});