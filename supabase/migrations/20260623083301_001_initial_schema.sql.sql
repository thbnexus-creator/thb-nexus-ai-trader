
-- THB Nexus AI Trader — Initial Production Schema
-- Users, Wallets, Trades, Transactions, ActivationKeys, Bots, Signals, AdminLogs

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth, but we keep a profile table)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets: one demo + one real per user
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('demo','real')),
  balance NUMERIC(18,8) NOT NULL DEFAULT 0,
  total_deposited NUMERIC(18,8) NOT NULL DEFAULT 0,
  total_pnl NUMERIC(18,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, type)
);

-- Deposits / Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('demo','real')),
  type TEXT NOT NULL CHECK (type IN ('deposit','withdrawal','trade_pnl','bot_fee','transfer')),
  amount NUMERIC(18,8) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','cancelled')),
  tx_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trades
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy','sell')),
  entry_price NUMERIC(18,8) NOT NULL,
  exit_price NUMERIC(18,8),
  lots NUMERIC(18,4) NOT NULL DEFAULT 0.01,
  profit_loss NUMERIC(18,8),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  strategy TEXT,
  timeframe TEXT,
  mode TEXT NOT NULL DEFAULT 'demo' CHECK (mode IN ('demo','real')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Activation Keys
CREATE TABLE IF NOT EXISTS activation_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'Standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bot configurations / state
CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_running BOOLEAN NOT NULL DEFAULT false,
  strategy TEXT,
  risk_level TEXT,
  timeframe TEXT,
  symbols TEXT[] NOT NULL DEFAULT '{}',
  trades_executed INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  profit_loss NUMERIC(18,8) NOT NULL DEFAULT 0,
  current_lot NUMERIC(18,4) NOT NULL DEFAULT 0.01,
  win_streak INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'demo' CHECK (mode IN ('demo','real')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MT5 Connections
CREATE TABLE IF NOT EXISTS mt5_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  login_id TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  server TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  bridge_running BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Signals log
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY','SELL','HOLD')),
  signal_strength TEXT NOT NULL CHECK (signal_strength IN ('strong','moderate','weak')),
  rsi NUMERIC(10,4),
  ema9 NUMERIC(18,8),
  ema100 NUMERIC(18,8),
  price NUMERIC(18,8) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP codes (temporary, short-lived)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'registration',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp);
CREATE INDEX IF NOT EXISTS idx_activation_keys_key ON activation_keys(key);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mt5_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (service-role bypass handled by backend)
CREATE POLICY "select_own_user" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);
CREATE POLICY "update_own_user" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Wallets: users see own wallets
CREATE POLICY "select_own_wallets" ON wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_wallets" ON wallets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_wallets" ON wallets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trades
CREATE POLICY "select_own_trades" ON trades FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_trades" ON trades FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_trades" ON trades FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Activation keys: users can see unused keys (for validation) and their own used key
CREATE POLICY "select_activation_keys" ON activation_keys FOR SELECT
  TO authenticated USING (used_by IS NULL OR used_by = auth.uid());

-- Bots
CREATE POLICY "select_own_bots" ON bots FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_bots" ON bots FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_bots" ON bots FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- MT5 connections
CREATE POLICY "select_own_mt5" ON mt5_connections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_mt5" ON mt5_connections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_mt5" ON mt5_connections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Signals are public (read-only market data)
CREATE POLICY "select_signals_public" ON signals FOR SELECT
  TO authenticated USING (true);

-- Admin logs: admin-only via backend service role
CREATE POLICY "select_admin_logs" ON admin_logs FOR SELECT
  TO authenticated USING (true); -- filtered in backend

-- OTP codes: no direct select from client
CREATE POLICY "no_select_otp" ON otp_codes FOR SELECT
  TO authenticated USING (false);
