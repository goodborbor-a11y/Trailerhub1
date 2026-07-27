CREATE TABLE IF NOT EXISTS dead_city_google_play_purchases (
    purchase_token_hash CHAR(64) PRIMARY KEY,
    player_id VARCHAR(128) NOT NULL,
    product_id VARCHAR(132) NOT NULL,
    transaction_id VARCHAR(512) NOT NULL,
    blue_gems INTEGER NOT NULL CHECK (blue_gems >= 0),
    red_gems INTEGER NOT NULL CHECK (red_gems >= 0),
    state VARCHAR(16) NOT NULL DEFAULT 'VERIFIED',
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    verification_attempts INTEGER NOT NULL DEFAULT 1 CHECK (verification_attempts >= 1),
    grant_attempts INTEGER NOT NULL DEFAULT 0 CHECK (grant_attempts >= 0),
    consume_attempts INTEGER NOT NULL DEFAULT 0 CHECK (consume_attempts >= 0),
    last_error_category VARCHAR(64),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (state IN ('VERIFIED', 'GRANTED', 'CONSUMED', 'REFUNDED', 'VOIDED')),
    CHECK ((blue_gems > 0 AND red_gems = 0) OR (red_gems > 0 AND blue_gems = 0))
);

ALTER TABLE dead_city_google_play_purchases
    ADD COLUMN IF NOT EXISTS state VARCHAR(16) NOT NULL DEFAULT 'VERIFIED',
    ADD COLUMN IF NOT EXISTS granted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS grant_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS consume_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_error_category VARCHAR(64),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE dead_city_google_play_purchases
    ADD CONSTRAINT dead_city_purchase_state_check
    CHECK (state IN ('VERIFIED', 'GRANTED', 'CONSUMED', 'REFUNDED', 'VOIDED'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE dead_city_google_play_purchases
    ADD CONSTRAINT dead_city_purchase_attempts_check
    CHECK (verification_attempts >= 1 AND grant_attempts >= 0 AND consume_attempts >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_dead_city_purchases_player
    ON dead_city_google_play_purchases (player_id, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_dead_city_purchases_state
    ON dead_city_google_play_purchases (state, updated_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dead_city_purchases_transaction
    ON dead_city_google_play_purchases (transaction_id);
