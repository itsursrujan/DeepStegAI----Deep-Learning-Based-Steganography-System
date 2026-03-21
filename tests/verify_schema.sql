-- Schema Verification Queries

-- 1. Check ENUM types
SELECT n.nspname as schema, t.typname as type 
FROM pg_type t 
JOIN pg_namespace n ON n.oid = t.typnamespace 
WHERE t.typtype = 'e';

-- 2. Check Table Structures
SELECT table_name, column_name, data_type, is_nullable 
FROM information_path.columns 
WHERE table_name IN ('files', 'credit_transactions', 'analysis_results')
ORDER BY table_name, ordinal_position;

-- 3. Check JSONB usage in analysis_results
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analysis_results' AND column_name = 'static_details';

-- 4. Verify ON DELETE CASCADE
SELECT
    tc.table_name, kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name, 
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('files', 'credit_transactions', 'analysis_results');
