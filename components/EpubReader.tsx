import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import ePub from 'epubjs';
import * as FileSystem from 'expo-file-system';

interface EpubReaderProps {
  bookUri: string;
  onClose: () => void;
}

export const EpubReader: React.FC<EpubReaderProps> = ({ bookUri, onClose }) => {
  const [currentCfi, setCurrentCfi] = useState<string>('');
  const book = useRef<any>(null);

  useEffect(() => {
    const loadBook = async () => {
      book.current = ePub(bookUri);
      await book.current.ready;
      const firstChapter = await book.current.spine.get(0);
      setCurrentCfi(firstChapter.cfiBase);
      openChapter(firstChapter.cfiBase);
    };

    loadBook();
  }, [bookUri]);

  const openChapter = async (cfi: string) => {
    if (book.current) {
      const chapter = await book.current.renderTo("", { width: 300, height: 600 });
      await chapter.display(cfi);
      const content = await chapter.getContents();
      const html = content.content;

      const tempHtmlPath = `${FileSystem.cacheDirectory}temp.html`;
      await FileSystem.writeAsStringAsync(tempHtmlPath, html);

      await WebBrowser.openBrowserAsync(`file://${tempHtmlPath}`);
    }
  };

  const navigatePage = async (direction: 'next' | 'prev') => {
    if (book.current) {
      const newLocation = direction === 'next'
        ? await book.current.package.next(currentCfi)
        : await book.current.package.prev(currentCfi);

      if (newLocation) {
        setCurrentCfi(newLocation);
        openChapter(newLocation);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => navigatePage('prev')} style={styles.navButton}>
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigatePage('next')} style={styles.navButton}>
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  navButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  navButtonText: {
    color: 'white',
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'red',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
  },
});