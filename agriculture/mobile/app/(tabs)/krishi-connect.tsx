import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, Pressable, RefreshControl, ActivityIndicator, Alert, Modal, TextInput, Share, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { FlatGrid } from 'react-native-super-grid';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
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
    likeActive: '#ef4444',
    likeInactive: '#64748b',
    inputBackground: '#ffffff',
    modalBackground: '#ffffff',
  },
  dark: {
    primary: '#10b981',
    background: '#121212',
    card: '#1e1e1e',
    text: '#e5e5e5',
    textSecondary: '#a0a0a0',
    textTertiary: '#737373',
    border: '#2e2e2e',
    buttonBackground: '#1e3a31',
    likeActive: '#ef4444',
    likeInactive: '#737373',
    inputBackground: '#1e1e1e',
    modalBackground: '#1e1e1e',
  }
};

type Post = {
  _id: string;
  content: string;
  mediaUrls: string[];
  mediaTypes: string[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  isBookmarked?: boolean;
  sharesCount: number;
  isLiked: boolean;
  _creationTime: number;
  author: {
    _id: string;
    username: string;
    displayName: string;
    profileImage?: string;
    isVerified: boolean;
  };
};

type Comment = {
  id: string;
  author: string;
  content: string;
  time: string;
};

export default function KrishiConnectScreen() {
  const { user } = useUser();
  // Using light theme by default since useColorScheme is causing issues
  const theme = 'light';
  const colors = Colors[theme];
  const styles = createStyles(colors);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'explore'>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showComments, setShowComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [localPostUpdates, setLocalPostUpdates] = useState<Record<string, { isLiked?: boolean; likesCount?: number; isBookmarked?: boolean }>>({});

  // Convex queries and mutations
  const posts = useQuery(api.posts.getFeedPosts, {});
  const comments = useQuery(api.comments.getPostComments, 
    showComments ? { postId: showComments as Id<"posts"> } : "skip"
  );
  const currentUser = useQuery(api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );
  
  const createUserMutation = useMutation(api.users.createUser);
  const createPostMutation = useMutation(api.posts.createPost);
  const toggleLikeMutation = useMutation(api.posts.toggleLike);
  const toggleCommentLikeMutation = useMutation(api.comments.toggleLike);
  const createCommentMutation = useMutation(api.comments.createComment);

  // Initialize user profile when component mounts
  useEffect(() => {
    if (user && !currentUser) {
      createUserMutation({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        username: user.username || user.firstName || 'farmer',
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Farmer',
        profileImage: user.imageUrl,
        bio: 'Passionate farmer sharing knowledge',
        farmLocation: 'India',
        specialization: ['General Farming']
      }).catch(console.error);
    }
  }, [user, currentUser, createUserMutation]);


  // Helper function to get post with local updates
  const getPostWithUpdates = (post: any) => {
    const updates = localPostUpdates[post._id];
    return {
      ...post,
      isLiked: updates?.isLiked !== undefined ? updates.isLiked : post.isLiked,
      likesCount: updates?.likesCount !== undefined ? updates.likesCount : post.likesCount,
      isBookmarked: updates?.isBookmarked !== undefined ? updates.isBookmarked : (post.isBookmarked || false),
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear local updates on refresh to sync with server
    setLocalPostUpdates({});
    // Convex automatically refetches data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUser) return;
    
    // Find the current post to get its current state
    const currentPost = posts?.posts?.find(p => p._id === postId);
    if (!currentPost) return;
    
    // Get current state with any local updates
    const postWithUpdates = getPostWithUpdates(currentPost);
    const wasLiked = postWithUpdates.isLiked;
    const newLikeCount = wasLiked ? Math.max(0, postWithUpdates.likesCount - 1) : postWithUpdates.likesCount + 1;
    
    try {
      // Update local state immediately for responsive feel
      setLocalPostUpdates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiked: !wasLiked,
          likesCount: newLikeCount
        }
      }));
      
      // Call the mutation
      await toggleLikeMutation({ 
        postId: postId as Id<"posts">, 
        userId: currentUser._id 
      });
      
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert local state on error
      setLocalPostUpdates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiked: wasLiked,
          likesCount: postWithUpdates.likesCount
        }
      }));
    }
  };
  
  const handleToggleCommentLike = async (commentId: string) => {
    if (!currentUser) return;
    try {
      // Update local state immediately for responsive UI
      setLikedComments(prev => {
        const currentLiked = prev[commentId] !== undefined ? prev[commentId] : false;
        return { ...prev, [commentId]: !currentLiked };
      });
      
      await toggleCommentLikeMutation({ 
        commentId: commentId as Id<"comments">, 
        userId: currentUser._id 
      });
      
      // Update UI immediately without refetch
      if (comments) {
        const updatedComments = comments.map(comment => {
          if (comment._id === commentId) {
            const newIsLiked = !comment.isLiked;
            return {
              ...comment,
              isLiked: newIsLiked,
              likesCount: newIsLiked ? comment.likesCount + 1 : Math.max(0, comment.likesCount - 1)
            };
          }
          return comment;
        });
        
        // This is a workaround to update the UI without refetching
        for (let i = 0; i < updatedComments.length; i++) {
          comments[i] = updatedComments[i];
        }
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      // Revert local state on error
      setLikedComments(prev => {
        const currentLiked = prev[commentId] !== undefined ? prev[commentId] : false;
        return { ...prev, [commentId]: currentLiked };
      });
    }
  };

  const handleComment = (postId: string) => {
    setShowComments(postId);
  };

  const addComment = async (postId: string) => {
    if (!newComment.trim() || !currentUser) return;
    
    try {
      await createCommentMutation({
        postId: postId as Id<"posts">,
        authorId: currentUser._id,
        content: newComment,
        parentCommentId: undefined
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const incrementShareMutation = useMutation(api.posts.incrementShare);
  const toggleBookmarkMutation = useMutation(api.posts.toggleBookmark);
  const deletePostMutation = useMutation(api.posts.deletePost);

  const handleBookmark = async (post: any) => {
    if (!currentUser) return;
    
    // Get current state with any local updates
    const postWithUpdates = getPostWithUpdates(post);
    const wasBookmarked = postWithUpdates.isBookmarked;
    
    try {
      // Update local state immediately for responsive feel
      setLocalPostUpdates(prev => ({
        ...prev,
        [post._id]: {
          ...prev[post._id],
          isBookmarked: !wasBookmarked
        }
      }));
      
      // Call the mutation
      const result = await toggleBookmarkMutation({
        postId: post._id as Id<"posts">,
        userId: currentUser._id as Id<"users">
      });
      
      // Log feedback (could be replaced with toast notifications later)
      console.log(result.bookmarked ? 'Post bookmarked!' : 'Post removed from bookmarks!');
      
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert local state on error
      setLocalPostUpdates(prev => ({
        ...prev,
        [post._id]: {
          ...prev[post._id],
          isBookmarked: wasBookmarked
        }
      }));
    }
  };
  
  const handleDeletePost = async (post: any) => {
    if (!currentUser) return;
    
    // Check if current user is the author
    if (post.author?._id !== currentUser._id) {
      Alert.alert('Cannot Delete', 'You can only delete your own posts.');
      return;
    }
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostMutation({
                postId: post._id as Id<"posts">,
                userId: currentUser._id as Id<"users">
              });
              
              // Remove post from UI
              if (posts && posts.posts) {
                const updatedPosts = posts.posts.filter(p => p._id !== post._id);
                posts.posts = updatedPosts;
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleShare = async (post: any) => {
    try {
      await Share.share({
        message: `Check out this post from ${post.author?.displayName}: ${post.content}`,
        title: 'Krishi Connect Post',
      });
      
      // Update share count in the database
      if (currentUser) {
        await incrementShareMutation({ 
          postId: post._id as Id<"posts">
        });
        
        // Update UI immediately without refetch
        if (posts && posts.posts) {
          const updatedPosts = posts.posts.map(p => {
            if (p._id === post._id) {
              return {
                ...p,
                sharesCount: p.sharesCount + 1
              };
            }
            return p;
          });
          
          // This is a workaround to update the UI without refetching
          posts.posts = updatedPosts;
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Bookmark functionality already implemented above

  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  const submitPost = async () => {
    if (!newPostContent.trim() || !currentUser) return;
    
    try {
      await createPostMutation({
        authorId: currentUser._id,
        content: newPostContent,
        mediaUrls: [],
        mediaTypes: [],
        hashtags: extractHashtags(newPostContent),
        mentions: [],
        isPublic: true
      });
      setNewPostContent('');
      setShowCreatePost(false);
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1)) : [];
  };

  const handleSearch = () => {
    Alert.alert(
      'Search',
      'Search functionality coming soon!',
      [{ text: 'OK' }]
    );
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const renderPost = (originalPost: any) => {
    const post = getPostWithUpdates(originalPost);
    return (
    <View key={post._id} style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#4CAF50" />
          </View>
          <View>
            <View style={styles.authorName}>
              <Text style={styles.displayName}>{post.author.displayName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.username}>@{post.author.username}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(post._creationTime)}</Text>
          </View>
        </View>
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
        </Pressable>
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => {
            console.log('Like clicked for post:', originalPost._id, 'Current like state:', post.isLiked, 'Like count:', post.likesCount);
            handleToggleLike(originalPost._id);
          }}
        >
          <Ionicons 
            name={post.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={post.isLiked ? colors.likeActive : colors.likeInactive} 
          />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likesCount}
          </Text>
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => handleComment(originalPost._id)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </Pressable>

        <Pressable 
          style={styles.actionButton}
          onPress={() => handleShare(originalPost)}
        >
          <Ionicons name="share-outline" size={20} color="#64748b" />
          <Text style={styles.actionText}>{post.sharesCount}</Text>
        </Pressable>

        <Pressable 
          style={[
            styles.actionButton,
            post.isBookmarked && styles.bookmarkedButton
          ]}
          onPress={() => {
            console.log('Bookmark clicked for post:', originalPost._id, 'Current bookmark state:', post.isBookmarked);
            handleBookmark(originalPost);
          }}
        >
          <Ionicons 
            name={post.isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={post.isBookmarked ? "#ffffff" : "#64748b"} 
          />
        </Pressable>
        
        {currentUser && originalPost.author?._id === currentUser._id && (
          <Pressable 
            style={styles.actionButton}
            onPress={() => handleDeletePost(originalPost)}
          >
            <Ionicons name="trash-outline" size={20} color="#64748b" />
          </Pressable>
        )}
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Krishi Connect</Text>
        <View style={styles.headerActions}>
          <Pressable 
            style={styles.headerButton}
            onPress={handleSearch}
          >
            <Ionicons name="search" size={24} color="#4CAF50" />
          </Pressable>
          <Pressable 
            style={styles.headerButton}
            onPress={handleCreatePost}
          >
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
          </Pressable>
          <Pressable 
            style={styles.profileButton}
            onPress={() => {
              console.log('Profile button pressed');
              try {
                router.push('/profile' as any);
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Navigation Error', 'Could not navigate to profile');
              }
            }}
          >
            {currentUser?.profileImage ? (
              <Image 
                source={{ uri: currentUser.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileIcon}>
                <Ionicons name="person" size={20} color="#4CAF50" />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
            Feed
          </Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => setActiveTab('explore')}
        >
          <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
            Explore
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {!posts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      ) : (
        <FlatGrid
          itemDimension={300}
          data={posts?.posts || []}
          style={styles.gridContainer}
          spacing={0}
          renderItem={({ item }) => renderPost(item)}
          keyExtractor={(item) => {
            const updates = localPostUpdates[item._id];
            const isBookmarked = updates?.isBookmarked !== undefined ? updates.isBookmarked : false;
            const isLiked = updates?.isLiked !== undefined ? updates.isLiked : item.isLiked;
            const likesCount = updates?.likesCount !== undefined ? updates.likesCount : item.likesCount;
            return `${item._id}-${isLiked}-${isBookmarked}-${likesCount}`;
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Start following farmers to see their posts here
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <Pressable 
        style={styles.fab}
        onPress={handleCreatePost}
      >
        <Ionicons name="add" size={24} color="white" />
      </Pressable>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreatePost(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Create Post</Text>
            <Pressable onPress={submitPost}>
              <Text style={styles.modalPost}>Post</Text>
            </Pressable>
          </View>
          
          <View style={styles.createPostContainer}>
            <TextInput
              style={styles.createPostInput}
              placeholder="What's happening in your farm?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              autoFocus
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showComments !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <Pressable onPress={() => setShowComments(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          
          <ScrollView style={styles.commentsContainer}>
            {comments?.map((comment: any) => (
              <View key={comment._id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Ionicons name="person" size={20} color="#4CAF50" />
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentAuthor}>{comment.author?.displayName || 'Anonymous'}</Text>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <View style={styles.commentActions}>
                    <Pressable 
                      style={styles.commentActionButton}
                      onPress={() => handleToggleCommentLike(comment._id)}
                    >
                      <Ionicons 
                            name={(likedComments[comment._id] !== undefined ? likedComments[comment._id] : comment.isLiked) ? "heart" : "heart-outline"} 
                            size={16} 
                            color={(likedComments[comment._id] !== undefined ? likedComments[comment._id] : comment.isLiked) ? colors.likeActive : colors.likeInactive} 
                          />
                      <Text style={[styles.commentActionText, (likedComments[comment._id] !== undefined ? likedComments[comment._id] : comment.isLiked) && styles.likedText]}>
                        {comment.likesCount}
                      </Text>
                    </Pressable>
                    <Text style={styles.commentTime}>{formatTimeAgo(comment._creationTime)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable 
              style={styles.commentSend}
              onPress={() => showComments && addComment(showComments)}
            >
              <Ionicons name="send" size={20} color="#4CAF50" />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Create dynamic styles based on the current theme
const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 16,
    
  },
  postCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  likedText: {
    color: colors.likeActive,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.modalBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748b',
  },
  modalPost: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  createPostContainer: {
    flex: 1,
    padding: 20,
  },
  createPostInput: {
    fontSize: 18,
    lineHeight: 24,
    color: '#374151',
    textAlignVertical: 'top',
    minHeight: 200,
  },
  commentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.buttonBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commentActionText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.inputBackground,
  },
  commentSend: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    marginLeft: 8,
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  defaultProfileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fff4',
    borderWidth: 2,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkedButton: {
    backgroundColor: '#10b981',
  },
});
