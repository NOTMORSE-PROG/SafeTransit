// Verify Token API Endpoint
// Validates JWT tokens and returns current user data

import { UserRepository } from '../../../services/repositories/userRepository';
import { verifyToken } from '../../../services/auth/jwt';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { valid: false, error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return Response.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      return Response.json(
        { valid: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profileImageUrl: user.profile_image_url,
        hasGoogleLinked: !!user.google_id,
        hasPasswordSet: !!user.password_hash && user.password_hash !== '',
      },
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return Response.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
