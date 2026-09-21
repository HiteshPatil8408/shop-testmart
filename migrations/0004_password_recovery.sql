ALTER TABLE password_reset_tokens ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE password_reset_tokens ADD COLUMN verified_at TEXT;
ALTER TABLE password_reset_tokens ADD COLUMN verification_token_hash TEXT;

CREATE UNIQUE INDEX idx_password_reset_verification_token
  ON password_reset_tokens(verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

CREATE INDEX idx_password_reset_user_created
  ON password_reset_tokens(user_id, created_at DESC);
