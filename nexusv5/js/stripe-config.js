/**
 * Web Shop - Stripe Configuration
 * 
 * Configuration de Stripe pour les paiements.
 * Utilise la configuration centralisée depuis config.js
 */

(function () {
    'use strict';

    // Vérifier que NexusConfig est chargé
    if (!window.NexusConfig) {
        console.error('❌ NexusConfig non chargé. Assurez-vous que config.js est inclus avant stripe-config.js');
        return;
    }

    // Récupérer la config depuis NexusConfig
    const STRIPE_PUBLIC_KEY = window.NexusConfig.stripe.publicKey;
    const redirectUrls = window.NexusConfig.getRedirectUrls();
    const SUCCESS_URL = redirectUrls.success;
    const CANCEL_URL = redirectUrls.cancel;
    const CHECKOUT_FUNCTION_URL = window.NexusConfig.api.checkoutSession;

    // Produits avec leurs Price IDs Stripe (Mode TEST)
    const STRIPE_PRODUCTS = {
        'vitrine': {
            name: 'Site Vitrine',
            priceId: 'price_1SlT1wHiixEhrbjyoT4PDGOQ',
            price: 199.99
        },
        'ecommerce': {
            name: 'E-commerce',
            priceId: 'price_1SlT3dHiixEhrbjysHvQ4bcT',
            price: 399
        },
        'surmesure': {
            name: 'Sur-mesure',
            priceId: 'price_1SlT4mHiixEhrbjylKY3AQWA',
            price: 799
        },
        'essentiel': {
            name: 'Abonnement Essentiel',
            priceId: 'price_1SlT8GHiixEhrbjyzL9e19n9',
            price: 49,
            recurring: true
        },
        'pro': {
            name: 'Abonnement Pro',
            priceId: 'price_1SlT8cHiixEhrbjyZN3W4VBx',
            price: 99,
            recurring: true
        },
        'premium': {
            name: 'Abonnement Premium',
            priceId: 'price_1SlT8lHiixEhrbjy9k8Bfnmx',
            price: 199,
            recurring: true
        }
    };

    /**
     * Initialiser Stripe
     */
    function initStripe() {
        if (typeof Stripe === 'undefined') {
            console.error('Stripe.js non chargé. Ajoutez le script Stripe.');
            return null;
        }

        window.stripeInstance = Stripe(STRIPE_PUBLIC_KEY);
        console.log('%c✅ Stripe initialisé (mode TEST)', 'color: #10b981; font-weight: bold;');
        return window.stripeInstance;
    }

    /**
     * Créer une session de paiement Stripe Checkout
     * Utilise Supabase Edge Function pour créer la session
     */
    async function createCheckoutSession(cartItems, customerInfo) {
        try {
            // Préparer les line items pour Stripe
            const lineItems = cartItems.map(item => {
                const product = STRIPE_PRODUCTS[item.id];
                if (!product) {
                    throw new Error(`Produit non trouvé: ${item.id}`);
                }
                return {
                    price: product.priceId,
                    quantity: item.quantity || 1
                };
            });

            // Appeler l'Edge Function Supabase
            const response = await fetch(CHECKOUT_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.supabaseClient?.supabaseKey || ''}`
                },
                body: JSON.stringify({
                    lineItems: lineItems,
                    customerEmail: customerInfo.email,
                    successUrl: SUCCESS_URL,
                    cancelUrl: CANCEL_URL,
                    metadata: {
                        customerName: customerInfo.firstName + ' ' + customerInfo.lastName,
                        customerPhone: customerInfo.phone,
                        company: customerInfo.company || ''
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la création de la session');
            }

            const { sessionId, url } = await response.json();

            // Rediriger vers Stripe Checkout
            if (url) {
                window.location.href = url;
            } else if (sessionId) {
                const stripe = window.stripeInstance || initStripe();
                await stripe.redirectToCheckout({ sessionId });
            }

        } catch (error) {
            console.error('Erreur Stripe Checkout:', error);
            throw error;
        }
    }

    /**
     * Mode simplifié : Redirection vers Stripe Payment Link
     * Utilisez cette méthode si vous n'avez pas configuré l'Edge Function
     */
    async function redirectToPaymentLink(productId) {
        // ⚠️ Créez des Payment Links dans le dashboard Stripe
        // Dashboard > Products > Payment Links
        const PAYMENT_LINKS = {
            'vitrine': 'https://buy.stripe.com/test_VOTRE_LIEN_VITRINE',
            'ecommerce': 'https://buy.stripe.com/test_VOTRE_LIEN_ECOMMERCE',
            'surmesure': 'https://buy.stripe.com/test_VOTRE_LIEN_SURMESURE'
        };

        const link = PAYMENT_LINKS[productId];
        if (link && !link.includes('VOTRE_LIEN')) {
            window.location.href = link;
        } else {
            alert('Lien de paiement non configuré pour ce produit.');
        }
    }

    // Exporter les fonctions
    window.StripeConfig = {
        publicKey: STRIPE_PUBLIC_KEY,
        products: STRIPE_PRODUCTS,
        successUrl: SUCCESS_URL,
        cancelUrl: CANCEL_URL,
        init: initStripe,
        createCheckoutSession: createCheckoutSession,
        redirectToPaymentLink: redirectToPaymentLink
    };

    // Initialiser Stripe au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStripe);
    } else {
        initStripe();
    }

})();
