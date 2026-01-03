/* ========================================
   WEB SHOP - CART MANAGEMENT
   ======================================== */

// Products data
const PRODUCTS = {
    // Sites Web
    'vitrine': {
        id: 'vitrine',
        name: 'Site Vitrine',
        description: 'Parfait pour présenter votre activité',
        price: 199,
        features: ['Design sur-mesure', 'Jusqu\'à 5 pages', 'Responsive', 'SEO de base', 'Formulaire de contact', 'Hébergement 1 an offert'],
        icon: '🌐',
        category: 'sites'
    },
    'ecommerce': {
        id: 'ecommerce',
        name: 'E-commerce',
        description: 'Lancez votre boutique en ligne',
        price: 399,
        features: ['Tout du plan Vitrine', 'Jusqu\'à 100 produits', 'Paiement sécurisé', 'Gestion des stocks', 'Tableau de bord admin', 'Support prioritaire 6 mois'],
        icon: '🛍️',
        popular: true,
        category: 'sites'
    },
    'surmesure': {
        id: 'surmesure',
        name: 'Sur-mesure',
        description: 'Solution personnalisée à vos besoins',
        price: 799,
        features: ['Architecture personnalisée', 'Fonctionnalités sur-mesure', 'Intégrations API', 'Performances optimisées', 'Accompagnement dédié', 'Maintenance premium'],
        icon: '⚡',
        customPrice: true,
        category: 'sites'
    },
    // Applications
    'app-basic': {
        id: 'app-basic',
        name: 'App Essentielle',
        description: 'Idéale pour lancer votre projet',
        price: 299,
        features: ['Application mobile ou web', 'Jusqu\'à 5 fonctionnalités', 'Design moderne', 'Authentification', 'Base de données', 'Support 3 mois'],
        icon: '📱',
        category: 'apps'
    },
    'app-pro': {
        id: 'app-pro',
        name: 'App Pro',
        description: 'Pour les projets ambitieux',
        price: 599,
        features: ['Tout de l\'App Essentielle', 'E-learning / Quiz', 'Tableau de bord admin', 'Notifications push', 'Paiement Stripe', 'Formation + Support 6 mois'],
        icon: '🚀',
        popular: true,
        category: 'apps'
    },
    'app-enterprise': {
        id: 'app-enterprise',
        name: 'App Sur-Mesure',
        description: 'Solution 100% personnalisée',
        price: 999,
        features: ['Analyse concurrentielle', 'Fonctionnalités illimitées', 'Intégrations API', 'Intelligence artificielle', 'Publication stores', 'Maintenance 1 an'],
        icon: '💎',
        customPrice: true,
        category: 'apps'
    }
};

// Promo codes
const PROMO_CODES = {
    'WELCOME10': { discount: 0.10, description: '10% de réduction' },
    'LAUNCH20': { discount: 0.20, description: '20% de réduction' },
    'VIP25': { discount: 0.25, description: '25% de réduction' }
};

// Cart class
class Cart {
    constructor() {
        this.items = this.loadCart();
        this.promoCode = this.loadPromoCode();
        this.init();
    }

    init() {
        this.updateCartCount();
        this.renderCart();
        this.setupEventListeners();
    }

    // Local Storage
    loadCart() {
        const cart = localStorage.getItem('webshop_cart');
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem('webshop_cart', JSON.stringify(this.items));
        this.updateCartCount();
    }

    loadPromoCode() {
        return localStorage.getItem('webshop_promo') || null;
    }

    savePromoCode(code) {
        this.promoCode = code;
        if (code) {
            localStorage.setItem('webshop_promo', code);
        } else {
            localStorage.removeItem('webshop_promo');
        }
    }

    // Cart operations
    addItem(productId, quantity = 1) {
        const product = PRODUCTS[productId];
        if (!product) return false;

        const existingItem = this.items.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: productId,
                quantity: quantity
            });
        }

        this.saveCart();
        this.renderCart();
        this.showNotification(`${product.name} ajouté au panier !`);
        return true;
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
        this.renderCart();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.renderCart();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.promoCode = null;
        this.saveCart();
        localStorage.removeItem('webshop_promo');
        this.renderCart();
    }

    // Calculations
    getSubtotal() {
        return this.items.reduce((total, item) => {
            const product = PRODUCTS[item.id];
            return total + (product ? product.price * item.quantity : 0);
        }, 0);
    }

    getDiscount() {
        if (this.promoCode && PROMO_CODES[this.promoCode]) {
            return this.getSubtotal() * PROMO_CODES[this.promoCode].discount;
        }
        return 0;
    }

    getTax() {
        return (this.getSubtotal() - this.getDiscount()) * 0.20;
    }

    getTotal() {
        return this.getSubtotal() - this.getDiscount() + this.getTax();
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    // Apply promo code
    applyPromoCode(code) {
        const upperCode = code.toUpperCase().trim();
        if (PROMO_CODES[upperCode]) {
            this.savePromoCode(upperCode);
            this.renderCart();
            return { success: true, message: PROMO_CODES[upperCode].description + ' appliquée !' };
        }
        return { success: false, message: 'Code promo invalide' };
    }

    removePromoCode() {
        this.savePromoCode(null);
        this.renderCart();
    }

    // UI Updates
    updateCartCount() {
        const count = this.getItemCount();
        const countElements = document.querySelectorAll('.cart-count, .cart-count-mobile');
        countElements.forEach(el => {
            el.textContent = count;
        });
    }

    renderCart() {
        const cartContent = document.getElementById('cart-content');
        const emptyCart = document.getElementById('empty-cart');
        const cartItemsList = document.getElementById('cart-items-list');

        if (!cartContent || !emptyCart) return;

        if (this.items.length === 0) {
            cartContent.style.display = 'none';
            emptyCart.style.display = 'block';
            return;
        }

        cartContent.style.display = 'grid';
        emptyCart.style.display = 'none';

        if (cartItemsList) {
            cartItemsList.innerHTML = this.items.map(item => {
                const product = PRODUCTS[item.id];
                if (!product) return '';

                return `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-icon">${product.icon}</div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">${product.name}</h4>
                            <p class="cart-item-description">${product.description}</p>
                            <ul class="cart-item-features">
                                ${product.features.slice(0, 3).map(f => `<li>✓ ${f}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="cart-item-actions">
                            <div class="cart-item-quantity">
                                <button class="qty-btn qty-minus" data-id="${item.id}">-</button>
                                <span class="qty-value">${item.quantity}</span>
                                <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                            </div>
                            <div class="cart-item-price">${this.formatPrice(product.price * item.quantity)}</div>
                            <button class="cart-item-remove" data-id="${item.id}">🗑️</button>
                        </div>
                    </div>
                `;
            }).join('');

            // Add event listeners
            this.setupCartItemListeners();
        }

        // Update summary
        this.updateSummary();
    }

    updateSummary() {
        const subtotalEl = document.getElementById('cart-subtotal');
        const taxEl = document.getElementById('cart-tax');
        const totalEl = document.getElementById('cart-total');

        if (subtotalEl) subtotalEl.textContent = this.formatPrice(this.getSubtotal());
        if (taxEl) taxEl.textContent = this.formatPrice(this.getTax());
        if (totalEl) totalEl.textContent = this.formatPrice(this.getTotal());
    }

    setupCartItemListeners() {
        // Quantity buttons
        document.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const item = this.items.find(i => i.id === id);
                if (item) this.updateQuantity(id, item.quantity - 1);
            });
        });

        document.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const item = this.items.find(i => i.id === id);
                if (item) this.updateQuantity(id, item.quantity + 1);
            });
        });

        // Remove buttons
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                this.removeItem(id);
            });
        });
    }

    setupEventListeners() {
        // Add to cart buttons on offers page
        document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = e.target.dataset.addToCart;
                this.addItem(productId);
            });
        });
    }

    // Helpers
    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(price);
    }

    showNotification(message) {
        // Create notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <span class="notification-icon">✓</span>
            <span class="notification-text">${message}</span>
        `;
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize cart
const cart = new Cart();

// Make cart available globally
window.cart = cart;

// Add notification styles dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .cart-notification {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 40px rgba(124, 58, 237, 0.4);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 9999;
    }
    .cart-notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    .notification-icon {
        font-size: 20px;
    }
    .notification-text {
        font-weight: 500;
    }
`;
document.head.appendChild(notificationStyles);
