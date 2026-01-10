// Link Google Account API Endpoint
// Allows authenticated users to link their Google account
// from the Profile page

import { UserRepository } from '../../../services/repositories/userRepository';
import { verifyToken } from '../../../services/auth/jwt';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verify Google ID token with Google's tokeninfo endpoint
 */
async function verifyGoogleToken(token: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      id: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // Get JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const jwtToken = authHeader.substring(7);
    const payload = verifyToken(jwtToken);

    if (!payload) {
      return Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { googleToken } = body;

    if (!googleToken) {
      return Response.json(
        { error: 'Missing Google token' },
        { status: 400 }
      );
    }

    // Verify Google token
    const googleUserInfo = await verifyGoogleToken(googleToken);
    if (!googleUserInfo) {
      return Response.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    // Get current user
    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already linked
    if (user.google_id) {
      return Response.json(
        { error: 'Google account already linked' },
        { status: 409 }
      );
    }

    // Check if Google email matches user email
    if (user.email !== googleUserInfo.email) {
      return Response.json(
        { error: 'Google account email does not match your account email' },
        { status: 400 }
      );
    }

    // Check if this Google ID is already linked to another account
    const isLinked = await UserRepository.isGoogleIdLinked(googleUserInfo.id);
    if (isLinked) {
      return Response.json(
        { error: 'This Google account is already linked to another user' },
        { status: 409 }
      );
    }

    // Link the Google account
    const success = await UserRepository.linkGoogleAccount(user.id, googleUserInfo.id);

    if (!success) {
      return Response.json(
        { error: 'Failed to link Google account' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: 'Google account linked successfully',
    });
  } catch (error) {
    console.error('Link Google error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
