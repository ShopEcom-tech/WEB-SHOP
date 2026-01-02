-- ============================================
-- Nexus Web Shop - Database Schema
-- Version: 1.0
-- Date: 2026-01-02
-- ============================================

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS nexus_webshop
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE nexus_webshop;

-- ============================================
-- TABLE: users
-- Gestion des utilisateurs et clients
-- ============================================
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    role ENUM('client', 'admin', 'superadmin') DEFAULT 'client',
    email_verified_at DATETIME,
    remember_token VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: services
-- Les différentes offres de l'agence
-- ============================================
CREATE TABLE services (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    price_type ENUM('fixed', 'starting_from') DEFAULT 'fixed',
    category ENUM('vitrine', 'ecommerce', 'surmesure', 'maintenance', 'addon') DEFAULT 'vitrine',
    features JSON,
    max_pages INT,
    max_products INT,
    support_months INT DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: orders
-- Commandes passées par les clients
-- ============================================
CREATE TABLE orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    final_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'partial', 'refunded', 'failed') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    notes TEXT,
    admin_notes TEXT,
    project_start_date DATE,
    project_end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_number (order_number)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: order_items
-- Détails des services commandés
-- ============================================
CREATE TABLE order_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    service_id INT UNSIGNED,
    service_name VARCHAR(100) NOT NULL,
    quantity INT UNSIGNED DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    custom_options JSON,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    INDEX idx_order_id (order_id),
    INDEX idx_service_id (service_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: contacts
-- Messages de contact reçus
-- ============================================
CREATE TABLE contacts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    budget ENUM('1000-2000', '2000-4000', '4000-8000', '8000+') DEFAULT NULL,
    service_interest VARCHAR(100),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'converted', 'archived') DEFAULT 'new',
    admin_notes TEXT,
    replied_at DATETIME,
    replied_by INT UNSIGNED,
    source VARCHAR(50) DEFAULT 'website',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: testimonials
-- Témoignages clients
-- ============================================
CREATE TABLE testimonials (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED,
    client_name VARCHAR(100) NOT NULL,
    client_company VARCHAR(100),
    client_role VARCHAR(100),
    client_avatar VARCHAR(255),
    content TEXT NOT NULL,
    rating TINYINT UNSIGNED DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    project_type VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: projects
-- Projets en cours / portfolio
-- ============================================
CREATE TABLE projects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED,
    user_id INT UNSIGNED,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    client_name VARCHAR(100),
    project_type ENUM('vitrine', 'ecommerce', 'surmesure', 'autre') DEFAULT 'vitrine',
    status ENUM('draft', 'in_progress', 'review', 'completed', 'published') DEFAULT 'draft',
    thumbnail VARCHAR(255),
    images JSON,
    technologies JSON,
    url VARCHAR(255),
    is_portfolio BOOLEAN DEFAULT FALSE,
    completion_percentage INT UNSIGNED DEFAULT 0,
    started_at DATE,
    completed_at DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_is_portfolio (is_portfolio)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: invoices
-- Factures générées
-- ============================================
CREATE TABLE invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED,
    invoice_number VARCHAR(20) NOT NULL UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 20.00,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    due_date DATE,
    paid_at DATETIME,
    pdf_path VARCHAR(255),
    notes TEXT,
    billing_name VARCHAR(100),
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100) DEFAULT 'France',
    billing_vat_number VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: newsletter_subscribers
-- Abonnés à la newsletter
-- ============================================
CREATE TABLE newsletter_subscribers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100),
    status ENUM('active', 'unsubscribed', 'bounced') DEFAULT 'active',
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME,
    source VARCHAR(50) DEFAULT 'website',
    
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ============================================
-- TABLE: settings
-- Paramètres de l'application
-- ============================================
CREATE TABLE settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLE: activity_logs
-- Journal d'activité
-- ============================================
CREATE TABLE activity_logs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT UNSIGNED,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ============================================
-- INSERTION DES DONNÉES INITIALES
-- ============================================

-- Admin par défaut (mot de passe: Admin123!)
INSERT INTO users (email, password_hash, name, role, email_verified_at) VALUES
('admin@nexus-agency.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur', 'superadmin', NOW());

-- Services (les 3 offres principales)
INSERT INTO services (name, slug, description, short_description, price, price_type, category, features, max_pages, max_products, support_months, is_popular, sort_order) VALUES
(
    'Site Vitrine',
    'site-vitrine',
    'Parfait pour présenter votre activité avec un site web professionnel et moderne.',
    'Parfait pour présenter votre activité',
    1500.00,
    'fixed',
    'vitrine',
    '["Design sur-mesure", "Jusqu''à 5 pages", "Responsive (mobile, tablette)", "Optimisation SEO de base", "Formulaire de contact", "Hébergement 1 an offert"]',
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
    '["Tout du plan Vitrine", "Jusqu''à 100 produits", "Paiement sécurisé (Stripe)", "Gestion des stocks", "Tableau de bord admin", "Formation incluse", "Support prioritaire 6 mois"]',
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
    '["Architecture personnalisée", "Fonctionnalités sur-mesure", "Intégrations API tierces", "Performances optimisées", "Accompagnement dédié", "Maintenance premium", "SLA garanti"]',
    NULL,
    NULL,
    12,
    FALSE,
    3
);

-- Services additionnels
INSERT INTO services (name, slug, description, short_description, price, price_type, category, features, is_popular, sort_order) VALUES
(
    'Maintenance Mensuelle',
    'maintenance-mensuelle',
    'Service de maintenance pour garder votre site à jour et sécurisé.',
    'Mises à jour et support technique',
    99.00,
    'fixed',
    'maintenance',
    '["Mises à jour régulières", "Sauvegardes automatiques", "Monitoring 24/7", "Support par email", "Corrections de bugs"]',
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
    '["Audit SEO complet", "Optimisation on-page", "Stratégie de mots-clés", "Rapport mensuel", "Suivi des positions"]',
    FALSE,
    11
);

-- Paramètres par défaut
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'Nexus - Agence Web Premium', 'string', 'Nom du site', TRUE),
('site_email', 'contact@nexus-agency.fr', 'string', 'Email de contact principal', TRUE),
('site_phone', '+33 1 23 45 67 89', 'string', 'Téléphone de contact', TRUE),
('site_address', 'Paris, France', 'string', 'Adresse de l''agence', TRUE),
('tax_rate', '20', 'number', 'Taux de TVA (%)', FALSE),
('currency', 'EUR', 'string', 'Devise utilisée', FALSE),
('invoice_prefix', 'NX', 'string', 'Préfixe des numéros de facture', FALSE),
('order_prefix', 'CMD', 'string', 'Préfixe des numéros de commande', FALSE);

-- Témoignages de démonstration
INSERT INTO testimonials (client_name, client_company, client_role, content, rating, project_type, is_featured, is_approved) VALUES
('Marie Dupont', 'TechCorp', 'CEO', 'Nexus a transformé notre présence en ligne. Le site est magnifique et nos conversions ont augmenté de 150% !', 5, 'E-commerce', TRUE, TRUE),
('Jean Martin', 'StartupX', 'Fondateur', 'Un travail exceptionnel ! L''équipe est réactive et le résultat dépasse nos attentes.', 5, 'Site Vitrine', TRUE, TRUE),
('Sophie Laurent', 'InnovateCo', 'Directrice Marketing', 'Professionnalisme et créativité au rendez-vous. Je recommande vivement !', 5, 'Sur-mesure', FALSE, TRUE);

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue des commandes avec informations client
CREATE VIEW v_orders_with_clients AS
SELECT 
    o.id,
    o.order_number,
    o.total_amount,
    o.final_amount,
    o.status,
    o.payment_status,
    o.created_at,
    u.name AS client_name,
    u.email AS client_email,
    u.company AS client_company
FROM orders o
LEFT JOIN users u ON o.user_id = u.id;

-- Vue des statistiques mensuelles
CREATE VIEW v_monthly_stats AS
SELECT 
    YEAR(created_at) AS year,
    MONTH(created_at) AS month,
    COUNT(*) AS total_orders,
    SUM(final_amount) AS total_revenue,
    AVG(final_amount) AS avg_order_value
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY YEAR(created_at), MONTH(created_at);

-- ============================================
-- FIN DU SCRIPT
-- ============================================
