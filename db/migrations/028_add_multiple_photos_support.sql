-- Migration 028: Add Multiple Photos Support to Forum Posts
-- Changes photo_url (TEXT) to photo_urls (TEXT[]) to support multiple images

-- Add new photo_urls column
ALTER TABLE forum_posts 
ADD COLUMN photo_urls TEXT[];

-- Migrate existing photo_url data to photo_urls array
UPDATE forum_posts 
SET photo_urls = ARRAY[photo_url]
WHERE photo_url IS NOT NULL;

-- Drop old photo_url column
ALTER TABLE forum_posts 
DROP COLUMN photo_url;

-- Add index for photo_urls
CREATE INDEX idx_forum_posts_has_photos ON forum_posts((photo_urls IS NOT NULL AND array_length(photo_urls, 1) > 0));
