/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
// Database Migration Runner for SafeTransit
// Executes SQL migration files in order and tracks completed migrations
// Uses regular 'pg' client instead of Neon serverless for proper DDL support

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

/**
 * Split SQL file into individual statements
 * Handles comments, multi-line statements, and dollar-quoted strings ($$)
 */
function splitSqlStatements(sqlContent) {
  // Remove SQL comments (-- and /* */)
  let cleaned = sqlContent
    .replace(/--.*$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const next = cleaned[i + 1];

    // Check for dollar-quoted string start/end
    if (char === '$' && next === '$') {
      // Find the tag (e.g., $$ or $tag$)
      let tag = '$$';
      let tagEnd = i + 2;
      while (tagEnd < cleaned.length && cleaned[tagEnd] !== '$') {
        tag += cleaned[tagEnd];
        tagEnd++;
      }
      if (tagEnd < cleaned.length) {
        tag += '$';
        tagEnd++;
      }

      if (inDollarQuote && tag === dollarTag) {
        // End of dollar-quoted string
        current += cleaned.substring(i, tagEnd);
        i = tagEnd - 1;
        inDollarQuote = false;
        dollarTag = '';
      } else if (!inDollarQuote) {
        // Start of dollar-quoted string
        current += cleaned.substring(i, tagEnd);
        i = tagEnd - 1;
        inDollarQuote = true;
        dollarTag = tag;
      } else {
        current += char;
      }
      continue;
    }

    // Check for statement end (semicolon outside dollar quotes)
    if (char === ';' && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }

  // Add any remaining statement
  const stmt = current.trim();
  if (stmt) {
    statements.push(stmt);
  }

  return statements;
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(`${colors.red}❌ ERROR: DATABASE_URL not found in environment variables${colors.reset}`);
    console.error('Please add DATABASE_URL to your .env file');
    process.exit(1);
  }

  console.log(`${colors.blue}🚀 SafeTransit Database Migration Runner${colors.reset}\n`);

  // Use regular pg client for migrations (Neon serverless has issues with DDL)
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    // Step 1: Create schema_migrations tracking table if it doesn't exist
    console.log(`${colors.yellow}📋 Checking migration tracking table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`${colors.green}✓ Migration tracking table ready${colors.reset}\n`);

    // Step 2: Get list of completed migrations
    const completedResult = await client.query(
      'SELECT version, name FROM schema_migrations ORDER BY version'
    );
    const completedMigrations = completedResult.rows;
    const completedVersions = new Set(completedMigrations.map(m => m.version));

    if (completedMigrations.length > 0) {
      console.log(`${colors.blue}📊 Previously completed migrations:${colors.reset}`);
      completedMigrations.forEach(m => {
        console.log(`   ${colors.green}✓${colors.reset} ${String(m.version).padStart(3, '0')} - ${m.name}`);
      });
      console.log();
    }

    // Step 3: Read migration files from db/migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.error(`${colors.red}❌ ERROR: Migrations directory not found at ${migrationsDir}${colors.reset}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log(`${colors.yellow}⚠️  No migration files found in db/migrations/${colors.reset}`);
      return;
    }

    // Step 4: Execute pending migrations
    const pendingMigrations = files.filter(file => {
      const version = parseInt(file.split('_')[0]);
      return !completedVersions.has(version);
    });

    if (pendingMigrations.length === 0) {
      console.log(`${colors.green}✅ Database is up to date! No pending migrations.${colors.reset}`);
      return;
    }

    console.log(`${colors.blue}🔄 Found ${pendingMigrations.length} pending migration(s)${colors.reset}\n`);

    for (const file of pendingMigrations) {
      const version = parseInt(file.split('_')[0]);
      const name = file.replace('.sql', '').substring(4); // Remove "001_" prefix
      const filePath = path.join(migrationsDir, file);

      console.log(`${colors.yellow}⏳ Running migration ${String(version).padStart(3, '0')}: ${name}...${colors.reset}`);

      try {
        // Read SQL file content
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Split into individual statements
        const statements = splitSqlStatements(sqlContent);

        // Execute each statement individually
        for (const statement of statements) {
          if (statement.trim()) {
            await client.query(statement);
          }
        }

        // Record successful migration
        await client.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [version, name]
        );

        console.log(`${colors.green}   ✓ Migration ${String(version).padStart(3, '0')} completed successfully${colors.reset}\n`);

      } catch (error) {
        console.error(`${colors.red}   ❌ Migration ${String(version).padStart(3, '0')} FAILED${colors.reset}`);
        console.error(`${colors.red}   Error: ${error.message}${colors.reset}\n`);

        // Print additional error details if available
        if (error.detail) {
          console.error(`${colors.red}   Detail: ${error.detail}${colors.reset}`);
        }
        if (error.hint) {
          console.error(`${colors.red}   Hint: ${error.hint}${colors.reset}`);
        }

        process.exit(1);
      }
    }

    console.log(`${colors.green}🎉 All migrations completed successfully!${colors.reset}`);
    console.log(`${colors.blue}📈 Total migrations executed: ${pendingMigrations.length}${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Migration runner failed:${colors.reset}`);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log(`${colors.green}✅ Migration process complete${colors.reset}`);
    process.exit(0);
  })
  .catch(error => {
    console.error(`${colors.red}❌ Unexpected error:${colors.reset}`, error);
    process.exit(1);
  });
