-- ============================================
-- Customer Info Table pour Supabase (PostgreSQL)
-- Stockage des informations client au checkout
-- ============================================

-- Créer la table customer_info
CREATE TABLE IF NOT EXISTS public.customer_info (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    address TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'FR',
    project_details TEXT,
    newsletter BOOLEAN DEFAULT FALSE,
    payment_method TEXT,
    stripe_session_id TEXT,
    order_items JSONB DEFAULT '[]'::jsonb,
    subtotal DECIMAL(10,2),
    discount DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    promo_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_customer_info_email ON public.customer_info(email);
CREATE INDEX IF NOT EXISTS idx_customer_info_status ON public.customer_info(status);
CREATE INDEX IF NOT EXISTS idx_customer_info_created_at ON public.customer_info(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_info_stripe_session ON public.customer_info(stripe_session_id);

-- Activer RLS (Row Level Security)
ALTER TABLE public.customer_info ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut insérer (pour le checkout public)
CREATE POLICY "Insertion publique customer_info" 
    ON public.customer_info FOR INSERT 
    WITH CHECK (true);

-- Policy: Les admins peuvent tout voir (à adapter selon tes besoins)
CREATE POLICY "Lecture publique customer_info" 
    ON public.customer_info FOR SELECT 
    USING (true);

-- Policy: Mise à jour publique (pour le webhook de paiement)
CREATE POLICY "Mise à jour publique customer_info" 
    ON public.customer_info FOR UPDATE 
    USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_customer_info_updated_at
    BEFORE UPDATE ON public.customer_info
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Fin du script
-- ============================================
