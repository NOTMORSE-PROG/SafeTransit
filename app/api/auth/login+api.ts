// Login API Endpoint
// Handles user authentication with email and password
// Enforces Google-only account rules

import { UserRepository } from '../../../services/repositories/userRepository';
import { comparePassword } from '../../../services/auth/password';
import { validateEmail } from '../../../services/auth/validation';
import { generateToken } from '../../../services/auth/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return Response.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // CRITICAL: Check if this is a Google-only account
    // If user has google_id but NO password_hash, they must use Google to login
    if (user.google_id && (!user.password_hash || user.password_hash === '')) {
      return Response.json(
        {
          error: 'This email uses Google Sign-In. Please continue with Google.',
          errorCode: 'GOOGLE_ONLY_ACCOUNT',
        },
        { status: 403 }
      );
    }

    // Verify password exists
    if (!user.password_hash || user.password_hash === '') {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare password with hash
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email });

    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profileImageUrl: user.profile_image_url,
        hasGoogleLinked: !!user.google_id,
        hasPasswordSet: true,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
