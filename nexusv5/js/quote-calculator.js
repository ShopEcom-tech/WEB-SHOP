/**
 * Nexus Web Shop - Calculateur de Devis Interactif
 * 
 * Un outil dynamique permettant aux clients d'estimer le coût de leur projet
 * en temps réel en sélectionnant les options souhaitées.
 */

(function () {
    'use strict';

    // Configuration des prix
    const PRICING = {
        // Types de site
        siteTypes: {
            vitrine: { name: 'Site Vitrine', basePrice: 1000, description: '1-5 pages, design moderne' },
            ecommerce: { name: 'E-commerce', basePrice: 2500, description: 'Boutique en ligne complète' },
            custom: { name: 'Sur-mesure', basePrice: 4000, description: 'Solution personnalisée' }
        },
        // Options supplémentaires
        options: {
            design: { name: 'Design premium', price: 500, icon: '🎨' },
            seo: { name: 'Optimisation SEO', price: 300, icon: '📈' },
            multilang: { name: 'Multilingue', price: 400, icon: '🌍' },
            maintenance: { name: 'Maintenance 1 an', price: 600, icon: '🔧' },
            analytics: { name: 'Analytics avancé', price: 200, icon: '📊' },
            chatbot: { name: 'Chatbot IA', price: 350, icon: '🤖' }
        },
        // Nombre de pages supplémentaires
        extraPagesPrice: 100,
        // Délais estimation
        deliveryTimes: {
            vitrine: '2-3 semaines',
            ecommerce: '4-6 semaines',
            custom: '6-10 semaines'
        }
    };

    // État du calculateur
    let calcState = {
        siteType: 'vitrine',
        extraPages: 0,
        selectedOptions: [],
        discountCode: null
    };

    // Créer le widget calculateur
    function createCalculatorWidget() {
        const widgetHTML = `
            <div id="quote-calculator" class="quote-calculator">
                <div class="calc-header">
                    <span class="calc-icon">💰</span>
                    <h3 class="calc-title">Estimez votre projet</h3>
                    <p class="calc-subtitle">Obtenez un devis instantané</p>
                </div>

                <div class="calc-body">
                    <!-- Type de site -->
                    <div class="calc-section">
                        <label class="calc-label">Type de site</label>
                        <div class="calc-site-types" id="calc-site-types">
                            ${Object.entries(PRICING.siteTypes).map(([key, value]) => `
                                <button class="calc-site-type ${key === 'vitrine' ? 'active' : ''}" data-type="${key}">
                                    <span class="site-type-name">${value.name}</span>
                                    <span class="site-type-price">À partir de ${value.basePrice}€</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Pages supplémentaires -->
                    <div class="calc-section">
                        <label class="calc-label">Pages supplémentaires</label>
                        <div class="calc-pages-slider">
                            <input type="range" id="calc-pages" min="0" max="20" value="0" class="calc-slider">
                            <div class="calc-slider-info">
                                <span id="calc-pages-value">0 pages</span>
                                <span id="calc-pages-price">+0€</span>
                            </div>
                        </div>
                    </div>

                    <!-- Options -->
                    <div class="calc-section">
                        <label class="calc-label">Options</label>
                        <div class="calc-options" id="calc-options">
                            ${Object.entries(PRICING.options).map(([key, value]) => `
                                <label class="calc-option">
                                    <input type="checkbox" value="${key}" class="calc-checkbox">
                                    <span class="calc-option-content">
                                        <span class="calc-option-icon">${value.icon}</span>
                                        <span class="calc-option-name">${value.name}</span>
                                        <span class="calc-option-price">+${value.price}€</span>
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Résultat -->
                <div class="calc-result">
                    <div class="calc-result-row">
                        <span>Estimation totale</span>
                        <span class="calc-total" id="calc-total">1 000 €</span>
                    </div>
                    <div class="calc-result-delivery">
                        <span>⏱️ Délai estimé : </span>
                        <strong id="calc-delivery">2-3 semaines</strong>
                    </div>
                    <button class="btn btn-primary calc-cta" id="calc-cta">
                        Demander un devis personnalisé →
                    </button>
                </div>
            </div>
        `;

        return widgetHTML;
    }

    // Injecter le CSS du calculateur
    function injectCalcStyles() {
        const styles = `
            .quote-calculator {
                background: rgba(24, 24, 27, 0.9);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 20px;
                overflow: hidden;
                max-width: 480px;
                margin: 0 auto;
            }

            .calc-header {
                background: linear-gradient(135deg, #7c3aed, #db2777);
                padding: 24px;
                text-align: center;
            }

            .calc-icon {
                font-size: 32px;
            }

            .calc-title {
                font-size: 20px;
                font-weight: 700;
                color: white;
                margin: 8px 0 4px;
            }

            .calc-subtitle {
                font-size: 14px;
                color: rgba(255,255,255,0.8);
                margin: 0;
            }

            .calc-body {
                padding: 24px;
            }

            .calc-section {
                margin-bottom: 24px;
            }

            .calc-label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #a1a1aa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 12px;
            }

            .calc-site-types {
                display: flex;
                gap: 8px;
            }

            .calc-site-type {
                flex: 1;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 16px 12px;
                cursor: pointer;
                text-align: center;
                transition: all 0.3s ease;
            }

            .calc-site-type:hover {
                border-color: rgba(124, 58, 237, 0.5);
                background: rgba(124, 58, 237, 0.1);
            }

            .calc-site-type.active {
                border-color: #7c3aed;
                background: rgba(124, 58, 237, 0.15);
            }

            .site-type-name {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #f4f4f5;
                margin-bottom: 4px;
            }

            .site-type-price {
                font-size: 11px;
                color: #7c3aed;
            }

            .calc-slider {
                width: 100%;
                height: 6px;
                -webkit-appearance: none;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                outline: none;
            }

            .calc-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #7c3aed, #db2777);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(124, 58, 237, 0.4);
            }

            .calc-slider-info {
                display: flex;
                justify-content: space-between;
                margin-top: 8px;
                font-size: 13px;
                color: #a1a1aa;
            }

            .calc-options {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .calc-option {
                cursor: pointer;
            }

            .calc-checkbox {
                display: none;
            }

            .calc-option-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                padding: 14px 10px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                transition: all 0.2s ease;
            }

            .calc-checkbox:checked + .calc-option-content {
                border-color: #7c3aed;
                background: rgba(124, 58, 237, 0.15);
            }

            .calc-option-icon {
                font-size: 20px;
            }

            .calc-option-name {
                font-size: 12px;
                font-weight: 500;
                color: #f4f4f5;
                text-align: center;
            }

            .calc-option-price {
                font-size: 11px;
                color: #7c3aed;
            }

            .calc-result {
                padding: 24px;
                background: rgba(0,0,0,0.3);
                border-top: 1px solid rgba(255,255,255,0.06);
            }

            .calc-result-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .calc-result-row span:first-child {
                font-size: 14px;
                color: #a1a1aa;
            }

            .calc-total {
                font-size: 28px;
                font-weight: 700;
                background: linear-gradient(135deg, #7c3aed, #db2777);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .calc-result-delivery {
                font-size: 13px;
                color: #71717a;
                margin-bottom: 20px;
            }

            .calc-result-delivery strong {
                color: #10b981;
            }

            .calc-cta {
                width: 100%;
            }

            @media (max-width: 480px) {
                .calc-site-types {
                    flex-direction: column;
                }
                
                .calc-options {
                    grid-template-columns: 1fr;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Calculer le total
    function calculateTotal() {
        let total = PRICING.siteTypes[calcState.siteType].basePrice;
        total += calcState.extraPages * PRICING.extraPagesPrice;

        calcState.selectedOptions.forEach(option => {
            if (PRICING.options[option]) {
                total += PRICING.options[option].price;
            }
        });

        return total;
    }

    // Mettre à jour l'affichage
    function updateDisplay() {
        const total = calculateTotal();
        const delivery = PRICING.deliveryTimes[calcState.siteType];

        document.getElementById('calc-total').textContent = total.toLocaleString('fr-FR') + ' €';
        document.getElementById('calc-delivery').textContent = delivery;
        document.getElementById('calc-pages-value').textContent = calcState.extraPages + ' pages';
        document.getElementById('calc-pages-price').textContent = '+' + (calcState.extraPages * PRICING.extraPagesPrice) + '€';
    }

    // Initialiser les événements
    function initCalcEvents() {
        // Type de site
        document.querySelectorAll('.calc-site-type').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.calc-site-type').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                calcState.siteType = btn.dataset.type;
                updateDisplay();
            });
        });

        // Slider pages
        const slider = document.getElementById('calc-pages');
        if (slider) {
            slider.addEventListener('input', () => {
                calcState.extraPages = parseInt(slider.value);
                updateDisplay();
            });
        }

        // Options
        document.querySelectorAll('.calc-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    calcState.selectedOptions.push(checkbox.value);
                } else {
                    calcState.selectedOptions = calcState.selectedOptions.filter(o => o !== checkbox.value);
                }
                updateDisplay();
            });
        });

        // CTA
        const cta = document.getElementById('calc-cta');
        if (cta) {
            cta.addEventListener('click', () => {
                const total = calculateTotal();
                const type = PRICING.siteTypes[calcState.siteType].name;
                const message = `Devis automatique:\n- Type: ${type}\n- Pages suppl.: ${calcState.extraPages}\n- Options: ${calcState.selectedOptions.join(', ') || 'Aucune'}\n- Estimation: ${total}€`;

                // Rediriger vers la page contact avec le message
                const encodedMessage = encodeURIComponent(message);
                window.location.href = `contact.html?quote=${encodedMessage}`;
            });
        }
    }

    // Initialiser le calculateur sur une page spécifique
    window.initQuoteCalculator = function (containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Container not found:', containerId);
            return;
        }

        injectCalcStyles();
        container.innerHTML = createCalculatorWidget();
        initCalcEvents();
        updateDisplay();
        console.log('%c💰 Quote Calculator loaded', 'color: #10b981; font-weight: bold;');
    };

    // Auto-initialiser si un conteneur existe
    document.addEventListener('DOMContentLoaded', () => {
        const autoContainer = document.getElementById('quote-calculator-container');
        if (autoContainer) {
            window.initQuoteCalculator('quote-calculator-container');
        }
    });

})();
