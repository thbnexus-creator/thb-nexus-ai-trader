
-- Seed admin user and helper functions

-- Insert admin user (id will be set by auth trigger later; using fixed UUID for seed)
INSERT INTO users (id, email, name, is_admin, is_verified, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin@thbnexus.local', 'System Admin', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Function to create demo wallet on user insert
CREATE OR REPLACE FUNCTION create_demo_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, type, balance)
  VALUES (NEW.id, 'demo', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_demo_wallet
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_demo_wallet();

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_flag BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_flag FROM users WHERE id = user_uuid LIMIT 1;
  RETURN COALESCE(admin_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
