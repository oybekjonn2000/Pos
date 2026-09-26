-- ============================================================================
-- V46: Add canvas layout fields to restaurant_tables and table_zones
-- Enables Visual Canvas Constructor for floor plan management
-- ============================================================================

-- 1. Add rotation field to restaurant_tables (degrees: 0, 45, 90, 135, 180, 225, 270, 315)
ALTER TABLE restaurant_tables
    ADD COLUMN IF NOT EXISTS rotation INTEGER NOT NULL DEFAULT 0;

-- 2. Add canvas dimensions to table_zones (defines the floor plan canvas size for each zone)
ALTER TABLE table_zones
    ADD COLUMN IF NOT EXISTS canvas_width INTEGER NOT NULL DEFAULT 1200;

ALTER TABLE table_zones
    ADD COLUMN IF NOT EXISTS canvas_height INTEGER NOT NULL DEFAULT 800;

-- 3. Add table_type field for visual distinction (rectangle, circle, booth, bar, custom)
ALTER TABLE restaurant_tables
    ADD COLUMN IF NOT EXISTS table_type VARCHAR(30) NOT NULL DEFAULT 'rectangle';

-- 4. Index for layout queries (zone-based canvas load)
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone_layout
    ON restaurant_tables(zone_id, pos_x, pos_y) WHERE deleted_at IS NULL;
