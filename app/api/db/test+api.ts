// Database Test API Route
// GET /api/db/test - Test database connection
// Note: Database schema is managed through migrations (npm run db:migrate)

import { testConnection } from '../../../services/database';

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
