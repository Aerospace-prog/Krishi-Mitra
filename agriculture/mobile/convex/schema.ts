import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table for farmer profiles
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    displayName: v.string(),
    email: v.string(),
    profileImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    farmLocation: v.optional(v.string()),
    farmType: v.optional(v.string()),
    specialization: v.array(v.string()),
    isVerified: v.boolean(),
    followersCount: v.number(),
    followingCount: v.number(),
    postsCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_created_at", ["createdAt"]),

  // Posts table for farmer content
  posts: defineTable({
    authorId: v.id("users"),
    content: v.string(),
    mediaUrls: v.array(v.string()),
    mediaTypes: v.array(v.string()), // 'image' | 'video'
    hashtags: v.array(v.string()),
    mentions: v.array(v.id("users")),
    location: v.optional(v.string()),
    likesCount: v.number(),
    commentsCount: v.number(),
    sharesCount: v.number(),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_created_at", ["createdAt"])
    .index("by_hashtags", ["hashtags"])
    .index("by_public_created", ["isPublic", "createdAt"]),

  // Comments table for post interactions
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
    likesCount: v.number(),
    repliesCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentCommentId"])
    .index("by_post_created", ["postId", "createdAt"]),

  // Likes table for posts and comments
  likes: defineTable({
    userId: v.id("users"),
    targetId: v.string(), // post or comment ID
    targetType: v.string(), // 'post' | 'comment'
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_target", ["targetId"])
    .index("by_user_target", ["userId", "targetId"]),

  // Follows table for user connections
  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_following", ["followerId", "followingId"]),

  // Notifications table for user alerts
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // 'like' | 'comment' | 'follow' | 'mention'
    fromUserId: v.id("users"),
    targetId: v.optional(v.string()), // post or comment ID
    message: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead"])
    .index("by_created_at", ["createdAt"]),
    
  // Bookmarks table for saved posts
  bookmarks: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),
});
