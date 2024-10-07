import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import ePub from 'epubjs';

interface Book {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string | undefined;
  cover: string | null;
  coverLoading: boolean;
}

export const BookList: React.FC<{ onBookSelect: (book: Book) => void }> = ({ onBookSelect }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const extractCover = async (book: Book) => {
    if (book.uri.toLowerCase().endsWith('.epub')) {
      try {
        const epubBook = ePub(book.uri);
        await epubBook.ready;
        const cover = await epubBook.coverUrl();
        setBooks(prevBooks =>
          prevBooks.map(b =>
            b.id === book.id ? { ...b, cover: cover || null, coverLoading: false } : b
          )
        );
      } catch (error) {
        console.error('Error extracting cover:', error);
        setBooks(prevBooks =>
          prevBooks.map(b =>
            b.id === book.id ? { ...b, coverLoading: false } : b
          )
        );
      }
    } else {
      setBooks(prevBooks =>
        prevBooks.map(b =>
          b.id === book.id ? { ...b, coverLoading: false } : b
        )
      );
    }
  };

  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/epub+zip', 'application/pdf'],
        multiple: true
      });

      if (result.canceled === false && result.assets) {
        const newBooks: Book[] = result.assets.map(asset => ({
          id: Math.random().toString(36).substr(2, 9),
          name: asset.name,
          uri: asset.uri,
          size: asset.size,
          mimeType: asset.mimeType,
          cover: null,
          coverLoading: true
        }));

        setBooks(prevBooks => [...prevBooks, ...newBooks]);
        newBooks.forEach(extractCover);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => onBookSelect(item)}
    >
      {item.coverLoading ? (
        <ActivityIndicator size="small" color="#0000ff" style={styles.cover} />
      ) : item.cover ? (
        <Image source={{ uri: item.cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.noCover]}>
          <Text>{item.name.slice(0, 2).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.name}</Text>
        <Text>Size: {(item.size / 1024 / 1024).toFixed(2)} MB</Text>
        <Text>Type: {item.mimeType}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickDocument} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Processing...' : 'Pick E-Book'}</Text>
      </TouchableOpacity>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <Text style={styles.title}>Your E-Books ({books.length}):</Text>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cover: {
    width: 50,
    height: 75,
    marginRight: 10,
    borderRadius: 5,
  },
  noCover: {
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});