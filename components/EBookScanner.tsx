import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

type EbookFile = {
  name: string;
  uri: string;
  type: 'pdf' | 'epub';
};

export const EbookScanner: React.FC = () => {
  const [ebooks, setEbooks] = useState<EbookFile[]>([]);

  useEffect(() => {
    scanForEbooks();
  }, []);

  const scanForEbooks = async () => {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        console.error('Documents directory not found');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(documentsDir);
      const ebookFiles = files
        .filter(file => file.endsWith('.pdf') || file.endsWith('.epub'))
        .map(file => ({
          name: file,
          uri: `${documentsDir}${file}`,
          type: file.endsWith('.pdf') ? 'pdf' : 'epub' as 'pdf' | 'epub'
        }));

      setEbooks(ebookFiles);
    } catch (error) {
      console.error('Error scanning for ebooks:', error);
    }
  };

  const renderEbookItem = ({ item }: { item: EbookFile }) => (
    <TouchableOpacity style={styles.ebookItem}>
      <ThemedText>{item.name}</ThemedText>
      <ThemedText style={styles.ebookType}>{item.type.toUpperCase()}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Your Ebooks</ThemedText>
      {ebooks.length > 0 ? (
        <FlatList
          data={ebooks}
          renderItem={renderEbookItem}
          keyExtractor={item => item.uri}
        />
      ) : (
        <ThemedText>No ebooks found in the documents directory.</ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  ebookItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  ebookType: {
    fontSize: 12,
    color: '#666',
  },
});