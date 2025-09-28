import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new post
export const createPost = mutation({
  args: {
    authorId: v.id("users"),
    content: v.string(),
    mediaUrls: v.array(v.string()),
    mediaTypes: v.array(v.string()),
    hashtags: v.array(v.string()),
    mentions: v.array(v.id("users")),
    location: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      ...args,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user's post count
    const user = await ctx.db.get(args.authorId);
    if (user) {
      await ctx.db.patch(args.authorId, {
        postsCount: user.postsCount + 1,
      });
    }

    return postId;
  },
});

// Get posts for feed (with pagination)
export const getFeedPosts = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let query = ctx.db
      .query("posts")
      .withIndex("by_public_created", (q) => q.eq("isPublic", true))
      .order("desc");

    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("_creationTime"), parseInt(args.cursor!)));
    }

    const posts = await query.take(limit);

    // Get author information for each post
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        let isLiked = false;
        if (args.userId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_user_target", (q) => 
              q.eq("userId", args.userId!).eq("targetId", post._id)
            )
            .unique();
          isLiked = like !== null;
        }

        return {
          ...post,
          author: author ? {
            _id: author._id,
            username: author.username,
            displayName: author.displayName,
            profileImage: author.profileImage,
            isVerified: author.isVerified,
          } : null,
          isLiked,
        };
      })
    );

    return {
      posts: postsWithAuthors,
      nextCursor: posts.length === limit ? posts[posts.length - 1].createdAt.toString() : null,
    };
  },
});

// Get user's posts
export const getUserPosts = query({
  args: {
    userId: v.id("users"),
    viewerId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(limit);

    const author = await ctx.db.get(args.userId);

    const postsWithDetails = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false;
        if (args.viewerId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_user_target", (q) => 
              q.eq("userId", args.viewerId!).eq("targetId", post._id)
            )
            .unique();
          isLiked = like !== null;
        }

        return {
          ...post,
          author: author ? {
            _id: author._id,
            username: author.username,
            displayName: author.displayName,
            profileImage: author.profileImage,
            isVerified: author.isVerified,
          } : null,
          isLiked,
        };
      })
    );

    return postsWithDetails;
  },
});

// Get single post with details
export const getPost = query({
  args: {
    postId: v.id("posts"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    const author = await ctx.db.get(post.authorId);
    const isLiked = args.userId ? await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) => 
        q.eq("userId", args.userId!).eq("targetId", post._id)
      )
      .unique() !== null : false;

    return {
      ...post,
      author: author ? {
        _id: author._id,
        username: author.username,
        displayName: author.displayName,
        profileImage: author.profileImage,
        isVerified: author.isVerified,
      } : null,
      isLiked,
    };
  },
});

// Search posts by hashtags
export const searchPostsByHashtag = query({
  args: {
    hashtag: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const posts = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .collect();
    
    // Filter posts that contain the hashtag
    const filteredPosts = posts
      .filter(post => post.hashtags.includes(args.hashtag))
      .slice(0, limit);

    const postsWithAuthors = await Promise.all(
      filteredPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author ? {
            _id: author._id,
            username: author.username,
            displayName: author.displayName,
            profileImage: author.profileImage,
            isVerified: author.isVerified,
          } : null,
        };
      })
    );

    return postsWithAuthors;
  },
});

// Toggle like on a post
export const toggleLike = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) => 
        q.eq("userId", args.userId).eq("targetId", args.postId)
      )
      .unique();
      
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (existingLike) {
      // Unlike - remove the like
      await ctx.db.delete(existingLike._id);
      
      // Decrement like count
      await ctx.db.patch(args.postId, {
        likesCount: Math.max(0, post.likesCount - 1)
      });
    } else {
      // Like - add a new like
      await ctx.db.insert("likes", {
        userId: args.userId,
        targetId: args.postId,
        targetType: "post",
        createdAt: Date.now(),
      });
      
      // Increment like count
      await ctx.db.patch(args.postId, {
        likesCount: post.likesCount + 1
      });
    }

    return { success: true };
  },
});

// Increment share count for a post
export const incrementShare = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Increment share count
    await ctx.db.patch(args.postId, {
      sharesCount: post.sharesCount + 1
    });
    
    return { success: true };
  },
});

// Delete a post (only by the author)
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }
    
    // Check if the user is the author
    if (post.authorId !== args.userId) {
      throw new Error("Unauthorized: Only the author can delete this post");
    }
    
    // Delete the post
    await ctx.db.delete(args.postId);
    
    return { success: true };
  },
});

// Toggle bookmark on a post
export const toggleBookmark = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingBookmark = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_post", (q) => 
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .unique();
      
    if (existingBookmark) {
      // Remove bookmark
      await ctx.db.delete(existingBookmark._id);
      return { bookmarked: false };
    } else {
      // Add bookmark
      await ctx.db.insert("bookmarks", {
        userId: args.userId,
        postId: args.postId,
        createdAt: Date.now(),
      });
      return { bookmarked: true };
    }
  },
});

// Get bookmarked posts for a user
export const getBookmarkedPosts = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const posts = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const post = await ctx.db.get(bookmark.postId);
        if (!post) return null;
        
        const author = await ctx.db.get(post.authorId);
        
        return {
          ...post,
          author: author ? {
            _id: author._id,
            username: author.username,
            displayName: author.displayName,
            profileImage: author.profileImage,
            isVerified: author.isVerified,
          } : null,
        };
      })
    );
    
    // Filter out any null posts (in case a post was deleted)
    return posts.filter(post => post !== null);
  },
});
