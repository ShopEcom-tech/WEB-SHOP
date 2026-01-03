/* ========================================
   WEB SHOP - CHECKOUT MANAGEMENT
   ======================================== */

document.addEventListener('DOMContentLoaded', async function () {

    // Check if we're on checkout page
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    // Check if user is logged in before allowing checkout
    const isLoggedIn = await checkUserAuthentication();
    if (!isLoggedIn) {
        // Save current URL for redirect after login
        sessionStorage.setItem('auth_redirect', 'checkout.html');
        // Redirect to login page
        alert('Vous devez être connecté pour procéder au paiement.');
        window.location.href = 'login.html';
        return;
    }

    // Check if cart is empty
    if (!window.cart || window.cart.items.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    // Initialize checkout
    initCheckout();

    function initCheckout() {
        renderCheckoutItems();
        updateCheckoutSummary();
        setupPromoCode();
        setupFormValidation();
    }

    // Render items in checkout sidebar
    function renderCheckoutItems() {
        const checkoutItems = document.getElementById('checkout-items');
        if (!checkoutItems) return;

        checkoutItems.innerHTML = window.cart.items.map(item => {
            const product = PRODUCTS[item.id];
            if (!product) return '';

            return `
                <div class="checkout-item">
                    <div class="checkout-item-icon">${product.icon}</div>
                    <div class="checkout-item-info">
                        <span class="checkout-item-name">${product.name}</span>
                        <span class="checkout-item-qty">x${item.quantity}</span>
                    </div>
                    <span class="checkout-item-price">${window.cart.formatPrice(product.price * item.quantity)}</span>
                </div>
            `;
        }).join('');
    }

    // Update summary totals
    function updateCheckoutSummary() {
        const subtotalEl = document.getElementById('checkout-subtotal');
        const discountRow = document.getElementById('discount-row');
        const discountEl = document.getElementById('checkout-discount');
        const taxEl = document.getElementById('checkout-tax');
        const totalEl = document.getElementById('checkout-total');
        const mobileTotal = document.getElementById('mobile-total');

        if (subtotalEl) subtotalEl.textContent = window.cart.formatPrice(window.cart.getSubtotal());

        // Show discount if promo applied
        const discount = window.cart.getDiscount();
        if (discount > 0 && discountRow && discountEl) {
            discountRow.style.display = 'flex';
            discountEl.textContent = '-' + window.cart.formatPrice(discount);
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        if (taxEl) taxEl.textContent = window.cart.formatPrice(window.cart.getTax());
        if (totalEl) totalEl.textContent = window.cart.formatPrice(window.cart.getTotal());
        if (mobileTotal) mobileTotal.textContent = window.cart.formatPrice(window.cart.getTotal());
    }

    // Promo code
    function setupPromoCode() {
        const promoInput = document.getElementById('promoCode');
        const applyBtn = document.getElementById('applyPromo');
        const promoMessage = document.getElementById('promo-message');

        if (applyBtn && promoInput) {
            applyBtn.addEventListener('click', () => {
                const code = promoInput.value;
                const result = window.cart.applyPromoCode(code);

                if (promoMessage) {
                    promoMessage.textContent = result.message;
                    promoMessage.className = 'promo-message ' + (result.success ? 'success' : 'error');
                }

                if (result.success) {
                    updateCheckoutSummary();
                }
            });

            // Also apply on Enter
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    applyBtn.click();
                }
            });
        }

        // Show existing promo if applied
        if (window.cart.promoCode && PROMO_CODES[window.cart.promoCode]) {
            if (promoInput) promoInput.value = window.cart.promoCode;
            if (promoMessage) {
                promoMessage.textContent = PROMO_CODES[window.cart.promoCode].description + ' appliquée !';
                promoMessage.className = 'promo-message success';
            }
        }
    }

    // Card input formatting
    function setupCardFormatting() {
        const cardNumber = document.getElementById('cardNumber');
        const cardExpiry = document.getElementById('cardExpiry');

        if (cardNumber) {
            cardNumber.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = value.substring(0, 19);
            });
        }

        if (cardExpiry) {
            cardExpiry.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
    }

    // Form validation and submission
    function setupFormValidation() {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate form
            if (!checkoutForm.checkValidity()) {
                checkoutForm.reportValidity();
                return;
            }

            // Check terms
            const terms = document.getElementById('terms');
            if (!terms.checked) {
                alert('Veuillez accepter les Conditions Générales de Vente');
                return;
            }

            // Get form data
            const formData = new FormData(checkoutForm);
            const orderData = {
                customer: {
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    email: formData.get('email'),
                    phone: formData.get('phone'),
                    company: formData.get('company')
                },
                billing: {
                    address: formData.get('address'),
                    postalCode: formData.get('postalCode'),
                    city: formData.get('city'),
                    country: formData.get('country')
                },
                payment: {
                    method: formData.get('paymentMethod')
                },
                items: window.cart.items,
                subtotal: window.cart.getSubtotal(),
                discount: window.cart.getDiscount(),
                tax: window.cart.getTax(),
                total: window.cart.getTotal(),
                promoCode: window.cart.promoCode,
                projectDetails: formData.get('projectDetails'),
                newsletter: formData.get('newsletter') === 'on'
            };

            // Simulate payment processing
            await processPayment(orderData);
        });
    }

    // Process payment with Stripe Checkout
    async function processPayment(orderData) {
        const submitBtns = document.querySelectorAll('.btn-checkout-submit');

        // Show loading state
        submitBtns.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Enregistrement en cours...';
        });

        try {
            // ====================================
            // 1. Sauvegarder les infos client dans Supabase
            // ====================================
            console.log('📝 Sauvegarde des informations client dans Supabase...');

            let customerId = null;

            if (window.supabaseClient) {
                const customerData = {
                    first_name: orderData.customer.firstName,
                    last_name: orderData.customer.lastName,
                    email: orderData.customer.email,
                    phone: orderData.customer.phone || null,
                    company: orderData.customer.company || null,
                    address: orderData.billing.address,
                    postal_code: orderData.billing.postalCode,
                    city: orderData.billing.city,
                    country: orderData.billing.country,
                    project_details: orderData.projectDetails || null,
                    newsletter: orderData.newsletter || false,
                    payment_method: orderData.payment?.method || 'stripe_checkout',
                    order_items: orderData.items,
                    subtotal: orderData.subtotal,
                    discount: orderData.discount,
                    tax: orderData.tax,
                    total: orderData.total,
                    promo_code: orderData.promoCode || null,
                    status: 'pending'
                };

                const { data, error } = await window.supabaseClient
                    .from('customer_info')
                    .insert([customerData])
                    .select('id')
                    .single();

                if (error) {
                    console.warn('⚠️ Erreur Supabase:', error.message);
                } else {
                    customerId = data.id;
                    console.log('✅ Client enregistré dans Supabase avec ID:', customerId);
                }
            } else {
                console.warn('⚠️ Supabase non disponible, on continue sans sauvegarder...');
            }

            // Update button text
            submitBtns.forEach(btn => {
                btn.innerHTML = '<span class="spinner"></span> Redirection vers Stripe...';
            });

            // ====================================
            // 2. Préparer les line items pour Stripe
            // ====================================
            const lineItems = orderData.items.map(item => {
                const stripeProduct = window.StripeConfig?.products?.[item.id];
                if (stripeProduct && stripeProduct.priceId) {
                    return {
                        price: stripeProduct.priceId,
                        quantity: item.quantity || 1
                    };
                }
                return null;
            }).filter(item => item !== null);

            if (lineItems.length === 0) {
                throw new Error('Aucun produit valide dans le panier');
            }

            // ====================================
            // 3. Créer la session Stripe
            // ====================================
            const response = await fetch('https://eyinuapucyzcdeldyuba.supabase.co/functions/v1/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    lineItems: lineItems,
                    customerEmail: orderData.customer.email,
                    successUrl: window.location.origin + '/success.html' + (customerId ? '?cid=' + customerId : ''),
                    cancelUrl: window.location.origin + '/cancel.html' + (customerId ? '?cid=' + customerId : ''),
                    metadata: {
                        customerId: customerId || '',
                        customerName: orderData.customer.firstName + ' ' + orderData.customer.lastName,
                        customerPhone: orderData.customer.phone,
                        company: orderData.customer.company || '',
                        address: orderData.billing.address,
                        city: orderData.billing.city,
                        postalCode: orderData.billing.postalCode,
                        country: orderData.billing.country
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création de la session de paiement');
            }

            const { url, sessionId } = await response.json();

            // ====================================
            // 4. Rediriger vers Stripe Checkout
            // ====================================
            if (url) {
                window.location.href = url;
            } else if (sessionId && window.stripeInstance) {
                await window.stripeInstance.redirectToCheckout({ sessionId });
            } else {
                throw new Error('Impossible de rediriger vers le paiement');
            }

        } catch (error) {
            console.error('Erreur paiement:', error);
            alert('Erreur lors du paiement: ' + error.message);

            // Reset button state
            submitBtns.forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = 'Confirmer et payer →';
            });
        }
    }

    // Success modal
    function showSuccessModal(orderId) {
        const modal = document.getElementById('success-modal');
        const orderIdEl = document.getElementById('order-id');

        if (modal) {
            if (orderIdEl) orderIdEl.textContent = orderId;
            modal.style.display = 'flex';

            // Animate in
            setTimeout(() => modal.classList.add('show'), 10);
        }
    }

});

// Add spinner styles
const spinnerStyles = document.createElement('style');
spinnerStyles.textContent = `
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 0.8s ease infinite;
        margin-right: 8px;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(spinnerStyles);

/**
 * Check if user is authenticated (Supabase or demo mode)
 */
async function checkUserAuthentication() {
    // Check demo mode first
    const demoUser = localStorage.getItem('nexus_demo_user');
    if (demoUser) {
        return true;
    }

    // Check Supabase auth
    if (window.supabaseClient) {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            return !!user;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    return false;
}

