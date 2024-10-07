import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import JSZip from 'jszip';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Book {
  id: string;
  name: string;
  uri: string;
  size: number;
  mimeType: string | undefined;
  cover: string | null;
  coverLoading: boolean;
}

const extractCover = async (book: Book): Promise<string | null> => {
  if (book.uri.toLowerCase().endsWith('.epub')) {
    try {
      console.log(`Extracting cover for: ${book.name}`);

      const content = await FileSystem.readAsStringAsync(book.uri, { encoding: FileSystem.EncodingType.Base64 });
      const zip = new JSZip();
      await zip.loadAsync(content, { base64: true });

      // Find the first image file in the EPUB
      const imageFile = Object.values(zip.files).find(file =>
        !file.dir && file.name.match(/\.(jpe?g|png|gif|bmp)$/i)
      );

      if (imageFile) {
        const imageData = await imageFile.async('base64');
        const tempCoverPath = `${FileSystem.cacheDirectory}${book.id}-cover.jpg`;
        await FileSystem.writeAsStringAsync(tempCoverPath, imageData, { encoding: FileSystem.EncodingType.Base64 });
        console.log(`Cover extracted and saved to: ${tempCoverPath}`);
        return tempCoverPath;
      } else {
        console.log('No image found in the EPUB file');
        return null;
      }
    } catch (error) {
      console.error(`Error extracting cover for ${book.name}:`, error);
      return null;
    }
  } else {
    console.log(`${book.name} is not an EPUB file, skipping cover extraction`);
    return null;
  }
};

export const BookList: React.FC<{ onBookSelect: (book: Book) => void }> = ({ onBookSelect }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const addBook = async (book: Book) => {
    setBooks(prevBooks => [...prevBooks, { ...book, coverLoading: true }]);
    const coverPath = await extractCover(book);
    setBooks(prevBooks =>
      prevBooks.map(b =>
        b.id === book.id ? { ...b, cover: coverPath, coverLoading: false } : b
      )
    );
  };

  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
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
          coverLoading: false
        }));

        for (const book of newBooks) {
          await addBook(book);
        }
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
          <ThemedText>{item.name.slice(0, 2).toUpperCase()}</ThemedText>
        </View>
      )}
      <View style={styles.bookInfo}>
        <ThemedText style={styles.bookTitle}>{item.name}</ThemedText>
        <ThemedText>Size: {(item.size / 1024 / 1024).toFixed(2)} MB</ThemedText>
        <ThemedText>Type: {item.mimeType}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickDocument} disabled={loading}>
        <ThemedText style={styles.buttonText}>{loading ? 'Processing...' : 'Pick E-Book'}</ThemedText>
      </TouchableOpacity>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <ThemedText style={styles.title}>Your E-Books ({books.length}):</ThemedText>
        )}
      />
    </ThemedView>
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