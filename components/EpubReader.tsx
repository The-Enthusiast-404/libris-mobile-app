import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as ZipArchive from 'react-native-zip-archive';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface EpubReaderProps {
  bookUri: string;
  onClose: () => void;
}

export const EpubReader: React.FC<EpubReaderProps> = ({ bookUri, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [htmlFiles, setHtmlFiles] = useState<string[]>([]);

  useEffect(() => {
    extractAndLoadEpub();
  }, [bookUri]);

  const findHtmlFiles = async (dir: string): Promise<string[]> => {
    const files = await FileSystem.readDirectoryAsync(dir);
    let htmlFiles: string[] = [];

    for (const file of files) {
      const filePath = `${dir}/${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.isDirectory) {
        htmlFiles = htmlFiles.concat(await findHtmlFiles(filePath));
      } else if (file.endsWith('.html') || file.endsWith('.xhtml')) {
        htmlFiles.push(filePath);
      }
    }

    return htmlFiles;
  };

  const extractAndLoadEpub = async () => {
    try {
      setLoading(true);
      setError(null);

      const tempDir = `${FileSystem.cacheDirectory}epub_${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });

      await ZipArchive.unzip(bookUri, tempDir);

      const htmlFiles = await findHtmlFiles(tempDir);
      console.log(`Found ${htmlFiles.length} HTML files`);
      setHtmlFiles(htmlFiles);

      if (htmlFiles.length > 0) {
        await loadHtmlFile(htmlFiles[0]);
      } else {
        throw new Error('No readable content found in the EPUB file.');
      }
    } catch (err) {
      console.error('Error extracting or loading EPUB:', err);
      setError(`Failed to load the book: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadHtmlFile = async (filePath: string) => {
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      // Preprocess the HTML content to handle relative paths
      const processedContent = content.replace(
        /(src|href)=['"]((?!http|https|data:).+?)['"]/g,
        (match, attr, value) => `${attr}="file://${FileSystem.cacheDirectory}epub_${Date.now()}/${value}"`
      );
      setContent(processedContent);
    } catch (err) {
      console.error('Error loading HTML file:', err);
      setError(`Failed to load page: ${err.message}`);
    }
  };

  const navigatePage = (direction: 'next' | 'prev') => {
    let newIndex = direction === 'next' ? currentFileIndex + 1 : currentFileIndex - 1;
    if (newIndex >= 0 && newIndex < htmlFiles.length) {
      setCurrentFileIndex(newIndex);
      loadHtmlFile(htmlFiles[newIndex]);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <ThemedText>Loading book...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity onPress={extractAndLoadEpub} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <WebView
        source={{ html: content, baseUrl: '' }}
        style={styles.webView}
        originWhitelist={['*']}
      />
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => navigatePage('prev')} style={styles.navButton}>
          <ThemedText style={styles.navButtonText}>Previous</ThemedText>
        </TouchableOpacity>
        <ThemedText>{`${currentFileIndex + 1} / ${htmlFiles.length}`}</ThemedText>
        <TouchableOpacity onPress={() => navigatePage('next')} style={styles.navButton}>
          <ThemedText style={styles.navButtonText}>Next</ThemedText>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <ThemedText style={styles.closeButtonText}>Close</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
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
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
  },
});