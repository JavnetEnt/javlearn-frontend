-- 005_add_course_thumbnail.sql
-- Adds an optional thumbnail image URL to courses.

ALTER TABLE courses ADD COLUMN thumbnail_url VARCHAR(1024);