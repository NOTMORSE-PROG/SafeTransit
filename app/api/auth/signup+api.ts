// Signup API Endpoint
// Handles user registration with email and password

import { UserRepository } from '../../../services/repositories/userRepository';
import { hashPassword } from '../../../services/auth/password';
import { validateEmail, validatePassword } from '../../../services/auth/validation';
import { generateToken } from '../../../services/auth/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return Response.json(
        { error: 'Missing required fields' },
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

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return Response.json(
        { error: 'Invalid password', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailExists = await UserRepository.emailExists(email);
    if (emailExists) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await UserRepository.create({
      email,
      password_hash: passwordHash,
      full_name: fullName,
      google_id: null,
      profile_image_url: null,
      phone_number: null,
      is_verified: false,
      verification_status: 'none',
    });

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
        hasGoogleLinked: false,
        hasPasswordSet: true,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
