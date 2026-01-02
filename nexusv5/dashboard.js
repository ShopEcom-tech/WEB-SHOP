/**
 * Nexus Web Shop - Dashboard Module (Supabase)
 * 
 * Gestion du tableau de bord utilisateur avec Supabase
 */

const Dashboard = {
    /**
     * Initialisation
     */
    init() {
        // Charger les données
        this.loadOrders();
        this.loadProjects();

        // Initialiser la navigation
        this.initNavigation();

        // Initialiser le dropdown utilisateur
        this.initUserDropdown();
    },

    /**
     * Charger les commandes récentes
     */
    async loadOrders() {
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) return;

        // Vérifier si Supabase est configuré
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            console.log('Dashboard: Mode démonstration - pas de commandes');
            return;
        }

        try {
            const { data: orders, error } = await window.supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            if (orders && orders.length > 0) {
                ordersList.innerHTML = orders.map(order => this.renderOrder(order)).join('');
            }
        } catch (error) {
            console.error('Load orders error:', error);
        }
    },

    /**
     * Charger les projets en cours
     */
    async loadProjects() {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;

        // Vérifier si Supabase est configuré
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            console.log('Dashboard: Mode démonstration - pas de projets');
            return;
        }

        try {
            const { data: projects, error } = await window.supabaseClient
                .from('projects')
                .select('*')
                .neq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;

            if (projects && projects.length > 0) {
                projectsList.innerHTML = projects.map(project => this.renderProject(project)).join('');
            }
        } catch (error) {
            console.error('Load projects error:', error);
        }
    },

    /**
     * Créer une commande
     */
    async createOrder(items) {
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            console.error('Supabase non configuré');
            return null;
        }

        try {
            // Calculer le total
            const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const taxAmount = totalAmount * 0.2; // TVA 20%
            const finalAmount = totalAmount + taxAmount;

            // Générer le numéro de commande
            const orderNumber = 'CMD-' + Date.now().toString(36).toUpperCase();

            // Créer la commande
            const { data: order, error: orderError } = await window.supabaseClient
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    total_amount: totalAmount,
                    tax_amount: taxAmount,
                    final_amount: finalAmount,
                    status: 'pending',
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Créer les items de commande
            const orderItems = items.map(item => ({
                order_id: order.id,
                service_id: item.service_id || null,
                service_name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }));

            const { error: itemsError } = await window.supabaseClient
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            return order;
        } catch (error) {
            console.error('Create order error:', error);
            return null;
        }
    },

    /**
     * Envoyer un message de contact
     */
    async sendContact(formData) {
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            // Fallback sur Web3Forms si Supabase non configuré
            console.log('Contact: Utilisation de Web3Forms');
            return null;
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('contacts')
                .insert({
                    name: formData.name,
                    email: formData.email,
                    company: formData.company || null,
                    budget: formData.budget || null,
                    message: formData.message,
                    status: 'new'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Send contact error:', error);
            return null;
        }
    },

    /**
     * S'inscrire à la newsletter
     */
    async subscribeNewsletter(email, name = null) {
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            console.log('Newsletter: Supabase non configuré');
            return false;
        }

        try {
            const { error } = await window.supabaseClient
                .from('newsletter_subscribers')
                .upsert({
                    email,
                    name,
                    status: 'active',
                    subscribed_at: new Date().toISOString()
                }, {
                    onConflict: 'email'
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Subscribe newsletter error:', error);
            return false;
        }
    },

    /**
     * Charger les services
     */
    async loadServices() {
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            return [];
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Load services error:', error);
            return [];
        }
    },

    /**
     * Charger les témoignages
     */
    async loadTestimonials() {
        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
            return [];
        }

        try {
            const { data, error } = await window.supabaseClient
                .from('testimonials')
                .select('*')
                .eq('is_approved', true)
                .order('display_order');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Load testimonials error:', error);
            return [];
        }
    },

    /**
     * Rendre une commande
     */
    renderOrder(order) {
        const statusColors = {
            'pending': '#f59e0b',
            'confirmed': '#3b82f6',
            'in_progress': '#8b5cf6',
            'completed': '#10b981',
            'cancelled': '#ef4444'
        };

        const statusLabels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'in_progress': 'En cours',
            'completed': 'Terminée',
            'cancelled': 'Annulée'
        };

        return `
            <div class="order-item">
                <div class="order-info">
                    <div class="order-number">${order.order_number}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="order-details">
                    <div class="order-amount">${parseFloat(order.final_amount).toLocaleString('fr-FR')} €</div>
                    <div class="order-status" style="color: ${statusColors[order.status] || '#71717a'}">
                        ${statusLabels[order.status] || order.status}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Rendre un projet
     */
    renderProject(project) {
        const typeLabels = {
            'vitrine': 'Vitrine',
            'ecommerce': 'E-commerce',
            'surmesure': 'Sur-mesure',
            'autre': 'Autre'
        };

        return `
            <div class="project-item">
                <div class="project-header">
                    <h4 class="project-name">${project.name}</h4>
                    <span class="project-type">${typeLabels[project.project_type] || project.project_type}</span>
                </div>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.completion_percentage || 0}%"></div>
                    </div>
                    <span class="progress-text">${project.completion_percentage || 0}%</span>
                </div>
            </div>
        `;
    },

    /**
     * Initialiser la navigation interne
     */
    initNavigation() {
        const hash = window.location.hash;
        if (hash) {
            this.showSection(hash.substring(1));
        }

        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash;
            if (newHash) {
                this.showSection(newHash.substring(1));
            }
        });
    },

    /**
     * Afficher une section
     */
    showSection(section) {
        console.log('Show section:', section);
        // Pour une future implémentation d'onglets
    },

    /**
     * Initialiser le dropdown utilisateur
     */
    initUserDropdown() {
        const avatar = document.getElementById('user-avatar');
        const dropdown = document.querySelector('.user-dropdown');

        if (avatar && dropdown) {
            avatar.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
        }
    }
};

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Exposer globalement
window.Dashboard = Dashboard;
