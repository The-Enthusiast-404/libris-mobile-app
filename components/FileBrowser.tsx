import React, { useState, useEffect } from 'react';
import { Platform, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

type FileItem = {
  name: string;
  isDirectory: boolean;
  uri: string;
};

export const FileBrowser: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(FileSystem.documentDirectory);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<MediaLibrary.PermissionStatus | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (permissionStatus === 'granted') {
      loadFiles();
    }
  }, [currentPath, permissionStatus]);

  const checkPermissions = async () => {
    const { status } = await MediaLibrary.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant file access permission to use this feature.');
    }
  };

  const loadFiles = async () => {
    try {
      const result = await FileSystem.readDirectoryAsync(currentPath);
      const filePromises = result.map(async (name) => {
        const uri = `${currentPath}${name}`;
        const info = await FileSystem.getInfoAsync(uri);
        return {
          name,
          isDirectory: info.isDirectory,
          uri,
        };
      });
      const fileItems = await Promise.all(filePromises);
      setFiles(fileItems);
    } catch (error) {
      console.error('Error loading files:', error);
      Alert.alert('Error', 'Unable to load files. Please check app permissions.');
    }
  };

  const handleFilePress = (item: FileItem) => {
    if (item.isDirectory) {
      setCurrentPath(`${item.uri}/`);
    } else {
      // TODO: Handle file selection
      console.log('Selected file:', item.uri);
    }
  };

  const goBack = () => {
    if (currentPath !== FileSystem.documentDirectory) {
      const parentPath = currentPath.split('/').slice(0, -2).join('/') + '/';
      setCurrentPath(parentPath);
    }
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity style={styles.fileItem} onPress={() => handleFilePress(item)}>
      <Ionicons
        name={item.isDirectory ? 'folder-outline' : 'document-outline'}
        size={24}
        color={item.isDirectory ? '#4A90E2' : '#50C878'}
      />
      <ThemedText style={styles.fileName}>{item.name}</ThemedText>
    </TouchableOpacity>
  );

  if (permissionStatus !== 'granted') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.permissionText}>Permission to access files is required.</ThemedText>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <ThemedText style={styles.permissionButtonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={goBack}>
        <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        <ThemedText style={styles.backButtonText}>Back</ThemedText>
      </TouchableOpacity>
      <FlatList
        data={files}
        renderItem={renderItem}
        keyExtractor={(item) => item.uri}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4A90E2',
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  fileName: {
    marginLeft: 10,
    fontSize: 16,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});