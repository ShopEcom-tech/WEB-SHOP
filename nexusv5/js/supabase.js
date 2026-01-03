/**
 * Nexus Web Shop - Supabase Configuration
 * 
 * Configuration du client Supabase pour l'authentification et la base de données.
 * 
 * IMPORTANT: Remplacez les valeurs ci-dessous par vos propres identifiants Supabase.
 * Vous pouvez les trouver dans: Project Settings > API
 */

(function () {
    'use strict';

    // Configuration Supabase
    const SUPABASE_URL = 'https://eyinuapucyzcdeldyuba.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5aW51YXB1Y3l6Y2RlbGR5dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDkyMTAsImV4cCI6MjA4MjkyNTIxMH0.GgM4rNcP-mU9F-_4m0lG8fp6dcNRw2wGT5h-llRevn4';

    /**
     * Vérifier si Supabase est configuré
     */
    function isSupabaseConfigured() {
        return !SUPABASE_URL.includes('YOUR_PROJECT_ID') && !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY');
    }

    /**
     * Initialiser Supabase
     */
    function initSupabase() {
        // Si déjà initialisé, retourner le client existant
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        // Vérifier que le SDK Supabase est disponible
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            try {
                window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
            'Ouvrez supabase.js et remplacez SUPABASE_URL et SUPABASE_ANON_KEY par vos identifiants.'
        );
        console.warn(
            'Créez un projet gratuit sur https://supabase.com'
        );
    }
})();
