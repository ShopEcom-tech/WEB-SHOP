/**
 * Nexus Web Shop - Configuration
 * 
 * Ce fichier centralise les configurations sensibles.
 * 
 * IMPORTANT: Pour la production, vous pouvez:
 * 1. Remplacer les valeurs ci-dessous par vos clés de production
 * 2. Ou injecter les variables via votre serveur/build process
 * 
 * Les clés Anon Supabase sont publiques par design (protégées par RLS)
 * mais ce pattern améliore la maintenabilité et la sécurité.
 */

const NexusConfig = (function () {
    'use strict';

    // ============================================
    // CONFIGURATION - MODIFIEZ CES VALEURS
    // ============================================

    const config = {
        // Supabase
        supabase: {
            url: 'https://eyinuapucyzcdeldyuba.supabase.co',
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aW51YXB1Y3l6Y2RlbGR5dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDkyMTAsImV4cCI6MjA4MjkyNTIxMH0.GgM4rNcP-mU9F-_4m0lG8fp6dcNRw2wGT5h-llRevn4'
        },

        // Stripe (Clé publique - pk_test_ ou pk_live_)
        stripe: {
            publicKey: 'pk_test_51SZFCQHiixEhrbjyMdXmQwYAeqMtcfr4AsdI56VUV7JiHJ8tOkorroPPQI4rILehvNLmJSPn5b6dm7dJQCQ27pNp00KfhnfPie',
            // true = mode test, false = mode production
            testMode: true
        },

        // Application
        app: {
            name: 'Nexus Web Shop',
            version: '1.0.0',
            // Origines autorisées pour CORS (ajoutez votre domaine de production)
            allowedOrigins: [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'https://votre-domaine.com' // Remplacez par votre domaine
            ]
        },

        // API Endpoints
        api: {
            checkoutSession: 'https://eyinuapucyzcdeldyuba.supabase.co/functions/v1/create-checkout-session'
        },

        // Gemini AI Edge Function (deployed on ecommshoppp13 project)
        gemini: {
            edgeFunctionUrl: 'https://eyinuapucyzcdeldyuba.supabase.co/functions/v1/gemini-chat',
            // Using the same anon key as main supabase
            anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aW51YXB1Y3l6Y2RlbGR5dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDkyMTAsImV4cCI6MjA4MjkyNTIxMH0.GgM4rNcP-mU9F-_4m0lG8fp6dcNRw2wGT5h-llRevn4'
        }
    };

    // ============================================
    // MÉTHODES PUBLIQUES
    // ============================================

    /**
     * Vérifier si la configuration Supabase est valide
     */
    function isSupabaseConfigured() {
        return config.supabase.url &&
            !config.supabase.url.includes('YOUR_PROJECT') &&
            config.supabase.anonKey &&
            !config.supabase.anonKey.includes('YOUR_ANON');
    }

    /**
     * Vérifier si on est en mode développement
     */
    function isDevelopment() {
        return window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
    }

    /**
     * Vérifier si l'origine est autorisée
     */
    function isAllowedOrigin(origin) {
        return config.app.allowedOrigins.includes(origin) || isDevelopment();
    }

    /**
     * Obtenir l'URL de succès/annulation pour Stripe
     */
    function getRedirectUrls() {
        const base = window.location.origin;
        // Adapter le chemin selon la structure du projet
        const pagesPath = window.location.pathname.includes('/pages/') ? '' : 'pages/';

        return {
            success: base + '/' + pagesPath + 'success.html',
            cancel: base + '/' + pagesPath + 'cancel.html'
        };
    }

    // ============================================
    // EXPORT
    // ============================================

    return {
        supabase: config.supabase,
        stripe: config.stripe,
        app: config.app,
        api: config.api,
        gemini: config.gemini,
        isSupabaseConfigured,
        isDevelopment,
        isAllowedOrigin,
        getRedirectUrls
    };

})();

// Rendre disponible globalement
window.NexusConfig = NexusConfig;

// Log de debug en développement
if (NexusConfig.isDevelopment()) {
    console.log('%c🔧 Nexus Config chargé', 'color: #7c3aed; font-weight: bold;');
    console.log('Mode:', NexusConfig.stripe.testMode ? 'TEST' : 'PRODUCTION');
}
