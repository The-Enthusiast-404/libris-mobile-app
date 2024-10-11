import React, { forwardRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Bookmark, useReader } from '@epubjs-react-native/core';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface Props {
  onClose: () => void;
}
export type Ref = BottomSheetModalMethods;

export const BookmarksList = forwardRef<Ref, Props>(({ onClose }, ref) => {
  const {
    bookmarks,
    removeBookmark,
    removeBookmarks,
    isBookmarked,
    updateBookmark,
    goToLocation,
    currentLocation,
  } = useReader();

  const snapPoints = React.useMemo(() => ['50%', '75%'], []);
  const [note, setNote] = useState('');
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);

  useEffect(() => {
    if (isBookmarked) {
      const bookmark = bookmarks.find(
        (item) =>
          item.location?.start.cfi === currentLocation?.start.cfi &&
          item.location?.end.cfi === currentLocation?.end.cfi
      );

      if (!bookmark) return;

      setCurrentBookmark(bookmark);
      setNote(bookmark.data?.note || '');
    }
  }, [
    bookmarks,
    currentLocation?.end.cfi,
    currentLocation?.start.cfi,
    isBookmarked,
  ]);

  return (
    <BottomSheetModalProvider>
      <BottomSheetModal
        ref={ref}
        index={1}
        enablePanDownToClose
        snapPoints={snapPoints}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.title}>
            <ThemedText style={styles.titleText}>Bookmarks</ThemedText>

            {bookmarks.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  removeBookmarks();
                  onClose();
                }}
              >
                <ThemedText style={styles.clearAllText}>Clear All</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {bookmarks.length === 0 && (
            <View style={styles.emptyBookmarks}>
              <ThemedText style={styles.emptyBookmarksText}>
                No bookmarks...
              </ThemedText>
            </View>
          )}

          {isBookmarked && (
            <View style={styles.annotationContainer}>
              <BottomSheetTextInput
                value={note}
                style={styles.input}
                multiline
                placeholder="Type an annotation here..."
                onChangeText={(text) => setNote(text)}
              />

              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => updateBookmark(currentBookmark!.id, { note })}
              >
                <ThemedText style={styles.updateButtonText}>
                  Update Annotation
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {bookmarks.map((bookmark) => (
            <View key={bookmark.id} style={styles.bookmarkContainer}>
              <TouchableOpacity
                style={styles.bookmarkInfo}
                onPress={() => {
                  goToLocation(bookmark.location.start.cfi);
                  onClose();
                }}
              >
                <View style={styles.bookmarkIcon}>
                  <Ionicons name="bookmark" size={20} color="#007AFF" />
                  <ThemedText style={styles.bookmarkLocationNumber}>
                    {bookmark.location.start.location}
                  </ThemedText>
                </View>

                <View style={styles.bookmarkInfoText}>
                  <ThemedText numberOfLines={1} style={styles.chapterText}>
                    Chapter: {bookmark.section?.label}
                  </ThemedText>

                  <ThemedText numberOfLines={2} style={styles.bookmarkText}>
                    &quot;{bookmark.text}&quot;
                  </ThemedText>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  removeBookmark(bookmark);
                  onClose();
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearAllText: {
    color: '#007AFF',
  },
  emptyBookmarks: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyBookmarksText: {
    fontStyle: 'italic',
  },
  annotationContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 64,
    marginTop: 8,
    borderRadius: 10,
    fontSize: 16,
    lineHeight: 20,
    padding: 8,
    backgroundColor: 'rgba(151, 151, 151, 0.25)',
  },
  updateButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#007AFF',
  },
  bookmarkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  bookmarkInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  bookmarkIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bookmarkLocationNumber: {
    fontSize: 12,
    marginTop: -5,
  },
  bookmarkInfoText: {
    flex: 1,
  },
  chapterText: {
    marginBottom: 2,
  },
  bookmarkText: {
    fontStyle: 'italic',
  },
});