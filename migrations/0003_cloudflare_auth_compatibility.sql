UPDATE users
SET password_hash = 'BaBxTbqsCHALgCJMRjS94VYvca9aEDMTSC+fxwGKgv4=',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '50000000-0000-4000-8000-000000000001';

-- A new production signing secret invalidates existing cookies; remove their stale database rows.
DELETE FROM sessions;
