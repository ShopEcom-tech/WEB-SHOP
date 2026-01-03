/**
 * Nexus Web Shop - Authentication Module (Supabase)
 * 
 * Gestion de l'authentification via Supabase Auth
 */

const Auth = {
    // État de l'utilisateur
    currentUser: null,
    currentProfile: null,
    isLoading: false,

    // Regex patterns de validation
    patterns: {
        // Email valide (RFC 5322 simplifié)
        email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

        // Mot de passe fort : min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&€#^()_+=\[\]{}|;:'"<>,.\/\\~`-])[A-Za-z\d@$!%*?&€#^()_+=\[\]{}|;:'"<>,.\/\\~`-]{8,}$/,

        // Nom/Prénom : lettres, espaces, tirets, apostrophes (2-50 caractères)
        name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,

        // Téléphone français (optionnel)
        phone: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,

        // Nom d'entreprise (optionnel, 2-100 caractères)
        company: /^[a-zA-ZÀ-ÿ0-9\s&'.-]{2,100}$/,

        // Pas de scripts ou balises HTML
        noScript: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        noHtml: /<[^>]*>/g
    },

    /**
     * Valider un email
     */
    validateEmail(email) {
        if (!email || email.trim() === '') {
            return { valid: false, error: 'L\'email est requis' };
        }

        // Nettoyer l'email
        email = email.trim().toLowerCase();

        // Vérifier la longueur
        if (email.length > 254) {
            return { valid: false, error: 'L\'email est trop long' };
        }

        // Vérifier le format
        if (!this.patterns.email.test(email)) {
            return { valid: false, error: 'Format d\'email invalide' };
        }

        // Vérifier les domaines suspects
        const suspiciousDomains = ['tempmail', 'throwaway', 'guerrilla', '10minute', 'fakeinbox'];
        if (suspiciousDomains.some(d => email.includes(d))) {
            return { valid: false, error: 'Les emails temporaires ne sont pas acceptés' };
        }

        return { valid: true, value: email };
    },

    /**
     * Valider un mot de passe
     */
    validatePassword(password) {
        const errors = [];

        if (!password) {
            return { valid: false, error: 'Le mot de passe est requis' };
        }

        if (password.length < 8) {
            errors.push('au moins 8 caractères');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('une lettre minuscule');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('une lettre majuscule');
        }

        if (!/\d/.test(password)) {
            errors.push('un chiffre');
        }

        if (!/[@$!%*?&€#^()_+=\[\]{}|;:'"<>,.\/\\~`-]/.test(password)) {
            errors.push('un caractère spécial (@$!%*?&...)');
        }

        // Vérifier les patterns communs faibles
        const weakPatterns = ['password', '123456', 'azerty', 'qwerty', 'motdepasse'];
        if (weakPatterns.some(p => password.toLowerCase().includes(p))) {
            errors.push('évitez les mots de passe courants');
        }

        if (errors.length > 0) {
            return {
                valid: false,
                error: 'Le mot de passe doit contenir : ' + errors.join(', ')
            };
        }

        return { valid: true };
    },

    /**
     * Valider un nom/prénom
     */
    validateName(name, fieldName = 'nom') {
        if (!name || name.trim() === '') {
            return { valid: false, error: `Le ${fieldName} est requis` };
        }

        // Nettoyer et vérifier les scripts
        name = this.sanitizeInput(name);

        if (name.length < 2) {
            return { valid: false, error: `Le ${fieldName} doit contenir au moins 2 caractères` };
        }

        if (name.length > 50) {
            return { valid: false, error: `Le ${fieldName} est trop long (max 50 caractères)` };
        }

        if (!this.patterns.name.test(name)) {
            return { valid: false, error: `Le ${fieldName} contient des caractères invalides` };
        }

        return { valid: true, value: name.trim() };
    },

    /**
     * Valider un téléphone (optionnel)
     */
    validatePhone(phone) {
        if (!phone || phone.trim() === '') {
            return { valid: true, value: null }; // Optionnel
        }

        // Nettoyer le numéro
        const cleaned = phone.replace(/[\s.-]/g, '');

        if (!this.patterns.phone.test(phone)) {
            return { valid: false, error: 'Format de téléphone invalide (ex: 06 12 34 56 78)' };
        }

        return { valid: true, value: cleaned };
    },

    /**
     * Valider un nom d'entreprise (optionnel)
     */
    validateCompany(company) {
        if (!company || company.trim() === '') {
            return { valid: true, value: null }; // Optionnel
        }

        company = this.sanitizeInput(company);

        if (company.length > 100) {
            return { valid: false, error: 'Le nom de l\'entreprise est trop long' };
        }

        if (!this.patterns.company.test(company)) {
            return { valid: false, error: 'Le nom de l\'entreprise contient des caractères invalides' };
        }

        return { valid: true, value: company.trim() };
    },

    /**
     * Nettoyer une entrée (protection XSS)
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';

        return input
            .replace(this.patterns.noScript, '')
            .replace(this.patterns.noHtml, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    },

    /**
     * Valider tout le formulaire d'inscription
     */
    validateSignupForm(formData) {
        const errors = [];
        const cleanData = {};

        // Prénom
        const firstnameResult = this.validateName(formData.firstname, 'prénom');
        if (!firstnameResult.valid) {
            errors.push(firstnameResult.error);
        } else {
            cleanData.firstname = firstnameResult.value;
        }

        // Nom
        const lastnameResult = this.validateName(formData.lastname, 'nom');
        if (!lastnameResult.valid) {
            errors.push(lastnameResult.error);
        } else {
            cleanData.lastname = lastnameResult.value;
        }

        // Email
        const emailResult = this.validateEmail(formData.email);
        if (!emailResult.valid) {
            errors.push(emailResult.error);
        } else {
            cleanData.email = emailResult.value;
        }

        // Mot de passe
        const passwordResult = this.validatePassword(formData.password);
        if (!passwordResult.valid) {
            errors.push(passwordResult.error);
        } else {
            cleanData.password = formData.password;
        }

        // Téléphone (optionnel)
        const phoneResult = this.validatePhone(formData.phone);
        if (!phoneResult.valid) {
            errors.push(phoneResult.error);
        } else {
            cleanData.phone = phoneResult.value;
        }

        // Entreprise (optionnelle)
        const companyResult = this.validateCompany(formData.company);
        if (!companyResult.valid) {
            errors.push(companyResult.error);
        } else {
            cleanData.company = companyResult.value;
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            data: cleanData
        };
    },

    /**
     * Valider le formulaire de connexion
     */
    validateLoginForm(email, password) {
        const errors = [];

        // Email
        const emailResult = this.validateEmail(email);
        if (!emailResult.valid) {
            errors.push(emailResult.error);
        }

        // Mot de passe basique (la validation complète se fait côté serveur)
        if (!password || password.length < 6) {
            errors.push('Le mot de passe doit contenir au moins 6 caractères');
        }

        return {
            valid: errors.length === 0,
            errors: errors,
            email: emailResult.value
        };
    },

    /**
     * Initialisation
     */
    async init() {
        // Essayer de réinitialiser Supabase si nécessaire
        if (!window.supabaseClient && window.initSupabase) {
            window.initSupabase();
        }

        // Vérifier si Supabase est configuré
        if (!window.supabaseClient || !window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            console.warn('Auth: Supabase non configuré - mode démonstration');
            this.initDemoMode();
            return;
        }

        // Écouter les changements d'auth
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
                this.loadProfile();
            } else {
                this.currentUser = null;
                this.currentProfile = null;
            }
            this.updateUI();
        });

        // Vérifier si l'utilisateur est connecté
        await this.checkAuth();

        // Mettre à jour l'UI
        this.updateUI();

        // Initialiser les formulaires
        this.initForms();

        // Gérer la redirection après authentification (ex: OAuth)
        if (this.currentUser) {
            const authRedirect = sessionStorage.getItem('auth_redirect');
            if (authRedirect) {
                sessionStorage.removeItem('auth_redirect');
                window.location.href = authRedirect;
            }
        }

        // Initialiser les boutons de déconnexion
        this.initLogoutButtons();

        // Initialiser les toggles de mot de passe
        this.initPasswordToggles();
    },

    /**
     * Mode démonstration (sans Supabase)
     */
    initDemoMode() {
        // Charger l'utilisateur demo depuis localStorage
        const demoUser = localStorage.getItem('nexus_demo_user');
        if (demoUser) {
            this.currentUser = JSON.parse(demoUser);
            this.currentProfile = this.currentUser;
        }

        this.updateUI();
        this.initForms();
        this.initLogoutButtons();
        this.initPasswordToggles();
    },

    /**
     * Vérifier l'état d'authentification
     */
    async checkAuth() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();

            if (user) {
                this.currentUser = user;
                await this.loadProfile();
                return true;
            }

            this.currentUser = null;
            this.currentProfile = null;
            return false;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.currentUser = null;
            this.currentProfile = null;
            return false;
        }
    },

    /**
     * Charger le profil utilisateur
     */
    async loadProfile() {
        if (!this.currentUser) return null;

        try {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;
            this.currentProfile = data;
            return data;
        } catch (error) {
            console.error('Load profile error:', error);
            return null;
        }
    },

    /**
     * Inscription
     */
    async signup(formData) {
        this.isLoading = true;

        // Mode démo
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            return this.demoSignup(formData);
        }

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: `${formData.firstname} ${formData.lastname}`,
                        full_name: `${formData.firstname} ${formData.lastname}`,
                        phone: formData.phone || null,
                        company: formData.company || null
                    }
                }
            });

            if (error) throw error;

            // Mettre à jour le profil avec les infos supplémentaires
            if (data.user) {
                await window.supabaseClient
                    .from('profiles')
                    .update({
                        name: `${formData.firstname} ${formData.lastname}`,
                        phone: formData.phone || null,
                        company: formData.company || null
                    })
                    .eq('id', data.user.id);

                this.currentUser = data.user;
                await this.loadProfile();
            }

            return {
                success: true,
                user: data.user,
                message: 'Compte créé ! Vérifiez votre email pour confirmer.'
            };
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: this.translateError(error.message)
            };
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Connexion
     */
    async login(email, password, remember = false) {
        this.isLoading = true;

        // Mode démo
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            return this.demoLogin(email, password);
        }

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            this.currentUser = data.user;
            await this.loadProfile();

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: this.translateError(error.message)
            };
        } finally {
            this.isLoading = false;
        }
    },

    /**
     * Connexion avec Google
     */
    async loginWithGoogle() {
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            return { success: false, error: 'Supabase non configuré' };
        }

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/dashboard.html'
                }
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Déconnexion
     */
    async logout() {
        // Mode démo
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            localStorage.removeItem('nexus_demo_user');
            this.currentUser = null;
            this.currentProfile = null;
            window.location.href = 'index.html';
            return;
        }

        try {
            await window.supabaseClient.auth.signOut();
            this.currentUser = null;
            this.currentProfile = null;
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Forcer la déconnexion locale
            this.currentUser = null;
            this.currentProfile = null;
            window.location.href = 'index.html';
        }
    },

    /**
     * Obtenir les infos complètes de l'utilisateur
     */
    async getUser() {
        if (!this.currentUser) return null;

        // Mode démo
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            return {
                user: this.currentProfile,
                stats: { orders: 0, projects: 0, invoices: 0, messages: 0 }
            };
        }

        try {
            // Charger le profil
            const profile = await this.loadProfile();

            // Charger les statistiques
            const [ordersRes, projectsRes, invoicesRes, contactsRes] = await Promise.all([
                window.supabaseClient
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', this.currentUser.id),
                window.supabaseClient
                    .from('projects')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', this.currentUser.id)
                    .neq('status', 'completed'),
                window.supabaseClient
                    .from('invoices')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', this.currentUser.id),
                window.supabaseClient
                    .from('contacts')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', this.currentUser.id)
                    .eq('status', 'new')
            ]);

            return {
                user: profile,
                stats: {
                    orders: ordersRes.count || 0,
                    projects: projectsRes.count || 0,
                    invoices: invoicesRes.count || 0,
                    messages: contactsRes.count || 0
                }
            };
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },

    /**
     * Inscription en mode démo
     */
    demoSignup(formData) {
        const demoUser = {
            id: 'demo-' + Date.now(),
            email: formData.email,
            name: `${formData.firstname} ${formData.lastname}`,
            phone: formData.phone || null,
            company: formData.company || null,
            role: 'client',
            created_at: new Date().toISOString()
        };

        localStorage.setItem('nexus_demo_user', JSON.stringify(demoUser));
        this.currentUser = demoUser;
        this.currentProfile = demoUser;

        return { success: true, user: demoUser };
    },

    /**
     * Connexion en mode démo
     */
    demoLogin(email, password) {
        // Valider les champs
        const emailValidation = this.validateEmail(email);
        if (!emailValidation.valid) {
            return { success: false, error: emailValidation.error };
        }

        if (!password || password.length < 6) {
            return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
        }

        const demoUser = {
            id: 'demo-' + Date.now(),
            email: emailValidation.value,
            name: emailValidation.value.split('@')[0],
            role: 'client',
            created_at: new Date().toISOString()
        };

        localStorage.setItem('nexus_demo_user', JSON.stringify(demoUser));
        this.currentUser = demoUser;
        this.currentProfile = demoUser;

        return { success: true, user: demoUser };
    },

    /**
     * Traduire les erreurs Supabase
     */
    translateError(message) {
        const translations = {
            'Invalid login credentials': 'Email ou mot de passe incorrect',
            'Email not confirmed': 'Veuillez confirmer votre email',
            'User already registered': 'Cet email est déjà utilisé',
            'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères',
            'Unable to validate email address: invalid format': 'Format d\'email invalide',
            'Signup requires a valid password': 'Mot de passe requis',
            'Email rate limit exceeded': 'Trop de tentatives, réessayez plus tard'
        };
        return translations[message] || message;
    },

    /**
     * Mettre à jour l'UI selon l'état d'auth
     */
    updateUI() {
        const user = this.currentProfile || this.currentUser;
        const navbarCta = document.querySelector('.navbar-cta');
        const mobileMenuCta = document.querySelector('.mobile-menu-cta');

        if (user) {
            // Utilisateur connecté
            if (navbarCta) {
                const initials = this.getInitials(user.name || user.email);
                navbarCta.innerHTML = `
                    <div class="user-menu-trigger" id="user-menu-trigger">
                        <div class="user-avatar-small">
                            <span>${initials}</span>
                        </div>
                        <span class="user-name-nav">${(user.name || user.email).split(' ')[0]}</span>
                        <span class="dropdown-arrow">▼</span>
                    </div>
                    <div class="user-dropdown" id="user-dropdown">
                        <a href="dashboard.html" class="user-dropdown-item">
                            <span class="dropdown-icon">📊</span>
                            Mon espace
                        </a>
                        <a href="dashboard.html#profile" class="user-dropdown-item">
                            <span class="dropdown-icon">👤</span>
                            Mon profil
                        </a>
                        <a href="dashboard.html#orders" class="user-dropdown-item">
                            <span class="dropdown-icon">📦</span>
                            Mes commandes
                        </a>
                        <div class="user-dropdown-divider"></div>
                        <a href="#" class="user-dropdown-item logout" id="nav-logout-btn">
                            <span class="dropdown-icon">🚪</span>
                            Déconnexion
                        </a>
                    </div>
                `;
                navbarCta.classList.add('navbar-user-menu');

                this.initUserDropdown();
            }

            if (mobileMenuCta) {
                mobileMenuCta.innerHTML = `
                    <a href="dashboard.html" class="btn btn-primary">Mon espace</a>
                    <a href="#" class="btn btn-secondary" id="mobile-logout-btn">Déconnexion</a>
                `;
            }

            // Mettre à jour le dashboard si on y est
            if (window.location.pathname.includes('dashboard.html')) {
                this.updateDashboard();
            }

            // Rediriger si sur login/signup
            if (window.location.pathname.includes('login.html') ||
                window.location.pathname.includes('signup.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Utilisateur non connecté
            if (navbarCta) {
                navbarCta.innerHTML = `
                    <a href="login.html" class="btn btn-secondary">Se connecter</a>
                `;
                navbarCta.classList.remove('navbar-user-menu');
            }

            if (mobileMenuCta) {
                mobileMenuCta.innerHTML = `
                    <a href="login.html" class="btn btn-primary">Se connecter</a>
                `;
            }

            // Protéger les pages de dashboard
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    },

    /**
     * Mettre à jour le dashboard
     */
    async updateDashboard() {
        const userData = await this.getUser();
        if (!userData) return;

        const { user, stats } = userData;

        // Mettre à jour le nom
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = (user.name || user.email).split(' ')[0];
        }

        // Mettre à jour les statistiques
        const statElements = {
            'stat-orders': stats.orders,
            'stat-projects': stats.projects,
            'stat-invoices': stats.invoices,
            'stat-messages': stats.messages
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });

        // Mettre à jour le profil
        const initials = this.getInitials(user.name || user.email);

        const profileElements = {
            'profile-initials': initials,
            'profile-name': user.name || user.email,
            'profile-email': user.email,
            'profile-company': user.company || '-',
            'profile-phone': user.phone || '-',
            'profile-since': new Date(user.created_at).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric'
            }),
            'user-initials': initials
        };

        Object.entries(profileElements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    },

    /**
     * Obtenir les initiales d'un nom
     */
    getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },

    /**
     * Initialiser le dropdown utilisateur
     */
    initUserDropdown() {
        const trigger = document.getElementById('user-menu-trigger');
        const dropdown = document.getElementById('user-dropdown');

        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        }

        this.initLogoutButtons();
    },

    /**
     * Initialiser les formulaires d'auth
     */
    initForms() {
        // Formulaire de connexion
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const remember = document.getElementById('remember')?.checked || false;

                const submitBtn = loginForm.querySelector('.auth-submit');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');
                const errorDiv = document.getElementById('login-error');

                // Validation côté client
                const validation = this.validateLoginForm(email, password);
                if (!validation.valid) {
                    errorDiv.querySelector('.error-message').textContent = validation.errors[0];
                    errorDiv.style.display = 'flex';
                    return;
                }

                btnText.style.display = 'none';
                btnLoader.style.display = 'flex';
                submitBtn.disabled = true;
                errorDiv.style.display = 'none';

                const result = await this.login(validation.email, password, remember);

                if (result.success) {
                    // Check if there's a redirect pending
                    const authRedirect = sessionStorage.getItem('auth_redirect');
                    if (authRedirect) {
                        sessionStorage.removeItem('auth_redirect');
                        window.location.href = authRedirect;
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    errorDiv.querySelector('.error-message').textContent = result.error;
                    errorDiv.style.display = 'flex';

                    btnText.style.display = 'inline';
                    btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                }
            });
        }

        // Formulaire d'inscription
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const password = document.getElementById('password').value;
                const passwordConfirm = document.getElementById('password_confirm').value;
                const errorDiv = document.getElementById('signup-error');

                // Vérifier que les mots de passe correspondent
                if (password !== passwordConfirm) {
                    errorDiv.querySelector('.error-message').textContent = 'Les mots de passe ne correspondent pas';
                    errorDiv.style.display = 'flex';
                    return;
                }

                const formData = {
                    firstname: document.getElementById('firstname').value,
                    lastname: document.getElementById('lastname').value,
                    email: document.getElementById('email').value,
                    company: document.getElementById('company')?.value || '',
                    phone: document.getElementById('phone')?.value || '',
                    password: password
                };

                // Validation complète du formulaire
                const validation = this.validateSignupForm(formData);
                if (!validation.valid) {
                    errorDiv.querySelector('.error-message').textContent = validation.errors[0];
                    errorDiv.style.display = 'flex';
                    return;
                }

                const submitBtn = signupForm.querySelector('.auth-submit');
                const btnText = submitBtn.querySelector('.btn-text');
                const btnLoader = submitBtn.querySelector('.btn-loader');

                btnText.style.display = 'none';
                btnLoader.style.display = 'flex';
                submitBtn.disabled = true;
                errorDiv.style.display = 'none';

                // Utiliser les données nettoyées
                const result = await this.signup(validation.data);

                if (result.success) {
                    // Afficher un message de succès si confirmation email requise
                    if (result.message) {
                        alert(result.message);
                    }
                    window.location.href = 'dashboard.html';
                } else {
                    errorDiv.querySelector('.error-message').textContent = result.error;
                    errorDiv.style.display = 'flex';

                    btnText.style.display = 'inline';
                    btnLoader.style.display = 'none';
                    submitBtn.disabled = false;
                }
            });

            // Indicateur de force du mot de passe
            const passwordInput = document.getElementById('password');
            const strengthBar = document.querySelector('.password-strength-bar');

            if (passwordInput && strengthBar) {
                passwordInput.addEventListener('input', () => {
                    const strength = this.getPasswordStrength(passwordInput.value);
                    strengthBar.style.width = `${strength}%`;

                    if (strength < 33) {
                        strengthBar.style.background = '#ef4444';
                    } else if (strength < 66) {
                        strengthBar.style.background = '#f59e0b';
                    } else {
                        strengthBar.style.background = '#10b981';
                    }
                });
            }
        }

        // Bouton Google
        const googleBtn = document.querySelector('.btn-social');
        if (googleBtn) {
            googleBtn.disabled = false;
            // Retirer les anciens listeners pour éviter les doublons
            const newGoogleBtn = googleBtn.cloneNode(true);
            googleBtn.parentNode.replaceChild(newGoogleBtn, googleBtn);

            newGoogleBtn.addEventListener('click', async (e) => {
                e.preventDefault(); // Empêcher le comportement par défaut
                await this.loginWithGoogle();
            });
        }
    },

    /**
     * Calculer la force du mot de passe
     */
    getPasswordStrength(password) {
        let strength = 0;

        if (password.length >= 6) strength += 20;
        if (password.length >= 8) strength += 15;
        if (password.length >= 12) strength += 15;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 10;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

        return Math.min(100, strength);
    },

    /**
     * Initialiser les boutons de déconnexion
     */
    initLogoutButtons() {
        const logoutButtons = document.querySelectorAll('#logout-btn, #nav-logout-btn, #mobile-logout-btn, .logout');

        logoutButtons.forEach(btn => {
            // Supprimer les anciens listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    },

    /**
     * Initialiser les toggles de mot de passe
     */
    initPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');

        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.previousElementSibling;
                const icon = toggle.querySelector('.eye-icon');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.textContent = '🙈';
                } else {
                    input.type = 'password';
                    icon.textContent = '👁️';
                }
            });
        });
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Exposer globalement
window.Auth = Auth;
