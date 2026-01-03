/**
 * Nexus Web Shop - AI Chatbot Widget
 * 
 * Un assistant IA intégré utilisant l'API Gemini pour répondre aux questions clients.
 * Peut être intégré via Supabase Edge Function pour la sécurité des clés API.
 */

(function () {
    'use strict';

    // Configuration
    const CHATBOT_CONFIG = {
        botName: 'Nexus Assistant',
        botAvatar: '🤖',
        welcomeMessage: 'Bonjour ! Je suis l\'assistant virtuel de Nexus. Comment puis-je vous aider aujourd\'hui ?',
        placeholder: 'Écrivez votre message...',
        suggestedQuestions: [
            'Quels sont vos tarifs ?',
            'Combien de temps pour créer un site ?',
            'Offrez-vous la maintenance ?'
        ]
    };

    // FAQ locale pour réponses rapides (sans API)
    const LOCAL_FAQ = {
        'tarif': 'Nos tarifs démarrent à 1 000€ pour un site vitrine. Découvrez toutes nos offres sur la page Offres !',
        'prix': 'Nos tarifs démarrent à 1 000€ pour un site vitrine. Découvrez toutes nos offres sur la page Offres !',
        'délai': 'Un site vitrine prend généralement 2-3 semaines. Un e-commerce peut prendre 4-6 semaines selon la complexité.',
        'temps': 'Un site vitrine prend généralement 2-3 semaines. Un e-commerce peut prendre 4-6 semaines selon la complexité.',
        'maintenance': 'Oui ! Nos abonnements incluent la maintenance, les mises à jour de sécurité et le support technique.',
        'paiement': 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et les virements via Stripe.',
        'contact': 'Vous pouvez nous contacter via la page Contact ou par email à contact@nexus.com'
    };

    // Créer le widget HTML
    function createChatWidget() {
        const widgetHTML = `
            <div id="nexus-chatbot" class="chatbot-widget">
                <!-- Toggle Button -->
                <button class="chatbot-toggle" aria-label="Ouvrir le chat">
                    <span class="chatbot-toggle-icon">${CHATBOT_CONFIG.botAvatar}</span>
                    <span class="chatbot-toggle-pulse"></span>
                </button>

                <!-- Chat Window -->
                <div class="chatbot-window" style="display: none;">
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <span class="chatbot-avatar">${CHATBOT_CONFIG.botAvatar}</span>
                            <div>
                                <span class="chatbot-name">${CHATBOT_CONFIG.botName}</span>
                                <span class="chatbot-status">En ligne</span>
                            </div>
                        </div>
                        <button class="chatbot-close" aria-label="Fermer">×</button>
                    </div>

                    <div class="chatbot-messages" id="chatbot-messages">
                        <!-- Messages seront insérés ici -->
                    </div>

                    <div class="chatbot-suggestions" id="chatbot-suggestions">
                        ${CHATBOT_CONFIG.suggestedQuestions.map(q =>
            `<button class="chatbot-suggestion">${q}</button>`
        ).join('')}
                    </div>

                    <form class="chatbot-input-form" id="chatbot-form">
                        <input 
                            type="text" 
                            class="chatbot-input" 
                            id="chatbot-input"
                            placeholder="${CHATBOT_CONFIG.placeholder}"
                            autocomplete="off"
                        >
                        <button type="submit" class="chatbot-send" aria-label="Envoyer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        initChatEvents();
        addBotMessage(CHATBOT_CONFIG.welcomeMessage);
    }

    // Ajouter le CSS du chatbot - Premium Glassmorphism Design
    function injectChatStyles() {
        const styles = `
            .chatbot-widget {
                position: fixed;
                bottom: 32px;
                right: 32px;
                z-index: 9999;
                font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
            }

            /* Toggle Button - Animated Gradient */
            .chatbot-toggle {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #7c3aed 100%);
                background-size: 200% 200%;
                animation: chatbot-gradient-shift 3s ease infinite;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 
                    0 8px 32px rgba(124, 58, 237, 0.4),
                    0 0 0 4px rgba(124, 58, 237, 0.1);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
            }

            @keyframes chatbot-gradient-shift {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }

            .chatbot-toggle:hover {
                transform: scale(1.15) rotate(5deg);
                box-shadow: 
                    0 12px 40px rgba(124, 58, 237, 0.5),
                    0 0 0 6px rgba(124, 58, 237, 0.15);
            }

            .chatbot-toggle-icon {
                font-size: 32px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }

            .chatbot-toggle-pulse {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: linear-gradient(135deg, #7c3aed, #db2777);
                animation: chatbot-pulse 2s ease-out infinite;
                z-index: -1;
            }

            @keyframes chatbot-pulse {
                0% { transform: scale(1); opacity: 0.6; }
                100% { transform: scale(1.8); opacity: 0; }
            }

            /* Chat Window - Glassmorphism */
            .chatbot-window {
                position: absolute;
                bottom: 90px;
                right: 0;
                width: 420px;
                height: 600px;
                max-height: calc(100vh - 150px);
                background: rgba(15, 15, 20, 0.85);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 
                    0 25px 80px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                    0 0 100px rgba(124, 58, 237, 0.1);
                display: flex;
                flex-direction: column;
                animation: chatbot-slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            @keyframes chatbot-slide-up {
                from { opacity: 0; transform: translateY(30px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            /* Header - Gradient with glow */
            .chatbot-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px 24px;
                background: linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(219, 39, 119, 0.9));
                position: relative;
                overflow: hidden;
            }

            .chatbot-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                opacity: 0.3;
            }

            .chatbot-header-info {
                display: flex;
                align-items: center;
                gap: 14px;
                position: relative;
                z-index: 1;
            }

            .chatbot-avatar {
                font-size: 36px;
                background: rgba(255, 255, 255, 0.15);
                padding: 8px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .chatbot-name {
                display: block;
                font-weight: 700;
                color: white;
                font-size: 17px;
                letter-spacing: -0.3px;
                text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            }

            .chatbot-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                color: rgba(255,255,255,0.9);
            }

            .chatbot-status::before {
                content: '';
                width: 8px;
                height: 8px;
                background: #34d399;
                border-radius: 50%;
                animation: chatbot-status-pulse 2s infinite;
                box-shadow: 0 0 10px #34d399;
            }

            @keyframes chatbot-status-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .chatbot-close {
                background: rgba(255, 255, 255, 0.15);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 12px;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                z-index: 1;
            }

            .chatbot-close:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: rotate(90deg);
            }

            /* Messages Area */
            .chatbot-messages {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                scrollbar-width: thin;
                scrollbar-color: rgba(124, 58, 237, 0.3) transparent;
            }

            .chatbot-messages::-webkit-scrollbar {
                width: 6px;
            }

            .chatbot-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .chatbot-messages::-webkit-scrollbar-thumb {
                background: rgba(124, 58, 237, 0.3);
                border-radius: 10px;
            }

            /* Messages - Modern Bubbles */
            .chatbot-message {
                max-width: 85%;
                padding: 14px 18px;
                border-radius: 20px;
                font-size: 14px;
                line-height: 1.6;
                animation: chatbot-message-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                position: relative;
            }

            @keyframes chatbot-message-in {
                from { opacity: 0; transform: translateY(15px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .chatbot-message-bot {
                align-self: flex-start;
                background: rgba(255, 255, 255, 0.06);
                backdrop-filter: blur(10px);
                color: #f0f0f5;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-bottom-left-radius: 6px;
            }

            .chatbot-message-user {
                align-self: flex-end;
                background: linear-gradient(135deg, #7c3aed, #9333ea);
                color: white;
                border-bottom-right-radius: 6px;
                box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
            }

            /* Thinking Indicator - Enhanced */
            .chatbot-typing {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 14px 18px;
                background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(219, 39, 119, 0.1));
                border-radius: 20px;
                width: fit-content;
                border: 1px solid rgba(124, 58, 237, 0.3);
                animation: chatbot-thinking-glow 2s ease-in-out infinite;
            }

            @keyframes chatbot-thinking-glow {
                0%, 100% { box-shadow: 0 0 15px rgba(124, 58, 237, 0.2); }
                50% { box-shadow: 0 0 25px rgba(124, 58, 237, 0.4); }
            }

            .chatbot-thinking-emoji {
                font-size: 20px;
                animation: chatbot-brain-pulse 1.5s ease-in-out infinite;
            }

            @keyframes chatbot-brain-pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }

            .chatbot-thinking-text {
                color: #c4b5fd;
                font-size: 14px;
                font-weight: 500;
            }

            .chatbot-typing-dot {
                width: 6px;
                height: 6px;
                background: linear-gradient(135deg, #7c3aed, #db2777);
                border-radius: 50%;
                animation: chatbot-typing-bounce 1s infinite;
            }

            .chatbot-typing-dot:nth-child(4) { animation-delay: 0s; }
            .chatbot-typing-dot:nth-child(5) { animation-delay: 0.2s; }
            .chatbot-typing-dot:nth-child(6) { animation-delay: 0.4s; }

            @keyframes chatbot-typing-bounce {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                40% { transform: scale(1); opacity: 1; }
            }

            /* Suggestions */
            .chatbot-suggestions {
                padding: 16px 24px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                background: rgba(0, 0, 0, 0.2);
            }

            .chatbot-suggestion {
                background: rgba(124, 58, 237, 0.1);
                border: 1px solid rgba(124, 58, 237, 0.25);
                color: #c4b5fd;
                padding: 10px 16px;
                border-radius: 24px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .chatbot-suggestion:hover {
                background: rgba(124, 58, 237, 0.25);
                border-color: rgba(124, 58, 237, 0.5);
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(124, 58, 237, 0.2);
            }

            /* Input Form */
            .chatbot-input-form {
                display: flex;
                padding: 20px 24px;
                gap: 14px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                background: rgba(0, 0, 0, 0.3);
            }

            .chatbot-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 14px 20px;
                color: white;
                font-size: 15px;
                transition: all 0.3s ease;
            }

            .chatbot-input:focus {
                outline: none;
                border-color: #7c3aed;
                background: rgba(255, 255, 255, 0.08);
                box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
            }

            .chatbot-input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }

            .chatbot-send {
                background: linear-gradient(135deg, #7c3aed, #db2777);
                border: none;
                border-radius: 16px;
                width: 54px;
                height: 54px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                flex-shrink: 0;
            }

            .chatbot-send:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
            }

            .chatbot-send:active {
                transform: scale(0.95);
            }

            .chatbot-send svg {
                width: 22px;
                height: 22px;
            }

            /* Responsive */
            @media (max-width: 480px) {
                .chatbot-widget {
                    bottom: 16px;
                    right: 16px;
                }
                
                .chatbot-window {
                    width: calc(100vw - 32px);
                    height: calc(100vh - 120px);
                    right: -16px;
                    bottom: 80px;
                    border-radius: 24px;
                }
                
                .chatbot-toggle {
                    width: 60px;
                    height: 60px;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Initialiser les événements
    function initChatEvents() {
        const toggle = document.querySelector('.chatbot-toggle');
        const window = document.querySelector('.chatbot-window');
        const close = document.querySelector('.chatbot-close');
        const form = document.getElementById('chatbot-form');
        const suggestions = document.querySelectorAll('.chatbot-suggestion');

        toggle.addEventListener('click', () => {
            const isOpen = window.style.display !== 'none';
            window.style.display = isOpen ? 'none' : 'flex';
            toggle.querySelector('.chatbot-toggle-pulse').style.display = isOpen ? 'block' : 'none';
        });

        close.addEventListener('click', () => {
            window.style.display = 'none';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatbot-input');
            const message = input.value.trim();
            if (message) {
                addUserMessage(message);
                processMessage(message);
                input.value = '';
                hideSuggestions();
            }
        });

        suggestions.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.textContent;
                addUserMessage(message);
                processMessage(message);
                hideSuggestions();
            });
        });
    }

    // Ajouter un message bot
    function addBotMessage(text) {
        const container = document.getElementById('chatbot-messages');
        const div = document.createElement('div');
        div.className = 'chatbot-message chatbot-message-bot';
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    // Ajouter un message utilisateur
    function addUserMessage(text) {
        const container = document.getElementById('chatbot-messages');
        const div = document.createElement('div');
        div.className = 'chatbot-message chatbot-message-user';
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    // Afficher l'indicateur de réflexion amélioré
    function showTyping() {
        const container = document.getElementById('chatbot-messages');
        const div = document.createElement('div');
        div.className = 'chatbot-typing';
        div.id = 'chatbot-typing-indicator';
        div.innerHTML = `
            <span class="chatbot-thinking-emoji">🧠</span>
            <span class="chatbot-thinking-text">Nexus réfléchit</span>
            <span class="chatbot-typing-dot"></span>
            <span class="chatbot-typing-dot"></span>
            <span class="chatbot-typing-dot"></span>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    // Cacher l'indicateur de frappe
    function hideTyping() {
        const typing = document.getElementById('chatbot-typing-indicator');
        if (typing) typing.remove();
    }

    // Cacher les suggestions
    function hideSuggestions() {
        const suggestions = document.getElementById('chatbot-suggestions');
        if (suggestions) suggestions.style.display = 'none';
    }

    // Appel à l'Edge Function Gemini
    async function callGeminiAPI(message) {
        // Utiliser la config centralisée si disponible
        const config = window.NexusConfig || {};
        const geminiUrl = config.gemini?.edgeFunctionUrl;
        const geminiKey = config.gemini?.anonKey;

        if (!geminiUrl || !geminiKey) {
            console.warn('[Chatbot] Gemini not configured, using local FAQ');
            return null;
        }

        try {
            const response = await fetch(geminiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${geminiKey}`,
                    'apikey': geminiKey
                },
                body: JSON.stringify({
                    action: 'chat',
                    messages: [{ role: 'user', content: message }],
                    courseContext: {
                        courseName: 'Nexus Web Agency',
                        courseDescription: 'Agence web premium créant des sites vitrines (à partir de 499€), e-commerce (à partir de 999€) et sur-mesure. Délai: 2-6 semaines.'
                    },
                    options: {
                        maxTokens: 600,
                        temperature: 0.7
                    }
                })
            });

            if (!response.ok) {
                throw new Error('API call failed');
            }

            const result = await response.json();
            if (result.success && result.data) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('[Chatbot] Gemini API error:', error);
            return null;
        }
    }

    // Traiter le message (Edge Function Gemini avec fallback local)
    async function processMessage(message) {
        showTyping();

        // Essayer l'API Gemini d'abord
        const aiResponse = await callGeminiAPI(message);

        hideTyping();

        if (aiResponse) {
            addBotMessage(aiResponse);
            return;
        }

        // Fallback: chercher une réponse locale
        const lowerMessage = message.toLowerCase();
        let response = null;

        for (const [key, value] of Object.entries(LOCAL_FAQ)) {
            if (lowerMessage.includes(key)) {
                response = value;
                break;
            }
        }

        if (!response) {
            response = "Merci pour votre message ! Pour une réponse personnalisée, n'hésitez pas à nous contacter via la page Contact ou à appeler notre équipe. 📞";
        }

        addBotMessage(response);
    }

    // Initialiser au chargement
    document.addEventListener('DOMContentLoaded', () => {
        injectChatStyles();
        createChatWidget();
        console.log('%c🤖 Nexus Chatbot loaded', 'color: #7c3aed; font-weight: bold;');
    });

})();
