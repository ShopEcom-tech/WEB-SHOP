-- ============================================
-- Customer Info Table
-- Stockage des informations client au checkout
-- ============================================

CREATE TABLE IF NOT EXISTS customer_info (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    company VARCHAR(150),
    address VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(5) DEFAULT 'FR',
    project_details TEXT,
    newsletter BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    stripe_session_id VARCHAR(255),
    order_items JSON,
    subtotal DECIMAL(10,2),
    discount DECIMAL(10,2),
    tax DECIMAL(10,2),
    total DECIMAL(10,2),
    promo_code VARCHAR(50),
    status ENUM('pending', 'paid', 'cancelled', 'refunded') DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_stripe_session (stripe_session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
