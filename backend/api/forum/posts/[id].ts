// Forum Post Detail API Endpoint
// GET: Single post with comments
// PUT: Update post
// DELETE: Delete post

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { ForumPostsRepository, ForumCommentsRepository } from '../../../services/forumRepository';

interface JwtPayload {
  userId: string;
  email: string;
}

// Helper to extract user from token
function getUserFromToken(req: VercelRequest): JwtPayload | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Helper to require authentication
function requireAuth(req: VercelRequest): JwtPayload {
  const user = getUserFromToken(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    // GET: Single post with comments
    if (req.method === 'GET') {
      const user = getUserFromToken(req);
      const { comment_sort = 'newest' } = req.query;

      const post = await ForumPostsRepository.getById(id, user?.userId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      const comments = await ForumCommentsRepository.getByPostId(
        id,
        user?.userId,
        comment_sort as 'popular' | 'newest' | 'oldest'
      );

      return res.status(200).json({
        success: true,
        data: {
          ...post,
          comments,
        },
      });
    }

    // PUT: Update post
    if (req.method === 'PUT') {
      const user = requireAuth(req);
      const { title, body, flair, location_tag } = req.body;

      // Validation
      if (title !== undefined && (typeof title !== 'string' || title.length > 100)) {
        return res.status(400).json({ error: 'Title must be max 100 characters' });
      }
      if (body !== undefined && (typeof body !== 'string' || body.length > 2000)) {
        return res.status(400).json({ error: 'Body must be max 2000 characters' });
      }
      if (flair !== undefined && !['general', 'routes', 'questions', 'experiences', 'tips_advice'].includes(flair)) {
        return res.status(400).json({ error: 'Invalid flair' });
      }

      const updatedPost = await ForumPostsRepository.update(id, user.userId, {
        title: title?.trim(),
        body: body?.trim(),
        flair,
        location_tag: location_tag?.trim(),
      });

      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }

      return res.status(200).json({
        success: true,
        data: updatedPost,
        message: 'Post updated successfully',
      });
    }

    // DELETE: Delete post
    if (req.method === 'DELETE') {
      const user = requireAuth(req);

      const deleted = await ForumPostsRepository.delete(id, user.userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }

      return res.status(200).json({
        success: true,
        message: 'Post deleted successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Forum post detail error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
