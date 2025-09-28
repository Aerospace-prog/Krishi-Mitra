import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Follow a user
export const followUser = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => 
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: args.followerId,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    // Update follower's following count
    const follower = await ctx.db.get(args.followerId);
    if (follower) {
      await ctx.db.patch(args.followerId, {
        followingCount: follower.followingCount + 1,
      });
    }

    // Update following user's followers count
    const following = await ctx.db.get(args.followingId);
    if (following) {
      await ctx.db.patch(args.followingId, {
        followersCount: following.followersCount + 1,
      });
    }

    return { success: true };
  },
});

// Unfollow a user
export const unfollowUser = mutation({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => 
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();

    if (!existingFollow) {
      throw new Error("Not following this user");
    }

    // Delete follow relationship
    await ctx.db.delete(existingFollow._id);

    // Update follower's following count
    const follower = await ctx.db.get(args.followerId);
    if (follower) {
      await ctx.db.patch(args.followerId, {
        followingCount: Math.max(0, follower.followingCount - 1),
      });
    }

    // Update following user's followers count
    const following = await ctx.db.get(args.followingId);
    if (following) {
      await ctx.db.patch(args.followingId, {
        followersCount: Math.max(0, following.followersCount - 1),
      });
    }

    return { success: true };
  },
});

// Check if user is following another user
export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followingId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_following", (q) => 
        q.eq("followerId", args.followerId).eq("followingId", args.followingId)
      )
      .unique();

    return follow !== null;
  },
});

// Get user's followers
export const getFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .order("desc")
      .take(limit);

    const followers = await Promise.all(
      follows.map(async (follow) => {
        const follower = await ctx.db.get(follow.followerId);
        return follower ? {
          _id: follower._id,
          username: follower.username,
          displayName: follower.displayName,
          profileImage: follower.profileImage,
          isVerified: follower.isVerified,
          followedAt: follow.createdAt,
        } : null;
      })
    );

    return followers.filter(Boolean);
  },
});

// Get users that a user is following
export const getFollowing = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .order("desc")
      .take(limit);

    const following = await Promise.all(
      follows.map(async (follow) => {
        const followingUser = await ctx.db.get(follow.followingId);
        return followingUser ? {
          _id: followingUser._id,
          username: followingUser.username,
          displayName: followingUser.displayName,
          profileImage: followingUser.profileImage,
          isVerified: followingUser.isVerified,
          followedAt: follow.createdAt,
        } : null;
      })
    );

    return following.filter(Boolean);
  },
});

// Get mutual followers (people who follow both users)
export const getMutualFollowers = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get followers of user1
    const user1Followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId1))
      .collect();

    // Get followers of user2
    const user2Followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId2))
      .collect();

    // Find mutual followers
    const user1FollowerIds = new Set(user1Followers.map(f => f.followerId));
    const mutualFollowerIds = user2Followers
      .filter(f => user1FollowerIds.has(f.followerId))
      .map(f => f.followerId)
      .slice(0, limit);

    const mutualFollowers = await Promise.all(
      mutualFollowerIds.map(async (followerId) => {
        const follower = await ctx.db.get(followerId);
        return follower ? {
          _id: follower._id,
          username: follower.username,
          displayName: follower.displayName,
          profileImage: follower.profileImage,
          isVerified: follower.isVerified,
        } : null;
      })
    );

    return mutualFollowers.filter(Boolean);
  },
});

// Get suggested users to follow (users with mutual connections)
export const getSuggestedUsers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get users that the current user is following
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const followingIds = new Set(following.map(f => f.followingId));
    followingIds.add(args.userId); // Don't suggest self

    // Get users followed by people the current user follows
    const suggestions = new Map();
    
    for (const follow of following) {
      const theirFollowing = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", follow.followingId))
        .take(20);

      for (const theirFollow of theirFollowing) {
        if (!followingIds.has(theirFollow.followingId)) {
          const count = suggestions.get(theirFollow.followingId) || 0;
          suggestions.set(theirFollow.followingId, count + 1);
        }
      }
    }

    // Sort by mutual connections and get top suggestions
    const sortedSuggestions = Array.from(suggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    const suggestedUsers = await Promise.all(
      sortedSuggestions.map(async ([userId, mutualCount]) => {
        const user = await ctx.db.get(userId as any);
        if (!user || !(user as any).username) return null; // Ensure it's a user document
        return {
          _id: (user as any)._id,
          username: (user as any).username,
          displayName: (user as any).displayName,
          profileImage: (user as any).profileImage || undefined,
          isVerified: (user as any).isVerified || false,
          mutualConnections: mutualCount,
        };
      })
    );

    return suggestedUsers.filter(Boolean);
  },
});
