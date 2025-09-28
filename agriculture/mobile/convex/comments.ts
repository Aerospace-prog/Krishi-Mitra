import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a comment
export const createComment = mutation({
  args: {
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      ...args,
      likesCount: 0,
      repliesCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update post's comment count
    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, {
        commentsCount: post.commentsCount + 1,
      });
    }

    // If this is a reply, update parent comment's reply count
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (parentComment) {
        await ctx.db.patch(args.parentCommentId, {
          repliesCount: parentComment.repliesCount + 1,
        });
      }
    }

    return commentId;
  },
});

// Get comments for a post
export const getPostComments = query({
  args: {
    postId: v.id("posts"),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Get top-level comments (no parent)
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post_created", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("parentCommentId"), undefined))
      .order("desc")
      .take(limit);

    const commentsWithDetails = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        let isLiked = false;
        if (args.userId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_user_target", (q) => 
              q.eq("userId", args.userId!).eq("targetId", comment._id)
            )
            .unique();
          isLiked = like !== null;
        }

        // Get replies for this comment
        const replies = await ctx.db
          .query("comments")
          .withIndex("by_parent", (q) => q.eq("parentCommentId", comment._id))
          .order("asc")
          .take(5); // Limit replies shown initially

        const repliesWithDetails = await Promise.all(
          replies.map(async (reply) => {
            const replyAuthor = await ctx.db.get(reply.authorId);
            let isReplyLiked = false;
            if (args.userId) {
              const replyLike = await ctx.db
                .query("likes")
                .withIndex("by_user_target", (q) => 
                  q.eq("userId", args.userId!).eq("targetId", reply._id)
                )
                .unique();
              isReplyLiked = replyLike !== null;
            }

            return {
              ...reply,
              author: replyAuthor ? {
                _id: replyAuthor._id,
                username: replyAuthor.username,
                displayName: replyAuthor.displayName,
                profileImage: replyAuthor.profileImage,
                isVerified: replyAuthor.isVerified,
              } : null,
              isLiked: isReplyLiked,
            };
          })
        );

        return {
          ...comment,
          author: author ? {
            _id: author._id,
            username: author.username,
            displayName: author.displayName,
            profileImage: author.profileImage,
            isVerified: author.isVerified,
          } : null,
          isLiked,
          replies: repliesWithDetails,
        };
      })
    );

    return commentsWithDetails;
  },
});

// Get replies for a comment
export const getCommentReplies = query({
  args: {
    commentId: v.id("comments"),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", args.commentId))
      .order("asc")
      .take(limit);

    const repliesWithDetails = await Promise.all(
      replies.map(async (reply) => {
        const author = await ctx.db.get(reply.authorId);
        let isLiked = false;
        if (args.userId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_user_target", (q) => 
              q.eq("userId", args.userId!).eq("targetId", reply._id)
            )
            .unique();
          isLiked = like !== null;
        }

        return {
          ...reply,
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

    return repliesWithDetails;
  },
});

// Like/Unlike a comment
export const toggleCommentLike = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) => 
        q.eq("userId", args.userId).eq("targetId", args.commentId)
      )
      .unique();

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likesCount: Math.max(0, comment.likesCount - 1),
      });
      return { liked: false, likesCount: Math.max(0, comment.likesCount - 1) };
    } else {
      // Like
      await ctx.db.insert("likes", {
        userId: args.userId,
        targetId: args.commentId,
        targetType: "comment",
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.commentId, {
        likesCount: comment.likesCount + 1,
      });
      return { liked: true, likesCount: comment.likesCount + 1 };
    }
  },
});

// Toggle like on a comment (alternative implementation)
export const toggleLike = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) => 
        q.eq("userId", args.userId).eq("targetId", args.commentId)
      )
      .unique();

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (existingLike) {
      // Unlike - remove the like
      await ctx.db.delete(existingLike._id);
      
      // Decrement like count
      await ctx.db.patch(args.commentId, {
        likesCount: Math.max(0, comment.likesCount - 1)
      });
    } else {
      // Like - add a new like
      await ctx.db.insert("likes", {
        userId: args.userId,
        targetId: args.commentId,
        targetType: "comment",
        createdAt: Date.now(),
      });
      
      // Increment like count
      await ctx.db.patch(args.commentId, {
        likesCount: comment.likesCount + 1
      });
    }

    return { success: true };
  },
});

// Delete a comment
export const deleteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    
    if (comment.authorId !== args.userId) {
      throw new Error("Unauthorized to delete this comment");
    }

    // Delete associated likes
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) => q.eq("targetId", args.commentId))
      .collect();
    
    await Promise.all(likes.map(like => ctx.db.delete(like._id)));

    // Delete replies to this comment
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentCommentId", args.commentId))
      .collect();
    
    await Promise.all(replies.map(reply => ctx.db.delete(reply._id)));

    // Delete the comment
    await ctx.db.delete(args.commentId);

    // Update post's comment count
    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentsCount: Math.max(0, post.commentsCount - 1),
      });
    }

    // If this was a reply, update parent comment's reply count
    if (comment.parentCommentId) {
      const parentComment = await ctx.db.get(comment.parentCommentId);
      if (parentComment) {
        await ctx.db.patch(comment.parentCommentId, {
          repliesCount: Math.max(0, parentComment.repliesCount - 1),
        });
      }
    }

    return { success: true };
  },
});
