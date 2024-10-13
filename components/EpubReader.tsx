import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, TextInput, FlatList } from 'react-native';
import { Reader, ReaderProvider, useReader, Annotation } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { BookmarksList } from './BookmarksList';
import { BottomSheetModal, BottomSheetFlatList, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface EpubReaderProps {
  bookUri: string;
  onClose: () => void;
}

interface TOCItem {
  label: string;
  href: string;
}

interface Selection {
  cfiRange: string;
  text: string;
}

const COLORS = ['#C20114', '#39A2AE', '#CBA135', '#23CE6B', '#090C02'];

const Header: React.FC<{
  onOpenBookmarksList: () => void;
  onClose: () => void;
  onToggleTOC: () => void;
}> = ({ onOpenBookmarksList, onClose, onToggleTOC }) => {
  const { bookmarks, isBookmarked, addBookmark, removeBookmark, getCurrentLocation } = useReader();

  const handleChangeBookmark = () => {
    const location = getCurrentLocation();
    if (!location) return;
    if (isBookmarked) {
      const bookmark = bookmarks.find(
        (item) =>
          item.location.start.cfi === location.start.cfi &&
          item.location.end.cfi === location.end.cfi
      );
      if (!bookmark) return;
      removeBookmark(bookmark);
    } else {
      addBookmark(location);
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color="#007AFF" />
      </TouchableOpacity>
      <View style={styles.actions}>
        <TouchableOpacity onPress={handleChangeBookmark}>
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenBookmarksList}>
          <Ionicons name="bookmarks-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleTOC}>
          <Ionicons name="list" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
    addAnnotation,
    removeAnnotation,
    updateAnnotation,
    annotations,
    bookmarks,
    toc
  } = useReader();

  const [fontSize, setFontSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [bookMeta, setBookMeta] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTOC, setShowTOC] = useState(false);
  const [tocSearch, setTocSearch] = useState('');
  const [filteredTOC, setFilteredTOC] = useState<TOCItem[]>([]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | undefined>(undefined);
  const [tempMark, setTempMark] = useState<Annotation | null>(null);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const annotationsListRef = useRef<BottomSheetModal>(null);
  const tocRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      const meta = await getMeta();
      setBookMeta(meta);
      setIsLoading(false);
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    setFilteredTOC(
      toc.filter((item) =>
        item.label.toLowerCase().includes(tocSearch.toLowerCase())
      )
    );
  }, [toc, tocSearch]);

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

  const toggleTOC = () => {
    setShowTOC(!showTOC);
  };

  const handleTOCItemPress = (href: string) => {
    goToLocation(href);
    setShowTOC(false);
  };

  const renderTOCItem = ({ item }: { item: TOCItem }) => (
    <TouchableOpacity
      style={styles.tocItem}
      onPress={() => handleTOCItemPress(item.href)}
    >
      <ThemedText>{item.label}</ThemedText>
    </TouchableOpacity>
  );

  const renderOpeningBookComponent = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <ThemedText style={styles.loadingText}>Opening book...</ThemedText>
    </View>
  );

  const handleAddAnnotation = (cfiRange: string, text: string, color: string) => {
    addAnnotation('highlight', cfiRange, { text }, { color });
    setSelection(null);
    setTempMark(null);
  };

  const handleUpdateAnnotation = (annotation: Annotation, observation: string, color: string) => {
    updateAnnotation(
      annotation,
      { ...annotation.data, observation },
      { ...annotation.styles, color }
    );
    setSelectedAnnotation(undefined);
  };

  const handleRemoveAnnotation = (annotation: Annotation) => {
    removeAnnotation(annotation);
    setSelectedAnnotation(undefined);
  };

  const renderAnnotationItem = ({ item }: { item: Annotation }) => (
    <TouchableOpacity
      style={styles.annotationItem}
      onPress={() => {
        goToLocation(item.cfiRange);
        annotationsListRef.current?.dismiss();
      }}
    >
      <View style={[styles.annotationColor, { backgroundColor: item.styles?.color }]} />
      <View style={styles.annotationContent}>
        <ThemedText style={styles.annotationText} numberOfLines={2}>
          {item.cfiRangeText}
        </ThemedText>
        {item.data?.observation && (
          <ThemedText style={styles.annotationObservation}>{item.data.observation}</ThemedText>
        )}
      </View>
      <TouchableOpacity onPress={() => handleRemoveAnnotation(item)}>
        <Ionicons name="trash-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <ThemedView style={styles.container}>
          <Header
            onOpenBookmarksList={() => bottomSheetRef.current?.present()}
            onClose={onClose}
            onToggleTOC={toggleTOC}
          />

          <View style={styles.readerContainer}>
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
                onAddAnnotation={(annotation) => {
                  if (annotation.type === 'highlight' && annotation.data?.isTemp) {
                    setTempMark(annotation);
                  }
                }}
                onPressAnnotation={(annotation) => {
                  setSelectedAnnotation(annotation);
                  annotationsListRef.current?.present();
                }}
                menuItems={[
                  {
                    label: '🟡',
                    action: (cfiRange) => {
                      addAnnotation('highlight', cfiRange, undefined, { color: COLORS[2] });
                      return true;
                    },
                  },
                  {
                    label: '🔴',
                    action: (cfiRange) => {
                      addAnnotation('highlight', cfiRange, undefined, { color: COLORS[0] });
                      return true;
                    },
                  },
                  {
                    label: '🟢',
                    action: (cfiRange) => {
                      addAnnotation('highlight', cfiRange, undefined, { color: COLORS[3] });
                      return true;
                    },
                  },
                  {
                    label: 'Add Note',
                    action: (cfiRange, text) => {
                      setSelection({ cfiRange, text });
                      addAnnotation('highlight', cfiRange, { isTemp: true });
                      annotationsListRef.current?.present();
                      return true;
                    },
                  },
                ]}
              />
            )}

            {showTOC && (
              <View style={styles.tocContainer}>
                <TextInput
                  style={styles.tocSearch}
                  placeholder="Search TOC"
                  value={tocSearch}
                  onChangeText={setTocSearch}
                />
                <FlatList
                  ref={tocRef}
                  data={filteredTOC}
                  renderItem={renderTOCItem}
                  keyExtractor={(item) => item.href}
                  style={styles.tocList}
                />
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity onPress={goPrevious} disabled={atStart}>
              <Ionicons name="chevron-back" size={24} color={atStart ? "#ccc" : "#007AFF"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeFontSizeHandler(-10)}>
              <Ionicons name="remove" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleNightMode}>
              <Ionicons name={isNightMode ? "sunny" : "moon"} size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => annotationsListRef.current?.present()}>
              <Ionicons name="pencil" size={24} color="#007AFF" />
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

          <BottomSheetModal
            ref={annotationsListRef}
            index={0}
            snapPoints={['25%', '50%', '75%']}
            onChange={(index) => {
              if (index === -1) {
                setSelection(null);
                setSelectedAnnotation(undefined);
                if (tempMark) removeAnnotation(tempMark);
              }
            }}
          >
            <View style={styles.annotationsContainer}>
              <ThemedText style={styles.annotationsTitle}>Annotations</ThemedText>
              {(selection || selectedAnnotation) && (
                <View style={styles.annotationForm}>
                  <TextInput
                    style={styles.annotationInput}
                    multiline
                    placeholder="Add a note..."
                    value={selectedAnnotation?.data?.observation || ''}
                    onChangeText={(text) => {
                      if (selectedAnnotation) {
                        setSelectedAnnotation({
                          ...selectedAnnotation,
                          data: { ...selectedAnnotation.data, observation: text },
                        });
                      }
                    }}
                  />
                  <View style={styles.colorPicker}>
                    {COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[styles.colorOption, { backgroundColor: color }]}
                        onPress={() => {
                          if (selection) {
                            handleAddAnnotation(selection.cfiRange, selection.text, color);
                          } else if (selectedAnnotation) {
                            handleUpdateAnnotation(
                              selectedAnnotation,
                              selectedAnnotation.data?.observation || '',
                              color
                            );
                          }
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}
              <BottomSheetFlatList
                data={annotations.filter((a) => a.type === 'highlight' && !a.data?.isTemp)}
                renderItem={renderAnnotationItem}
                keyExtractor={(item) => item.cfiRange}
              />
            </View>
          </BottomSheetModal>
        </ThemedView>
      </BottomSheetModalProvider>
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
        actions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 15,
        },
        readerContainer: {
          flex: 1,
          position: 'relative',
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
        tocContainer: {
          position: 'absolute',
          top: 0,
          right: 0,
          width: 250,
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderLeftWidth: 1,
          borderLeftColor: '#e0e0e0',
        },
        tocSearch: {
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        tocList: {
          flex: 1,
        },
        tocItem: {
          padding: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        annotationsContainer: {
          flex: 1,
          padding: 16,
        },
        annotationsTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 16,
        },
        annotationForm: {
          marginBottom: 16,
        },
        annotationInput: {
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 4,
          padding: 8,
          marginBottom: 8,
          minHeight: 80,
        },
        colorPicker: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 16,
        },
        colorOption: {
          width: 30,
          height: 30,
          borderRadius: 15,
        },
        annotationItem: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        annotationColor: {
          width: 20,
          height: 20,
          borderRadius: 10,
          marginRight: 8,
        },
        annotationContent: {
          flex: 1,
        },
        annotationText: {
          fontSize: 14,
        },
        annotationObservation: {
          fontSize: 12,
          color: '#666',
          fontStyle: 'italic',
        },
      });