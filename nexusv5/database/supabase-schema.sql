-- ============================================
-- Nexus Web Shop - Supabase Database Schema
-- PostgreSQL for Supabase
-- Version: 1.0
-- ============================================

-- ============================================
-- EXTENSION: UUID
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Extension de auth.users pour les données utilisateur
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    phone TEXT,
    company TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin', 'superadmin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Insertion automatique du profil" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLE: services
-- Les différentes offres de l'agence
-- ============================================
CREATE TABLE public.services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'starting_from')),
    category TEXT DEFAULT 'vitrine' CHECK (category IN ('vitrine', 'ecommerce', 'surmesure', 'maintenance', 'addon')),
    features JSONB DEFAULT '[]'::jsonb,
    max_pages INTEGER,
    max_products INTEGER,
    support_months INTEGER DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les services actifs
CREATE POLICY "Services publics visibles" 
    ON public.services FOR SELECT 
    USING (is_active = true);

-- ============================================
-- TABLE: orders
-- Commandes passées par les clients
-- ============================================
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    admin_notes TEXT,
    project_start_date DATE,
    project_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs propres commandes
CREATE POLICY "Utilisateurs voient leurs commandes" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs créent leurs commandes" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLE: order_items
-- Détails des services commandés
-- ============================================
CREATE TABLE public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    service_id INTEGER REFERENCES public.services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    custom_options JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient les items de leurs commandes
CREATE POLICY "Utilisateurs voient leurs order_items" 
    ON public.order_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Utilisateurs créent leurs order_items" 
    ON public.order_items FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- ============================================
-- TABLE: contacts
-- Messages de contact reçus
-- ============================================
CREATE TABLE public.contacts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    budget TEXT CHECK (budget IN ('1000-2000', '2000-4000', '4000-8000', '8000+')),
    service_interest TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'converted', 'archived')),
    admin_notes TEXT,
    replied_at TIMESTAMPTZ,
    source TEXT DEFAULT 'website',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut créer un contact
CREATE POLICY "Création de contact publique" 
    ON public.contacts FOR INSERT 
    WITH CHECK (true);

-- Les utilisateurs voient leurs propres contacts
CREATE POLICY "Utilisateurs voient leurs contacts" 
    ON public.contacts FOR SELECT 
    USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- TABLE: testimonials
-- Témoignages clients
-- ============================================
CREATE TABLE public.testimonials (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_company TEXT,
    client_role TEXT,
    client_avatar TEXT,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    project_type TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Témoignages approuvés visibles par tous
CREATE POLICY "Témoignages approuvés publics" 
    ON public.testimonials FOR SELECT 
    USING (is_approved = true);

-- ============================================
-- TABLE: projects
-- Projets en cours / portfolio
-- ============================================
CREATE TABLE public.projects (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    client_name TEXT,
    project_type TEXT DEFAULT 'vitrine' CHECK (project_type IN ('vitrine', 'ecommerce', 'surmesure', 'autre')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'published')),
    thumbnail TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    technologies JSONB DEFAULT '[]'::jsonb,
    url TEXT,
    is_portfolio BOOLEAN DEFAULT FALSE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    started_at DATE,
    completed_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs projets
CREATE POLICY "Utilisateurs voient leurs projets" 
    ON public.projects FOR SELECT 
    USING (auth.uid() = user_id OR is_portfolio = true);

-- ============================================
-- TABLE: invoices
-- Factures générées
-- ============================================
CREATE TABLE public.invoices (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 20.00,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    due_date DATE,
    paid_at TIMESTAMPTZ,
    pdf_path TEXT,
    notes TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_postal_code TEXT,
    billing_country TEXT DEFAULT 'France',
    billing_vat_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs factures
CREATE POLICY "Utilisateurs voient leurs factures" 
    ON public.invoices FOR SELECT 
    USING (auth.uid() = user_id);

-- ============================================
-- TABLE: newsletter_subscribers
-- Abonnés à la newsletter
-- ============================================
CREATE TABLE public.newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    source TEXT DEFAULT 'website'
);

-- Activer RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Inscription publique
CREATE POLICY "Inscription newsletter publique" 
    ON public.newsletter_subscribers FOR INSERT 
    WITH CHECK (true);

-- ============================================
-- TABLE: settings
-- Paramètres de l'application
-- ============================================
CREATE TABLE public.settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    type TEXT DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Paramètres publics visibles
CREATE POLICY "Paramètres publics visibles" 
    ON public.settings FOR SELECT 
    USING (is_public = true);

-- ============================================
-- FONCTIONS & TRIGGERS
-- ============================================

-- Fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at sur toutes les tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON public.testimonials
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour générer un numéro de commande
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'CMD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 4));
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Services (les 3 offres principales)
INSERT INTO public.services (name, slug, description, short_description, price, price_type, category, features, max_pages, max_products, support_months, is_popular, sort_order) VALUES
(
    'Site Vitrine',
    'site-vitrine',
    'Parfait pour présenter votre activité avec un site web professionnel et moderne.',
    'Parfait pour présenter votre activité',
    1500.00,
    'fixed',
    'vitrine',
    '["Design sur-mesure", "Jusqu''à 5 pages", "Responsive (mobile, tablette)", "Optimisation SEO de base", "Formulaire de contact", "Hébergement 1 an offert"]'::jsonb,
    5,
    NULL,
    12,
    FALSE,
    1
),
(
    'E-commerce',
    'e-commerce',
    'Lancez votre boutique en ligne avec toutes les fonctionnalités nécessaires pour vendre vos produits.',
    'Lancez votre boutique en ligne',
    3500.00,
    'fixed',
    'ecommerce',
    '["Tout du plan Vitrine", "Jusqu''à 100 produits", "Paiement sécurisé (Stripe)", "Gestion des stocks", "Tableau de bord admin", "Formation incluse", "Support prioritaire 6 mois"]'::jsonb,
    NULL,
    100,
    6,
    TRUE,
    2
),
(
    'Sur-mesure',
    'sur-mesure',
    'Solution personnalisée adaptée à vos besoins spécifiques avec des fonctionnalités uniques.',
    'Solution personnalisée à vos besoins',
    5000.00,
    'starting_from',
    'surmesure',
    '["Architecture personnalisée", "Fonctionnalités sur-mesure", "Intégrations API tierces", "Performances optimisées", "Accompagnement dédié", "Maintenance premium", "SLA garanti"]'::jsonb,
    NULL,
    NULL,
    12,
    FALSE,
    3
),
(
    'Maintenance Mensuelle',
    'maintenance-mensuelle',
    'Service de maintenance pour garder votre site à jour et sécurisé.',
    'Mises à jour et support technique',
    99.00,
    'fixed',
    'maintenance',
    '["Mises à jour régulières", "Sauvegardes automatiques", "Monitoring 24/7", "Support par email", "Corrections de bugs"]'::jsonb,
    NULL,
    NULL,
    1,
    FALSE,
    10
),
(
    'Pack SEO Avancé',
    'pack-seo-avance',
    'Optimisation SEO complète pour améliorer votre visibilité sur les moteurs de recherche.',
    'Boostez votre visibilité Google',
    800.00,
    'fixed',
    'addon',
    '["Audit SEO complet", "Optimisation on-page", "Stratégie de mots-clés", "Rapport mensuel", "Suivi des positions"]'::jsonb,
    NULL,
    NULL,
    0,
    FALSE,
    11
);

-- Paramètres par défaut
INSERT INTO public.settings (key, value, type, description, is_public) VALUES
('site_name', 'Web Shop - Agence Web Premium', 'string', 'Nom du site', TRUE),
('site_email', 'contact@webshop.fr', 'string', 'Email de contact principal', TRUE),
('site_phone', '+33 1 23 45 67 89', 'string', 'Téléphone de contact', TRUE),
('site_address', 'Paris, France', 'string', 'Adresse de l''agence', TRUE),
('tax_rate', '20', 'number', 'Taux de TVA (%)', FALSE),
('currency', 'EUR', 'string', 'Devise utilisée', FALSE);

-- Témoignages de démonstration
INSERT INTO public.testimonials (client_name, client_company, client_role, content, rating, project_type, is_featured, is_approved) VALUES
('Marie Dupont', 'TechCorp', 'CEO', 'Web Shop a transformé notre présence en ligne. Le site est magnifique et nos conversions ont augmenté de 150% !', 5, 'E-commerce', TRUE, TRUE),
('Jean Martin', 'StartupX', 'Fondateur', 'Un travail exceptionnel ! L''équipe est réactive et le résultat dépasse nos attentes.', 5, 'Site Vitrine', TRUE, TRUE),
('Sophie Laurent', 'InnovateCo', 'Directrice Marketing', 'Professionnalisme et créativité au rendez-vous. Je recommande vivement !', 5, 'Sur-mesure', FALSE, TRUE);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
