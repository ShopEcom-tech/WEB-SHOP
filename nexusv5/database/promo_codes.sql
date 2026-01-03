-- ========================================
-- PROMO CODES TABLE - Supabase Schema
-- ========================================
-- Ce script ajoute une table pour gérer les codes promotionnels
-- de manière sécurisée côté serveur

-- Créer la table promo_codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire les codes actifs (pour validation)
CREATE POLICY "Anyone can validate promo codes" ON public.promo_codes
    FOR SELECT
    USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Seuls les admins peuvent modifier
CREATE POLICY "Only admins can manage promo codes" ON public.promo_codes
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger pour updated_at
CREATE OR REPLACE TRIGGER update_promo_codes_updated_at
    BEFORE UPDATE ON public.promo_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- DONNÉES INITIALES - Migration des codes existants
-- ========================================
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, is_active)
VALUES 
    ('WELCOME10', 'Code de bienvenue - 10% de réduction', 'percentage', 10, true),
    ('LAUNCH20', 'Promo lancement - 20% de réduction', 'percentage', 20, true),
    ('VIP25', 'Réduction VIP - 25% de réduction', 'percentage', 25, true)
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- FONCTION DE VALIDATION - Edge Function
-- ========================================
-- Cette fonction peut être appelée depuis le frontend pour valider un code

-- Créer une fonction PostgreSQL pour valider les codes
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code VARCHAR, p_cart_total DECIMAL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_promo RECORD;
    v_discount DECIMAL;
BEGIN
    -- Chercher le code
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE UPPER(code) = UPPER(p_code)
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until > NOW())
      AND (max_uses IS NULL OR current_uses < max_uses)
      AND p_cart_total >= min_purchase;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Code promo invalide ou expiré'
        );
    END IF;

    -- Calculer la réduction
    IF v_promo.discount_type = 'percentage' THEN
        v_discount := p_cart_total * (v_promo.discount_value / 100);
    ELSE
        v_discount := v_promo.discount_value;
    END IF;

    -- Mettre à jour le compteur d'utilisation
    UPDATE public.promo_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_promo.id;

    RETURN json_build_object(
        'valid', true,
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'discount_amount', v_discount,
        'description', v_promo.description
    );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.validate_promo_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code TO anon;
