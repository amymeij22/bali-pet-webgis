-- Tabel untuk menyimpan push notification subscriptions
-- Setiap user yang enable notification akan punya subscription entry

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata untuk tracking
  last_notified_batch_id UUID REFERENCES public.forecast_batches(id) ON DELETE SET NULL,
  last_notified_at TIMESTAMPTZ
);

-- Index untuk query aktif subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active 
ON public.push_subscriptions(is_active, created_at DESC)
WHERE is_active = TRUE;

-- Index untuk endpoint lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON public.push_subscriptions(endpoint);

-- Trigger untuk update updated_at
CREATE OR REPLACE FUNCTION public.set_push_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_subscriptions_set_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_set_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_push_subscription_updated_at();

-- Function untuk mendapatkan semua active subscriptions
CREATE OR REPLACE FUNCTION public.get_active_push_subscriptions()
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  user_agent TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    ps.user_agent
  FROM public.push_subscriptions ps
  WHERE ps.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;
