// Unified Authentication API Endpoint for Vercel
// Handles email/password signup, email/password login, and Google OAuth
// Routes based on request body fields

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { UserRepository } from "../../services/repositories/userRepository";
import { comparePassword, hashPassword } from "../../services/auth/password";
import {
  validateEmail,
  validatePassword,
} from "../../services/auth/validation";
import { generateToken } from "../../services/auth/jwt";
import {
  checkRateLimit,
  getClientIdentifier,
} from "../../services/auth/rateLimiter";
import {
  sanitizeEmail,
  sanitizeText,
} from "../../services/auth/inputValidation";

interface GoogleUserInfo {
  id: string; // Google's user ID
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verify Google ID token with Google's tokeninfo endpoint
 */
async function verifyGoogleToken(
  token: string,
): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

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

/**
 * Handle Google OAuth authentication
 */
async function handleGoogleAuth(googleToken: string, res: VercelResponse) {
  // Verify Google token and get user info
  const googleUserInfo = await verifyGoogleToken(googleToken);
  if (!googleUserInfo) {
    return res.status(401).json({ error: "Invalid Google token" });
  }

  // Scenario 1: Check if user exists by Google ID (existing Google user)
  let user = await UserRepository.findByGoogleId(googleUserInfo.id);

  if (user) {
    // Existing Google user - login
    const token = generateToken({ userId: user.id, email: user.email });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profileImageUrl: user.profile_image_url,
        phoneNumber: user.phone_number,
        onboardingCompleted: user.onboarding_completed,
        hasGoogleLinked: true,
        hasPasswordSet: !!user.password_hash && user.password_hash !== "",
      },
    });
  }

  // Scenario 2: Check if email exists (potential auto-link scenario)
  user = await UserRepository.findByEmail(googleUserInfo.email);

  if (user) {
    // Email exists but not linked to Google - auto-link
    if (user.google_id) {
      // This shouldn't happen, but handle it
      return res.status(500).json({ error: "Account configuration error" });
    }

    // Auto-link Google to existing account
    await UserRepository.linkGoogleAccount(user.id, googleUserInfo.id);

    // Update profile image if not set
    if (!user.profile_image_url && googleUserInfo.picture) {
      await UserRepository.updateProfile(user.id, {
        profile_image_url: googleUserInfo.picture,
      });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return res.json({
      success: true,
      token,
      isNewLink: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profileImageUrl: googleUserInfo.picture || user.profile_image_url,
        phoneNumber: user.phone_number,
        onboardingCompleted: user.onboarding_completed,
        hasGoogleLinked: true,
        hasPasswordSet: !!user.password_hash && user.password_hash !== "",
      },
    });
  }

  // Scenario 3: New user - create Google-only account
  const newUser = await UserRepository.create({
    email: googleUserInfo.email,
    password_hash: null, // Google-only account has no password
    full_name: googleUserInfo.name,
    google_id: googleUserInfo.id,
    profile_image_url: googleUserInfo.picture || null,
    phone_number: null,
    is_verified: false,
    verification_status: "none",
  });

  const token = generateToken({ userId: newUser.id, email: newUser.email });

  return res.json({
    success: true,
    token,
    isNewUser: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      profileImageUrl: newUser.profile_image_url,
      phoneNumber: newUser.phone_number,
      onboardingCompleted: newUser.onboarding_completed,
      hasGoogleLinked: true,
      hasPasswordSet: false,
    },
  });
}

/**
 * Handle email/password signup
 */
async function handleSignup(
  email: string,
  password: string,
  fullName: string,
  res: VercelResponse,
) {
  // Validate required fields
  if (!email || !password || !fullName) {
    return res.status(400).json({
      error: "Missing required fields",
      details: ["Email, password, and full name are required"],
    });
  }

  // Sanitize inputs
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedFullName = sanitizeText(fullName, 100);

  // Validate email format
  if (!validateEmail(sanitizedEmail)) {
    return res.status(400).json({
      error: "Invalid email format",
      details: ["Please provide a valid email address"],
    });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: "Password does not meet requirements",
      details: passwordValidation.errors || [],
    });
  }

  // Validate full name length
  if (sanitizedFullName.length < 2 || sanitizedFullName.length > 100) {
    return res.status(400).json({
      error: "Invalid full name",
      details: ["Full name must be between 2 and 100 characters"],
    });
  }

  // Check if user already exists
  const existingUser = await UserRepository.findByEmail(sanitizedEmail);
  if (existingUser) {
    return res.status(409).json({
      error: "Account already exists",
      details: ["An account with this email already exists"],
    });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create new user
  const newUser = await UserRepository.create({
    email: sanitizedEmail,
    password_hash: passwordHash,
    full_name: sanitizedFullName,
    profile_image_url: null,
    phone_number: null,
    google_id: null,
    is_verified: false,
    verification_status: "none",
  });

  // Generate JWT token
  const token = generateToken({ userId: newUser.id, email: newUser.email });

  // Return success response
  return res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.full_name,
      profileImageUrl: newUser.profile_image_url,
      phoneNumber: newUser.phone_number,
      onboardingCompleted: newUser.onboarding_completed,
      hasGoogleLinked: false,
      hasPasswordSet: true,
    },
  });
}

/**
 * Handle email/password authentication
 */
async function handleEmailPasswordAuth(
  email: string,
  password: string,
  res: VercelResponse,
) {
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Find user by email
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // CRITICAL: Check if this is a Google-only account
  // If user has google_id but NO password_hash, they must use Google to login
  if (user.google_id && (!user.password_hash || user.password_hash === "")) {
    return res.status(403).json({
      error: "This email uses Google Sign-In. Please continue with Google.",
      errorCode: "GOOGLE_ONLY_ACCOUNT",
    });
  }

  // Verify password exists
  if (!user.password_hash || user.password_hash === "") {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Compare password with hash
  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Generate JWT token
  const token = generateToken({ userId: user.id, email: user.email });

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      profileImageUrl: user.profile_image_url,
      phoneNumber: user.phone_number,
      onboardingCompleted: user.onboarding_completed,
      hasGoogleLinked: !!user.google_id,
      hasPasswordSet: true,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // Rate limiting - 10 attempts per 15 minutes per IP
  const clientId = getClientIdentifier(req.headers);
  const rateLimit = checkRateLimit(clientId, 10, 15 * 60 * 1000);

  res.setHeader("X-RateLimit-Limit", "10");
  res.setHeader("X-RateLimit-Remaining", rateLimit.remaining.toString());
  res.setHeader(
    "X-RateLimit-Reset",
    new Date(rateLimit.resetTime).toISOString(),
  );

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Too many authentication attempts. Please try again later.",
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Log request body for debugging
    console.log("Request body:", JSON.stringify(req.body));
    console.log("Request body keys:", Object.keys(req.body || {}));
    
    const { googleToken, email, password, fullName } = req.body || {};

    // Sanitize email input
    const sanitizedEmail = email ? sanitizeEmail(email) : undefined;

    // Route based on authentication type
    if (googleToken) {
      // Google OAuth flow
      return await handleGoogleAuth(googleToken, res);
    } else if (fullName && sanitizedEmail && password) {
      // Signup flow (has fullName)
      return await handleSignup(sanitizedEmail, password, fullName, res);
    } else if (sanitizedEmail && password) {
      // Login flow (no fullName)
      return await handleEmailPasswordAuth(sanitizedEmail, password, res);
    } else {
      return res.status(400).json({
        error:
          "Invalid request. Provide either googleToken, or email+password (login), or email+password+fullName (signup)",
      });
    }
  } catch (error) {
    // Log detailed error server-side for debugging
    console.error("Authentication error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }

    // Return more specific error in development, generic in production
    const isDev = process.env.NODE_ENV !== "production";
    return res.status(500).json({
      error:
        isDev && error instanceof Error
          ? `Error: ${error.message}`
          : "Authentication service temporarily unavailable. Please try again.",
      ...(isDev && error instanceof Error && { details: error.stack }),
    });
  }
}
