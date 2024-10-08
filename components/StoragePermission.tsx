import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export const StoragePermission: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');

  useEffect(() => {
    checkStoragePermission();
  }, []);

  const checkStoragePermission = async () => {
    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();

      if (status === MediaLibrary.PermissionStatus.GRANTED) {
        setPermissionStatus('granted');
      } else if (canAskAgain) {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        setPermissionStatus(newStatus);
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Error checking storage permission:', error);
      setPermissionStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Storage Permission: {permissionStatus}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    margin: 10,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});