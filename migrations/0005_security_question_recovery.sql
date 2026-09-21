ALTER TABLE users ADD COLUMN security_question_id TEXT;
ALTER TABLE users ADD COLUMN security_answer_hash TEXT;
ALTER TABLE users ADD COLUMN security_answer_salt TEXT;
ALTER TABLE users ADD COLUMN last_password_reset_at TEXT;

-- Email-code recovery is no longer used. Existing users can continue to sign in and change their
-- password; newly registered users must enrol a security question for account recovery.
DROP TABLE password_reset_tokens;
