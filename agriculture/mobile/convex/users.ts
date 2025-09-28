import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user profile
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    displayName: v.string(),
    email: v.string(),
    profileImage: v.optional(v.string()),
    bio: v.optional(v.string()),
    farmLocation: v.optional(v.string()),
    farmType: v.optional(v.string()),
    specialization: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        ...args,
        updatedAt: Date.now(),
      });
    }

    // Create new user
    return await ctx.db.insert("users", {
      ...args,
      isVerified: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Get user by username
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

// Get user profile with stats
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      ...user,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
    };
  },
});

// Search users
export const searchUsers = query({
  args: { 
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const users = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.eq(q.field("username"), args.searchTerm),
          q.eq(q.field("displayName"), args.searchTerm)
        )
      )
      .take(limit);

    return users;
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    farmLocation: v.optional(v.string()),
    farmType: v.optional(v.string()),
    specialization: v.optional(v.array(v.string())),
    profileImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    return await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
