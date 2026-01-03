/**
 * Nexus Web Shop - Supabase Configuration
 * 
 * Configuration du client Supabase pour l'authentification et la base de données.
 * Utilise la configuration centralisée depuis config.js
 */

(function () {
    'use strict';

    /**
     * Vérifier si Supabase est configuré
     */
    function isSupabaseConfigured() {
        return window.NexusConfig && window.NexusConfig.isSupabaseConfigured();
    }

    /**
     * Initialiser Supabase
     */
    function initSupabase() {
        // Si déjà initialisé, retourner le client existant
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        // Vérifier que la config est chargée
        if (!window.NexusConfig) {
            console.error('❌ NexusConfig non chargé. Assurez-vous que config.js est inclus avant supabase.js');
            return null;
        }

        const { url, anonKey } = window.NexusConfig.supabase;

        // Vérifier que le SDK Supabase est disponible
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            try {
                window.supabaseClient = window.supabase.createClient(url, anonKey);
                console.log('%c✅ Supabase client initialisé avec succès', 'color: #10b981; font-weight: bold;');
                return window.supabaseClient;
            } catch (error) {
                console.error('Erreur lors de la création du client Supabase:', error);
                return null;
            }
        } else {
            console.warn('%c⚠️ Supabase JS SDK non chargé. Vérifiez votre connexion internet ou le CDN.', 'color: #f59e0b;');
            return null;
        }
    }

    // Exporter les fonctions immédiatement
    window.isSupabaseConfigured = isSupabaseConfigured;
    window.initSupabase = initSupabase;

    // Initialiser Supabase immédiatement
    initSupabase();

    // Afficher un avertissement si non configuré
    if (!isSupabaseConfigured()) {
        console.warn(
            '%c⚠️ Supabase non configuré!',
            'color: #f59e0b; font-size: 16px; font-weight: bold;'
        );
        console.warn(
            'Ouvrez js/config.js et configurez vos identifiants Supabase.'
        );
    }
})();
