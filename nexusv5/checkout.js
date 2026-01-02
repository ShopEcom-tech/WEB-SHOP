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
        setupPaymentMethodToggle();
        setupPromoCode();
        setupFormValidation();
        setupCardFormatting();
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

        // Update installments
        updateInstallments();
    }

    // Update installment amounts
    function updateInstallments() {
        const total = window.cart.getTotal();
        const installment = total / 3;

        const inst1 = document.getElementById('installment-1');
        const inst2 = document.getElementById('installment-2');
        const inst3 = document.getElementById('installment-3');

        if (inst1) inst1.textContent = window.cart.formatPrice(installment);
        if (inst2) inst2.textContent = window.cart.formatPrice(installment);
        if (inst3) inst3.textContent = window.cart.formatPrice(installment);
    }

    // Payment method toggle
    function setupPaymentMethodToggle() {
        const paymentOptions = document.querySelectorAll('.payment-option input[type="radio"]');
        const cardDetails = document.getElementById('card-details');
        const transferDetails = document.getElementById('transfer-details');
        const installmentsDetails = document.getElementById('installments-details');

        paymentOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                // Update selected state
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.closest('.payment-option').classList.add('selected');

                // Show/hide payment details
                const method = e.target.value;

                if (cardDetails) cardDetails.style.display = method === 'card' ? 'block' : 'none';
                if (transferDetails) transferDetails.style.display = method === 'transfer' ? 'block' : 'none';
                if (installmentsDetails) installmentsDetails.style.display = method === 'installments' ? 'block' : 'none';
            });
        });
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

    // Simulate payment processing
    async function processPayment(orderData) {
        const submitBtns = document.querySelectorAll('.btn-checkout-submit');

        // Show loading state
        submitBtns.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Traitement en cours...';
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate order ID
        const orderId = 'WS-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

        // Clear cart
        window.cart.clearCart();

        // Show success modal
        showSuccessModal(orderId);

        // Reset button state
        submitBtns.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = 'Confirmer et payer →';
        });
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

