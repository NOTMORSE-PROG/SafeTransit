// Database Test API Route
// GET /api/db/test - Test database connection

import { testConnection, initDatabase } from '../../../services/database';

export async function GET() {
  try {
    const result = await testConnection();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await initDatabase();
    return Response.json({
      success: true,
      message: 'Database tables initialized successfully',
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize database',
      },
      { status: 500 }
    );
  }
}
