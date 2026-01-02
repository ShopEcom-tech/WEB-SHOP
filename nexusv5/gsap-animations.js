/* ========================================
   NEXUS - GSAP ANIMATIONS
   Premium ScrollTrigger Effects
   ======================================== */

(function () {
    // Wait for DOM and GSAP
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGSAPAnimations);
    } else {
        initGSAPAnimations();
    }

    function initGSAPAnimations() {
        // Check if GSAP is available
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            return;
        }

        // Register ScrollTrigger
        gsap.registerPlugin(ScrollTrigger);

        // ========================================
        // CUSTOM CURSOR
        // ========================================
        const cursor = document.querySelector('.custom-cursor');
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorOutline = document.querySelector('.cursor-outline');

        if (cursor && cursorDot && cursorOutline) {
            let mouseX = 0, mouseY = 0;
            let outlineX = 0, outlineY = 0;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;

                // Dot follows immediately
                gsap.set(cursorDot, { x: mouseX, y: mouseY });
            });

            // Smooth outline follow
            gsap.ticker.add(() => {
                outlineX += (mouseX - outlineX) * 0.15;
                outlineY += (mouseY - outlineY) * 0.15;
                gsap.set(cursorOutline, { x: outlineX, y: outlineY });
            });

            // Hover effects on interactive elements
            const interactiveElements = document.querySelectorAll('a, button, .card, .btn');

            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    gsap.to(cursorOutline, {
                        scale: 2,
                        opacity: 0.5,
                        borderColor: '#a78bfa',
                        duration: 0.3
                    });
                    gsap.to(cursorDot, {
                        scale: 0.5,
                        duration: 0.3
                    });
                });

                el.addEventListener('mouseleave', () => {
                    gsap.to(cursorOutline, {
                        scale: 1,
                        opacity: 1,
                        borderColor: '#7c3aed',
                        duration: 0.3
                    });
                    gsap.to(cursorDot, {
                        scale: 1,
                        duration: 0.3
                    });
                });
            });

            // Magnetic effect on buttons
            document.querySelectorAll('.btn').forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;

                    gsap.to(btn, {
                        x: x * 0.3,
                        y: y * 0.3,
                        duration: 0.3
                    });
                });

                btn.addEventListener('mouseleave', () => {
                    gsap.to(btn, {
                        x: 0,
                        y: 0,
                        duration: 0.5,
                        ease: 'elastic.out(1, 0.3)'
                    });
                });
            });
        }

        // ========================================
        // HERO SECTION ANIMATIONS
        // ========================================
        const heroContent = document.querySelector('.hero-content');

        if (heroContent) {
            // Initial hero animation timeline
            const heroTl = gsap.timeline({ delay: 0.3 });

            heroTl
                .from('.hero-badge', {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power3.out'
                })
                .from('.hero-title', {
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out'
                }, '-=0.5')
                .from('.hero-subtitle', {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power3.out'
                }, '-=0.6')
                .from('.hero-buttons .btn', {
                    y: 20,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: 'power3.out'
                }, '-=0.4')
                .from('.hero-stat', {
                    y: 30,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out'
                }, '-=0.3');

            // Animate stat numbers
            document.querySelectorAll('.hero-stat-value').forEach(stat => {
                const text = stat.textContent;
                const match = text.match(/(\d+)/);

                if (match) {
                    const number = parseInt(match[1]);
                    const prefix = text.replace(/\d+.*/, '');
                    const suffix = text.replace(/.*\d+/, '');

                    let current = { value: 0 };

                    gsap.to(current, {
                        value: number,
                        duration: 2,
                        delay: 1.5,
                        ease: 'power2.out',
                        onUpdate: () => {
                            stat.textContent = prefix + Math.round(current.value) + suffix;
                        }
                    });
                }
            });
        }

        // ========================================
        // SCROLL REVEAL ANIMATIONS
        // ========================================

        // Section titles
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 60,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            });
        });

        // Section subtitles
        gsap.utils.toArray('.section-subtitle').forEach(subtitle => {
            gsap.from(subtitle, {
                scrollTrigger: {
                    trigger: subtitle,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                delay: 0.2,
                ease: 'power3.out'
            });
        });

        // Benefit cards with stagger
        const benefitCards = gsap.utils.toArray('.benefit-card');
        if (benefitCards.length) {
            gsap.from(benefitCards, {
                scrollTrigger: {
                    trigger: '.benefits-grid',
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                y: 80,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out'
            });
        }

        // ========================================
        // 3D CARD TILT EFFECT
        // ========================================
        document.querySelectorAll('.card, .benefit-card, .pricing-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;

                gsap.to(card, {
                    rotateX: rotateX,
                    rotateY: rotateY,
                    transformPerspective: 1000,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        });

        // ========================================
        // CTA SECTION ANIMATION
        // ========================================
        const ctaCard = document.querySelector('.cta-card');
        if (ctaCard) {
            gsap.from(ctaCard, {
                scrollTrigger: {
                    trigger: ctaCard,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                scale: 0.9,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            });
        }

        // ========================================
        // PARALLAX BACKGROUNDS
        // ========================================
        gsap.to('.bg-gradient-1', {
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            },
            y: 200,
            x: 100,
            ease: 'none'
        });

        gsap.to('.bg-gradient-2', {
            scrollTrigger: {
                trigger: 'body',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1
            },
            y: -150,
            x: -80,
            ease: 'none'
        });

        // ========================================
        // TEXT GRADIENT ANIMATION
        // ========================================
        gsap.utils.toArray('.text-gradient').forEach(text => {
            gsap.to(text, {
                backgroundPosition: '200% center',
                duration: 3,
                repeat: -1,
                ease: 'linear'
            });
        });

        // ========================================
        // FOOTER ANIMATION
        // ========================================
        const footer = document.querySelector('.footer');
        if (footer) {
            gsap.from('.footer-brand', {
                scrollTrigger: {
                    trigger: footer,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                x: -50,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            });

            gsap.from('.footer-column', {
                scrollTrigger: {
                    trigger: footer,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out'
            });
        }

        // ========================================
        // SMOOTH SCROLL PROGRESS
        // ========================================
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            gsap.to(progressBar, {
                scrollTrigger: {
                    trigger: 'body',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 0.3
                },
                scaleX: 1,
                transformOrigin: 'left center',
                ease: 'none'
            });
        }

        // ========================================
        // REFRESH ON PAGE LOAD
        // ========================================
        window.addEventListener('load', () => {
            ScrollTrigger.refresh();
        });
    }
})();
