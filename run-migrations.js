// Run database migrations
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const sql = neon(process.env.DATABASE_URL);

  const migrations = [
    {
      name: '018_create_forum_posts.sql',
      content: `
-- Migration 018: Create Forum Posts System
CREATE TYPE post_flair AS ENUM ('general', 'routes', 'questions', 'experiences', 'tips_advice');
CREATE TYPE forum_post_status AS ENUM ('visible', 'hidden', 'flagged');

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  body VARCHAR(2000) NOT NULL,
  flair post_flair NOT NULL DEFAULT 'general',
  location_tag VARCHAR(255),
  photo_url TEXT,
  upvotes INTEGER DEFAULT 0 NOT NULL,
  downvotes INTEGER DEFAULT 0 NOT NULL,
  comment_count INTEGER DEFAULT 0 NOT NULL,
  report_count INTEGER DEFAULT 0 NOT NULL,
  status forum_post_status DEFAULT 'visible' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX idx_forum_posts_flair ON forum_posts(flair);
CREATE INDEX idx_forum_posts_status ON forum_posts(status);
CREATE INDEX idx_forum_posts_created_at ON forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_popular ON forum_posts((upvotes - downvotes) DESC, created_at DESC);

CREATE TABLE forum_post_votes (
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX idx_forum_post_votes_post_id ON forum_post_votes(post_id);
CREATE INDEX idx_forum_post_votes_user_id ON forum_post_votes(user_id);

CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION check_forum_post_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.upvotes - NEW.downvotes) < -10 AND NEW.status = 'visible' THEN
    NEW.status := 'hidden';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_hide_forum_posts
BEFORE UPDATE ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION check_forum_post_votes();
`
    },
    {
      name: '019_create_forum_comments.sql',
      content: `
-- Migration 019: Create Forum Comments System
CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content VARCHAR(300) NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  depth INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT max_comment_depth CHECK (depth <= 1)
);

CREATE INDEX idx_forum_comments_post_id ON forum_comments(post_id);
CREATE INDEX idx_forum_comments_author_id ON forum_comments(author_id);
CREATE INDEX idx_forum_comments_parent_id ON forum_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_forum_comments_created_at ON forum_comments(created_at DESC);
CREATE INDEX idx_forum_comments_post_popular ON forum_comments(post_id, likes DESC, created_at DESC);

CREATE TABLE forum_comment_likes (
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_forum_comment_likes_comment_id ON forum_comment_likes(comment_id);
CREATE INDEX idx_forum_comment_likes_user_id ON forum_comment_likes(user_id);

CREATE TRIGGER update_forum_comments_updated_at
BEFORE UPDATE ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_forum_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_count
AFTER INSERT OR DELETE ON forum_comments
FOR EACH ROW
EXECUTE FUNCTION update_forum_post_comment_count();
`
    },
    {
      name: '020_create_reports.sql',
      content: `
-- Migration 020: Create Reports System
CREATE TYPE report_content_type AS ENUM ('forum_post', 'forum_comment', 'map_tip');
CREATE TYPE report_reason AS ENUM ('spam', 'false_info', 'harassment', 'inappropriate', 'outdated');

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type report_content_type NOT NULL,
  content_id UUID NOT NULL,
  reason report_reason NOT NULL,
  additional_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE (reporter_id, content_type, content_id)
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_content ON reports(content_type, content_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

CREATE OR REPLACE FUNCTION update_forum_post_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.content_type = 'forum_post' THEN
    UPDATE forum_posts
    SET report_count = report_count + 1,
        status = CASE WHEN report_count + 1 >= 5 THEN 'flagged' ELSE status END
    WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' AND OLD.content_type = 'forum_post' THEN
    UPDATE forum_posts SET report_count = report_count - 1 WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_report_count
AFTER INSERT OR DELETE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_forum_post_report_count();
`
    }
  ];

  console.log('Starting migrations...\n');

  for (const migration of migrations) {
    console.log(`Running ${migration.name}...`);
    try {
      // Check if tables already exist
      const checkQuery = migration.name.includes('forum_posts')
        ? `SELECT to_regclass('public.forum_posts')`
        : migration.name.includes('forum_comments')
        ? `SELECT to_regclass('public.forum_comments')`
        : `SELECT to_regclass('public.reports')`;

      const exists = await sql`SELECT to_regclass('public.' || ${migration.name.split('_')[2]})`;

      if (exists[0]?.to_regclass) {
        console.log(`  ⚠️  Tables from ${migration.name} already exist, skipping...`);
        continue;
      }

      // Run migration
      await sql.unsafe(migration.content);
      console.log(`  ✅ ${migration.name} completed successfully`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⚠️  ${migration.name} already applied, skipping...`);
      } else {
        console.error(`  ❌ Error in ${migration.name}:`, error.message);
        throw error;
      }
    }
  }

  console.log('\n✅ All migrations completed!');
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
