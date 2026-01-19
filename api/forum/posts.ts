// Forum Posts API Endpoint
// GET: List posts with pagination, sorting, filtering
// POST: Create a new post

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { ForumPostsRepository } from '../../services/forumRepository';
import type { PostFlair, ForumPostInsert } from '../../services/types/forum';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: List posts
    if (req.method === 'GET') {
      const {
        page = '1',
        limit = '20',
        sort = 'recent',
        flair,
        author_id,
      } = req.query;

      const user = getUserFromToken(req);

      const result = await ForumPostsRepository.getPosts({
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 50), // Max 50 per page
        sort: sort as 'recent' | 'popular',
        flair: flair as PostFlair | undefined,
        authorId: author_id as string | undefined,
        userId: user?.userId,
      });

      return res.status(200).json({
        success: true,
        data: result.posts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string)),
        },
      });
    }

    // POST: Create post
    if (req.method === 'POST') {
      const user = requireAuth(req);
      const { title, body, flair, location_tag, photo_url } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.length > 100) {
        return res.status(400).json({ error: 'Title is required and must be max 100 characters' });
      }
      if (!body || typeof body !== 'string' || body.length > 2000) {
        return res.status(400).json({ error: 'Body is required and must be max 2000 characters' });
      }
      if (!flair || !['general', 'routes', 'questions', 'experiences', 'tips_advice'].includes(flair)) {
        return res.status(400).json({ error: 'Valid flair is required' });
      }

      const postData: ForumPostInsert = {
        author_id: user.userId,
        title: title.trim(),
        body: body.trim(),
        flair: flair as PostFlair,
        location_tag: location_tag?.trim() || null,
        photo_url: photo_url || null,
      };

      const post = await ForumPostsRepository.create(postData);

      return res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Forum posts error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
