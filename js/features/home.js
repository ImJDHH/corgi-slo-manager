/**
 * Home Feature Module for Corgi SLO Manager
 * Provides the landing page content for the application.
 */

console.log('Home module loading...');

// Make sure to expose homeModule in the global scope
window.homeModule = (function() {
    console.log('Initializing home module');
    
    /**
     * Initialize the home module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Home module init called', params);
        
        // Check if container exists
        if (!container) {
            console.error('Home container is missing');
            return false;
        }
        
        try {
            console.log('Home: Starting initialization process');
            
            // Render the home content
            renderHome(container);
            console.log('Home: Content rendered');
            
            // Setup event listeners
            setupEventListeners(container);
            
            console.log('Home initialization complete!');
            return true;
        } catch (error) {
            console.error('ERROR initializing home module:', error);
            console.error('Error stack:', error.stack);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">error_outline</span>
                        <h2>Home Error</h2>
                        <p>There was an error loading the home page: ${error.message}</p>
                        <button class="btn btn-primary" id="retry-home">Retry</button>
                    </div>
                </div>
            `;
            
            // Add retry button handler
            const retryBtn = container.querySelector('#retry-home');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    console.log('Retrying home initialization...');
                    init(container, params);
                });
            }
            
            return false;
        }
    };
    
    /**
     * Render the home content
     * @param {HTMLElement} container - Container element
     */
    const renderHome = (container) => {
        container.innerHTML = `
            <section class="home-view">
                <header class="welcome-header">
                    <h1>Welcome to Corgi SLO Manager</h1>
                    <p class="subtitle">Simplify SLO creation, tracking, and management for your organization</p>
                </header>
                
                <div class="intro-section">
                    <div class="intro-text">
                        <p>Corgi SLO Manager helps teams create, manage, and track Service Level Objectives (SLOs) 
                        that are aligned with Critical User Journeys (CUJs). By focusing on what matters to your users, 
                        you can ensure your reliability efforts have the biggest impact.</p>
                    </div>
                </div>
                
                <div class="features-section">
                    <h2>Key Features</h2>
                    
                    <div class="feature-cards">
                        <div class="feature-card">
                            <div class="feature-icon">
                                <span class="material-icons">groups</span>
                            </div>
                            <h3>Teams</h3>
                            <p>Organize your engineering teams and track their SLO adoption progress</p>
                            <a href="#teams" class="feature-link">Manage Teams</a>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">
                                <span class="material-icons">devices</span>
                            </div>
                            <h3>Services</h3>
                            <p>Define your services and associate them with teams and critical user journeys</p>
                            <a href="#services" class="feature-link">Manage Services</a>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">
                                <span class="material-icons">directions_walk</span>
                            </div>
                            <h3>Critical User Journeys</h3>
                            <p>Identify the key user flows that are essential to your business success</p>
                            <a href="#cujs" class="feature-link">Manage CUJs</a>
                        </div>
                        
                        <div class="feature-card">
                            <div class="feature-icon">
                                <span class="material-icons">speed</span>
                            </div>
                            <h3>SLOs</h3>
                            <p>Create and track Service Level Objectives that align with your user journeys</p>
                            <a href="#slos" class="feature-link">Manage SLOs</a>
                        </div>
                    </div>
                </div>
                
                <div class="workflow-section">
                    <h2>How It Works</h2>
                    
                    <div class="workflow-diagram">
                        <div class="workflow-step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h3>Define Teams</h3>
                                <p>Create teams and assign services to them</p>
                            </div>
                        </div>
                        
                        <div class="workflow-arrow">
                            <span class="material-icons">arrow_forward</span>
                        </div>
                        
                        <div class="workflow-step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h3>Map CUJs</h3>
                                <p>Define critical user journeys</p>
                            </div>
                        </div>
                        
                        <div class="workflow-arrow">
                            <span class="material-icons">arrow_forward</span>
                        </div>
                        
                        <div class="workflow-step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h3>Create SLOs</h3>
                                <p>Define SLOs that support your CUJs</p>
                            </div>
                        </div>
                        
                        <div class="workflow-arrow">
                            <span class="material-icons">arrow_forward</span>
                        </div>
                        
                        <div class="workflow-step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h3>Track & Improve</h3>
                                <p>Monitor SLO performance and iterate</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="get-started-section">
                    <h2>Ready to get started?</h2>
                    <p>Visit the dashboard to see your organization's current SLO status or check out the documentation to learn more.</p>
                    <div class="action-buttons">
                        <a href="#dashboard" class="btn btn-primary">View Dashboard</a>
                        <a href="#documentation" class="btn btn-secondary">Read Documentation</a>
                    </div>
                </div>
            </section>
        `;
    };
    
    /**
     * Set up event listeners for interactive elements
     * @param {HTMLElement} container - Container element
     */
    const setupEventListeners = (container) => {
        // Add click handlers for feature card links
        const featureLinks = container.querySelectorAll('.feature-link');
        
        featureLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                // Let the link's default behavior handle navigation
                console.log('Feature link clicked:', link.getAttribute('href'));
            });
        });
    };
    
    // Public API
    return {
        init
    };
})();
