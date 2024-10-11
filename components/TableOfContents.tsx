import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface TOCItem {
  label: string;
  href: string;
  subitems?: TOCItem[];
}

interface TableOfContentsProps {
  toc: TOCItem[];
  onItemPress: (href: string) => void;
}

const TOCItem: React.FC<{ item: TOCItem; onPress: (href: string) => void; level: number }> = ({ item, onPress, level }) => (
  <View style={{ marginLeft: level * 15 }}>
    <TouchableOpacity onPress={() => onPress(item.href)} style={styles.tocItem}>
      <ThemedText>{item.label}</ThemedText>
    </TouchableOpacity>
    {item.subitems?.map((subitem, index) => (
      <TOCItem key={index} item={subitem} onPress={onPress} level={level + 1} />
    ))}
  </View>
);

export default function TableOfContents({ toc, onItemPress }: TableOfContentsProps) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Table of Contents</ThemedText>
      <ScrollView style={styles.scrollView}>
        {toc.map((item, index) => (
          <TOCItem key={index} item={item} onPress={onItemPress} level={0} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  tocItem: {
    paddingVertical: 5,
  },
});