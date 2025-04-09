/**
 * Documentation Feature Module for Corgi SLO Manager
 * Provides detailed documentation about the app and its features.
 */

console.log('Documentation module loading...');

// Make sure to expose documentationModule in the global scope
window.documentationModule = (function() {
    console.log('Initializing documentation module');
    
    /**
     * Initialize the documentation module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Documentation module init called', params);
        
        // Check if container exists
        if (!container) {
            console.error('Documentation container is missing');
            return false;
        }
        
        try {
            console.log('Documentation: Starting initialization process');
            
            // Render the documentation content
            renderDocumentation(container);
            console.log('Documentation: Content rendered');
            
            // Setup tab navigation and other interactive elements
            setupEventListeners(container);
            
            console.log('Documentation initialization complete!');
            return true;
        } catch (error) {
            console.error('ERROR initializing documentation module:', error);
            console.error('Error stack:', error.stack);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">error_outline</span>
                        <h2>Documentation Error</h2>
                        <p>There was an error loading the documentation: ${error.message}</p>
                        <button class="btn btn-primary" id="retry-docs">Retry</button>
                    </div>
                </div>
            `;
            
            // Add retry button handler
            const retryBtn = container.querySelector('#retry-docs');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    console.log('Retrying documentation initialization...');
                    init(container, params);
                });
            }
            
            return false;
        }
    };
    
    /**
     * Render the documentation content
     * @param {HTMLElement} container - Container element
     */
    const renderDocumentation = (container) => {
        container.innerHTML = `
            <section class="documentation-view">
                <header class="section-header">
                    <h2>Corgi SLO Manager Documentation</h2>
                </header>
                
                <div class="documentation-container">
                    <nav class="documentation-nav">
                        <ul>
                            <li><a href="#overview" class="doc-nav-link active" data-section="overview">Overview</a></li>
                            <li><a href="#teams" class="doc-nav-link" data-section="teams">Teams</a></li>
                            <li><a href="#services" class="doc-nav-link" data-section="services">Services</a></li>
                            <li><a href="#cujs" class="doc-nav-link" data-section="cujs">CUJs</a></li>
                            <li><a href="#slos" class="doc-nav-link" data-section="slos">SLOs</a></li>
                            <li><a href="#workflows" class="doc-nav-link" data-section="workflows">Workflows</a></li>
                            <li><a href="#dashboard" class="doc-nav-link" data-section="dashboard">Dashboard</a></li>
                            <li><a href="#faq" class="doc-nav-link" data-section="faq">FAQ</a></li>
                        </ul>
                    </nav>
                    
                    <div class="documentation-content">
                        <section id="doc-overview" class="doc-section active">
                            <h3>Overview</h3>
                            <p>Corgi SLO Manager is a platform designed to help organizations define, track, and manage Service Level Objectives (SLOs) that align with customer experiences. The tool facilitates collaboration between teams and provides insights into service reliability.</p>
                            
                            <h4>Key Concepts</h4>
                            <ul>
                                <li><strong>Service Level Objective (SLO)</strong>: A target value or range for a service level that is measured by a Service Level Indicator (SLI).</li>
                                <li><strong>Service Level Indicator (SLI)</strong>: A quantitative measure of some aspect of the level of service that is provided.</li>
                                <li><strong>Critical User Journey (CUJ)</strong>: A sequence of user interactions that represents a key business workflow or user experience.</li>
                            </ul>
                            
                            <h4>Why Use Corgi SLO Manager?</h4>
                            <p>Corgi SLO Manager helps teams:</p>
                            <ul>
                                <li>Focus on customer experience when defining reliability targets</li>
                                <li>Establish clear objectives for service performance</li>
                                <li>Track and measure service reliability over time</li>
                                <li>Facilitate communication between teams regarding reliability expectations</li>
                                <li>Make data-driven decisions about reliability investments</li>
                            </ul>
                        </section>
                        
                        <section id="doc-teams" class="doc-section">
                            <h3>Teams</h3>
                            <p>Teams are groups of people responsible for one or more services. In Corgi SLO Manager, teams are the organizational units that own and maintain services, CUJs, and SLOs.</p>
                            
                            <h4>Managing Teams</h4>
                            <ul>
                                <li><strong>Creating a Team</strong>: Navigate to the Teams section and click "Create Team". Provide a name, description, and team members.</li>
                                <li><strong>Editing a Team</strong>: Select a team from the list and click "Edit" to modify its details.</li>
                                <li><strong>Team Dashboard</strong>: Each team has its own dashboard view showing their services, CUJs, and SLOs.</li>
                            </ul>
                        </section>
                        
                        <section id="doc-services" class="doc-section">
                            <h3>Services</h3>
                            <p>Services are the software components or systems that teams own and operate. They are the subjects of SLOs and are associated with CUJs.</p>
                            
                            <h4>Managing Services</h4>
                            <ul>
                                <li><strong>Creating a Service</strong>: Navigate to the Services section and click "Create Service". Select the owning team and provide service details.</li>
                                <li><strong>Service Dependencies</strong>: You can define dependencies between services to understand impact relationships.</li>
                                <li><strong>Service Health</strong>: Each service will display its current health based on the status of its SLOs.</li>
                            </ul>
                        </section>
                        
                        <section id="doc-cujs" class="doc-section">
                            <h3>Critical User Journeys (CUJs)</h3>
                            <p>CUJs represent the key user journeys that are critical to your business. They help teams focus on reliability from the user's perspective.</p>
                            
                            <h4>Managing CUJs</h4>
                            <ul>
                                <li><strong>Creating a CUJ</strong>: Navigate to the CUJs section and click "Create CUJ". Define the user journey, associated services, and importance.</li>
                                <li><strong>CUJ Status</strong>: CUJs have a status workflow:
                                    <ul>
                                        <li><em>Draft</em>: Initial creation state</li>
                                        <li><em>Ready for Review</em>: Prepared for approval</li>
                                        <li><em>Approved</em>: Officially recognized CUJ</li>
                                        <li><em>Deprecated</em>: No longer active but preserved for reference</li>
                                    </ul>
                                </li>
                                <li><strong>Linking to SLOs</strong>: SLOs can be associated with CUJs to track how service performance affects user journeys.</li>
                            </ul>
                        </section>
                        
                        <section id="doc-slos" class="doc-section">
                            <h3>Service Level Objectives (SLOs)</h3>
                            <p>SLOs define the target level of reliability for your services. They are measured by Service Level Indicators (SLIs) and have associated thresholds.</p>
                            
                            <h4>Managing SLOs</h4>
                            <ul>
                                <li><strong>Creating an SLO</strong>: Navigate to the SLOs section and click "Create SLO". Define the SLI, threshold, measurement window, and associated service/CUJ.</li>
                                <li><strong>SLO Components</strong>:
                                    <ul>
                                        <li><em>Service Level Indicator (SLI)</em>: The metric being measured (e.g., availability, latency)</li>
                                        <li><em>Threshold</em>: The target value for the SLI (e.g., 99.9% availability)</li>
                                        <li><em>Window</em>: The time period over which the SLI is measured (e.g., 30 days)</li>
                                    </ul>
                                </li>
                                <li><strong>SLO Status</strong>: Like CUJs, SLOs follow a status workflow (Draft, Ready for Review, Approved, Deprecated)</li>
                            </ul>
                        </section>
                        
                        <section id="doc-workflows" class="doc-section">
                            <h3>Workflows</h3>
                            <p>Corgi SLO Manager includes several workflows to facilitate the creation, review, and management of SLOs and other components.</p>
                            
                            <h4>Creation Workflow</h4>
                            <ol>
                                <li>Create Teams: Start by defining the teams in your organization</li>
                                <li>Create Services: Define the services owned by each team</li>
                                <li>Define CUJs: Identify the critical user journeys that depend on your services</li>
                                <li>Create SLOs: Define SLOs for your services that support your CUJs</li>
                            </ol>
                            
                            <h4>Approval Workflow</h4>
                            <p>CUJs and SLOs follow an approval workflow:</p>
                            <ol>
                                <li><strong>Draft</strong>: Initial creation state where you can edit and refine</li>
                                <li><strong>Ready for Review</strong>: When ready for approval, change the status to trigger a review</li>
                                <li><strong>Approved</strong>: After review, items can be approved to become official</li>
                            </ol>
                            
                            <p>Items in "Ready for Review" status appear in the Pending Reviews section of the Dashboard for visibility.</p>
                        </section>
                        
                        <section id="doc-dashboard" class="doc-section">
                            <h3>Dashboard</h3>
                            <p>The Dashboard provides an overview of your SLO program health across the organization or for specific teams.</p>
                            
                            <h4>Dashboard Components</h4>
                            <ul>
                                <li><strong>Total SLOs</strong>: Shows the total number of SLOs with the number approved</li>
                                <li><strong>Total CUJs</strong>: Shows the total number of CUJs with the number approved</li>
                                <li><strong>Teams with SLOs</strong>: Shows the percentage of teams that have defined SLOs</li>
                                <li><strong>SLO Coverage</strong>: Shows the percentage of services that have at least one SLO</li>
                                <li><strong>Pending Reviews</strong>: Displays CUJs and SLOs waiting for review, with urgency indicators based on wait time</li>
                                <li><strong>Team SLO Adoption</strong>: Shows a breakdown of SLO adoption by team</li>
                            </ul>
                            
                            <h4>Filtering the Dashboard</h4>
                            <p>You can filter the dashboard by team and time range to focus on specific areas.</p>
                        </section>
                        
                        <section id="doc-faq" class="doc-section">
                            <h3>Frequently Asked Questions</h3>
                            
                            <div class="faq-item">
                                <h4>What's the difference between an SLI and an SLO?</h4>
                                <p>An SLI (Service Level Indicator) is a metric that measures some aspect of service performance, such as availability or latency. An SLO (Service Level Objective) is a target or threshold set for that SLI, such as "99.9% availability over 30 days."</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>How should I choose which CUJs to track?</h4>
                                <p>Focus on user journeys that are critical to your business and represent key user experiences. Prioritize journeys that have high business impact, high user volume, or are essential to your product's value proposition.</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>How many SLOs should a service have?</h4>
                                <p>Start small with 2-3 SLOs per service that focus on different aspects of reliability (e.g., availability, latency, correctness). Too many SLOs can dilute focus and create overhead.</p>
                            </div>
                            
                            <div class="faq-item">
                                <h4>Who should be responsible for approving SLOs?</h4>
                                <p>SLO approval typically involves stakeholders from the service team, product management, and sometimes customer representatives. The ideal approvers understand both technical constraints and business requirements.</p>
                            </div>
                        </section>
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
        // Add click handlers for documentation navigation
        const navLinks = container.querySelectorAll('.doc-nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                const sectionId = link.getAttribute('data-section');
                
                // Remove active class from all links and sections
                navLinks.forEach(l => l.classList.remove('active'));
                const sections = container.querySelectorAll('.doc-section');
                sections.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked link and corresponding section
                link.classList.add('active');
                const targetSection = container.querySelector(`#doc-${sectionId}`);
                if (targetSection) {
                    targetSection.classList.add('active');
                    
                    // Scroll to top of section
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    };
    
    // Public API
    return {
        init
    };
})();
