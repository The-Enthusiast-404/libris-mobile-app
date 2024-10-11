import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Reader, ReaderProvider, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BookmarksList } from './BookmarksList';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface EpubReaderProps {
  bookUri: string;
  onClose: () => void;
}

const ReaderContent: React.FC<EpubReaderProps> = ({ bookUri, onClose }) => {
  const {
    changeFontSize,
    goToLocation,
    goPrevious,
    goNext,
    getCurrentLocation,
    atStart,
    atEnd,
    search,
    clearSearchResults,
    searchResults,
    changeTheme,
    getMeta,
    addBookmark,
    removeBookmark,
    isBookmarked,
    bookmarks
  } = useReader();

  const [fontSize, setFontSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [bookMeta, setBookMeta] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      const meta = await getMeta();
      setBookMeta(meta);
      setIsLoading(false);
    };
    fetchMeta();
  }, []);

  const handleLocationChange = useCallback(async () => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentPage(location.start.location);
      setTotalPages(location.end.location);
    }
  }, [getCurrentLocation]);

  const changeFontSizeHandler = (delta: number) => {
    const newSize = fontSize + delta;
    setFontSize(newSize);
    changeFontSize(`${newSize}%`);
  };

  const handleSearch = () => {
    if (searchQuery) {
      search(searchQuery);
    } else {
      clearSearchResults();
    }
  };

  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
    changeTheme(isNightMode ? 'light' : 'dark');
  };

  const toggleBookmark = async () => {
    const location = await getCurrentLocation();
    if (location) {
      if (isBookmarked) {
        const bookmark = bookmarks.find(
          (item) =>
            item.location.start.cfi === location.start.cfi &&
            item.location.end.cfi === location.end.cfi
        );
        if (bookmark) {
          removeBookmark(bookmark);
        }
      } else {
        addBookmark(location);
      }
    }
  };

  const renderOpeningBookComponent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <ThemedText style={styles.loadingText}>Opening book...</ThemedText>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>{bookMeta?.title || 'Loading...'}</ThemedText>
          <TouchableOpacity onPress={toggleNightMode}>
            <Ionicons name={isNightMode ? "sunny" : "moon"} size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          renderOpeningBookComponent()
        ) : (
          <Reader
            src={bookUri}
            width={Dimensions.get('window').width}
            height={Dimensions.get('window').height - 150}
            fileSystem={useFileSystem}
            onLocationChange={handleLocationChange}
            renderOpeningBookComponent={renderOpeningBookComponent}
          />
        )}

        <View style={styles.controls}>
          <TouchableOpacity onPress={goPrevious} disabled={atStart}>
            <Ionicons name="chevron-back" size={24} color={atStart ? "#ccc" : "#007AFF"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeFontSizeHandler(-10)}>
            <Ionicons name="remove" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleBookmark}>
            <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.present()}>
            <Ionicons name="list" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeFontSizeHandler(10)}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goNext} disabled={atEnd}>
            <Ionicons name="chevron-forward" size={24} color={atEnd ? "#ccc" : "#007AFF"} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.pageNumber}>{`${currentPage} / ${totalPages}`}</ThemedText>
        </View>

        <BookmarksList
          ref={bottomSheetRef}
          onClose={() => bottomSheetRef.current?.dismiss()}
        />
      </ThemedView>
    </GestureHandlerRootView>
  );
};

export const EpubReader: React.FC<EpubReaderProps> = (props) => {
  return (
    <ReaderProvider>
      <ReaderContent {...props} />
    </ReaderProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footer: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  pageNumber: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});