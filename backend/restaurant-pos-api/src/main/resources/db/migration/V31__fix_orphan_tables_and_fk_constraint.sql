-- ============================================================
-- V31: Fix orphan tables left by buggy zone deletion
--      + ensure FK constraint exists (no ON DELETE CASCADE
--        since we validate business rules before deleting)
-- ============================================================

-- STEP 1: Soft-delete tables whose zone has already been soft-deleted
--         (orphan tables from previous buggy behavior)
UPDATE restaurant_tables rt
SET
    deleted_at = NOW(),
    is_active  = FALSE,
    updated_at = NOW()
WHERE
    rt.deleted_at IS NULL
    AND rt.zone_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM table_zones tz
        WHERE tz.id = rt.zone_id
          AND tz.deleted_at IS NOT NULL
    );

-- STEP 2: Log how many were fixed (informational, never fails)
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    SELECT count(*)
    INTO fixed_count
    FROM restaurant_tables rt
    WHERE rt.deleted_at IS NOT NULL
      AND rt.updated_at >= NOW() - INTERVAL '5 seconds';

    RAISE NOTICE '[V31] Orphan tables fixed: % rows soft-deleted', fixed_count;
END;
$$;

-- STEP 3: Verify FK constraint exists (it was already present in V1).
--         This is a safety guard — does nothing if already OK.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'restaurant_tables'
          AND kcu.column_name = 'zone_id'
    ) THEN
        ALTER TABLE restaurant_tables
            ADD CONSTRAINT fk_restaurant_tables_zone_id
            FOREIGN KEY (zone_id) REFERENCES table_zones(id);
        RAISE NOTICE '[V31] FK fk_restaurant_tables_zone_id yaratildi.';
    ELSE
        RAISE NOTICE '[V31] FK fk_restaurant_tables_zone_id allaqachon mavjud.';
    END IF;
END;
$$;
