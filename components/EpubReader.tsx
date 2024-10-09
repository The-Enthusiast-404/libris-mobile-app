import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as ZipArchive from 'react-native-zip-archive';
import { Ionicons } from '@expo/vector-icons';
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
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const webViewRef = useRef<WebView>(null);

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
      const processedContent = processHtmlContent(content);
      setContent(processedContent);
    } catch (err) {
      console.error('Error loading HTML file:', err);
      setError(`Failed to load page: ${err.message}`);
    }
  };

  const processHtmlContent = (html: string) => {
    const baseStyle = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: ${fontSize}px;
        line-height: 1.5;
        padding: 20px;
        color: ${isDarkMode ? '#ffffff' : '#000000'};
        background-color: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
      }
      img {
        max-width: 100%;
        height: auto;
      }
    `;

    const styledHtml = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>${baseStyle}</style>
        </head>
        <body>${html}</body>
      </html>
    `;

    return styledHtml.replace(
      /(src|href)=['"]((?!http|https|data:).+?)['"]/g,
      (match, attr, value) => `${attr}="file://${FileSystem.cacheDirectory}epub_${Date.now()}/${value}"`
    );
  };

  const navigatePage = (direction: 'next' | 'prev') => {
    let newIndex = direction === 'next' ? currentFileIndex + 1 : currentFileIndex - 1;
    if (newIndex >= 0 && newIndex < htmlFiles.length) {
      setCurrentFileIndex(newIndex);
      loadHtmlFile(htmlFiles[newIndex]);
    }
  };

  const changeFontSize = (delta: number) => {
    setFontSize(prevSize => {
      const newSize = prevSize + delta;
      webViewRef.current?.injectJavaScript(`
        document.body.style.fontSize = '${newSize}px';
        true;
      `);
      return newSize;
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      webViewRef.current?.injectJavaScript(`
        document.body.style.color = '${newMode ? '#ffffff' : '#000000'}';
        document.body.style.backgroundColor = '${newMode ? '#1a1a1a' : '#ffffff'}';
        true;
      `);
      return newMode;
    });
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
        ref={webViewRef}
        source={{ html: content, baseUrl: '' }}
        style={styles.webView}
        originWhitelist={['*']}
      />
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => navigatePage('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeFontSize(-1)} style={styles.controlButton}>
          <Ionicons name="remove" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => changeFontSize(1)} style={styles.controlButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme} style={styles.controlButton}>
          <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigatePage('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="white" />
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#007AFF',
  },
  navButton: {
    padding: 10,
  },
  controlButton: {
    padding: 10,
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