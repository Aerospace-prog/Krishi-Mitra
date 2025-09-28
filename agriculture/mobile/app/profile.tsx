import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, Pressable, RefreshControl, ActivityIndicator, Image, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FlatGrid } from 'react-native-super-grid';
import { router } from 'expo-router';

// Theme-aware colors
const Colors = {
  light: {
    primary: '#10b981',
    background: '#ffffff',
    card: '#ffffff',
    text: '#1a202c',
    textSecondary: '#374151',
    textTertiary: '#64748b',
    border: '#e2e8f0',
    buttonBackground: '#f0fff4',
    tabBackground: '#f9fafb',
    tabActive: '#10b981',
    tabInactive: '#64748b',
  }
};

export default function ProfileScreen() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState('posts');
  const [refreshing, setRefreshing] = useState(false);
  const colors = Colors.light;

  // Get current user from Convex using Clerk user ID
  const currentUser = useQuery(
    api.users.getUserByClerkId, 
    isLoaded && isSignedIn && user?.id ? { clerkId: user.id } : "skip"
  );
  
  // Get user's posts (only posts by this specific user)
  const userPostsResult = useQuery(
    api.posts.getUserPosts,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  // Get user's bookmarked posts
  const bookmarkedPostsResult = useQuery(
    api.posts.getBookmarkedPosts,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  
  // Handle loading and error states
  const isLoading = !isLoaded || (isSignedIn && currentUser === undefined);
  const isError = isSignedIn && currentUser === null;
  
  // Ensure posts are arrays
  const userPosts = Array.isArray(userPostsResult) ? userPostsResult : [];
  const bookmarkedPosts = Array.isArray(bookmarkedPostsResult) ? bookmarkedPostsResult : [];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (isError || !currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load profile. Please try again.
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      {/* Back Button */}
      <Pressable 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <RNView style={styles.profileImageContainer}>
        <Image
          source={{ uri: currentUser.profileImage || 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
      </RNView>
      <Text style={styles.displayName}>{currentUser.displayName}</Text>
      <Text style={[styles.username, { color: colors.textSecondary }]}>@{currentUser.username}</Text>
      
      {currentUser.bio && (
        <Text style={[styles.bio, { color: colors.text }]}>{currentUser.bio}</Text>
      )}
      
      <RNView style={styles.statsContainer}>
        <RNView style={styles.statItem}>
          <Text style={styles.statValue}>{userPosts.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Posts</Text>
        </RNView>
        <RNView style={styles.statItem}>
          <Text style={styles.statValue}>{currentUser.followersCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Followers</Text>
        </RNView>
        <RNView style={styles.statItem}>
          <Text style={styles.statValue}>{currentUser.followingCount || 0}</Text>
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Following</Text>
        </RNView>
      </RNView>
      
      <Pressable
        style={[styles.editProfileButton, { backgroundColor: colors.buttonBackground }]}
        onPress={() => {/* Navigate to edit profile */}}
      >
        <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
      </Pressable>
      
      {/* Tabs */}
      <RNView style={[styles.tabsContainer, { backgroundColor: colors.tabBackground }]}>
        <Pressable
          style={[
            styles.tab,
            activeTab === 'posts' && styles.activeTab
          ]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'posts' ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'posts' ? colors.tabActive : colors.tabInactive }
            ]}
          >
            My Posts
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.tab,
            activeTab === 'bookmarks' && styles.activeTab
          ]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Ionicons
            name="bookmark-outline"
            size={22}
            color={activeTab === 'bookmarks' ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'bookmarks' ? colors.tabActive : colors.tabInactive }
            ]}
          >
            Bookmarks
          </Text>
        </Pressable>
      </RNView>
    </View>
  );

  const renderEmptyState = (type: 'posts' | 'bookmarks') => (
    <View style={styles.emptyStateContainer}>
      <Ionicons 
        name={type === 'posts' ? "images-outline" : "bookmark-outline"} 
        size={50} 
        color={colors.textTertiary} 
      />
      <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
        {type === 'posts' ? 'No posts yet' : 'No bookmarked posts'}
      </Text>
      {type === 'posts' && (
        <Text style={[styles.emptyStateSubtext, { color: colors.textTertiary }]}>
          Start sharing your farming journey!
        </Text>
      )}
    </View>
  );

  const renderPostItem = ({ item }: { item: any }) => (
    <Pressable
      style={styles.postThumbnail}
      onPress={() => {/* Navigate to post detail */}}
    >
      {item.mediaUrls && item.mediaUrls.length > 0 ? (
        <Image
          source={{ uri: item.mediaUrls[0] }}
          style={styles.thumbnailImage}
        />
      ) : (
        <RNView style={[styles.textOnlyPost, { backgroundColor: colors.card }]}>
          <Text numberOfLines={3} style={{ color: colors.text, fontSize: 12 }}>
            {item.content}
          </Text>
        </RNView>
      )}
      {/* Post stats overlay */}
      <RNView style={styles.postStatsOverlay}>
        <RNView style={styles.postStat}>
          <Ionicons name="heart" size={12} color="white" />
          <Text style={styles.postStatText}>{item.likesCount || 0}</Text>
        </RNView>
        <RNView style={styles.postStat}>
          <Ionicons name="chatbubble" size={12} color="white" />
          <Text style={styles.postStatText}>{item.commentsCount || 0}</Text>
        </RNView>
      </RNView>
    </Pressable>
  );

  const currentData = activeTab === 'posts' ? userPosts : bookmarkedPosts;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {currentData && currentData.length > 0 ? (
        <FlatGrid
          itemDimension={120}
          data={currentData}
          spacing={2}
          renderItem={renderPostItem}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.gridContainer}
        />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContainer}
        >
          {renderHeader()}
          {renderEmptyState(activeTab as 'posts' | 'bookmarks')}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    padding: 16,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  profileImageContainer: {
    marginBottom: 12,
    marginTop: 40,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  postThumbnail: {
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  textOnlyPost: {
    width: '100%',
    height: '100%',
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postStatsOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  postStatText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 2,
  },
  emptyStateContainer: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginVertical: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  gridContainer: {
    padding: 4,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
