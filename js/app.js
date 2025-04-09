/**
 * Main Application Module for Corgi SLO Manager
 * Initializes and connects all components.
 */

const App = (function() {
    // DOM elements
    let toastContainer;
    let modalContainer;
    
    /**
     * Initialize the application
     */
    const init = () => {
        console.log('Initializing Corgi SLO Manager...');
        
        // Cache DOM elements
        toastContainer = document.getElementById('toast-container');
        modalContainer = document.getElementById('modal-container');
        
        // Set up UI event listeners
        setupUIEventListeners();
        
        // Set up state listeners
        setupStateListeners();
        
        // Set up toasts & modals
        setupToasts();
        setupModals();
        
        // Subscribe to auth events
        Auth.addEventListener('login', onUserLogin);
        Auth.addEventListener('logout', onUserLogout);
        Auth.addEventListener('userChanged', updateUserInterface);
        
        // Add route listener to refresh dashboard when navigating to it
        Router.addEventListener('routeChanged', handleRouteChange);
        
        // Init login state
        updateUserInterface(Auth.getCurrentUser());
        
        console.log('Corgi SLO Manager initialized successfully');
    };
    
    /**
     * Set up event listeners for UI elements
     */
    const setupUIEventListeners = () => {
        // Add event listener for login forms
        document.addEventListener('submit', (event) => {
            if (event.target.id === 'login-form') {
                event.preventDefault();
                
                const email = event.target.querySelector('[name="email"]').value;
                const password = event.target.querySelector('[name="password"]').value;
                
                Auth.login(email, password)
                    .then(() => {
                        State.showNotification('success', 'Success', 'You have been logged in successfully');
                    })
                    .catch(error => {
                        State.showNotification('error', 'Login Failed', error.message);
                    });
            }
        });
        
        // Add event listener for logout button
        const logoutBtn = document.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (event) => {
                event.preventDefault();
                Auth.logout();
            });
        }
    };
    
    /**
     * Set up listeners for state changes
     */
    const setupStateListeners = () => {
        // Subscribe to state changes
        State.subscribe('ui.notifications', renderToasts);
        State.subscribe('ui.activeModal', renderModals);
        State.subscribe('ui.isLoading', updateLoadingState);
    };
    
    /**
     * Set up toast notifications
     */
    const setupToasts = () => {
        // Check if toastContainer exists, if not create it
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
            console.log('Created missing toast container');
        }
        
        // We'll create the "Clear All" button dynamically in renderToasts
        // when there are actual notifications to clear
    };
    
    /**
     * Set up modal dialogs
     */
    const setupModals = () => {
        // Check if modalContainer exists, if not create it
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            document.body.appendChild(modalContainer);
            console.log('Created missing modal container');
        }
        
        // Close modal when clicking outside content
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                State.hideModal();
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && State.getState('ui.activeModal')) {
                State.hideModal();
            }
        });
    };
    
    /**
     * Handle user login
     * @param {Object} user - User object
     */
    const onUserLogin = (user) => {
        console.log('User logged in', user);
        
        // Refresh data
        State.loadAllData();
        
        // Navigate to dashboard
        Router.navigateTo('dashboard');
    };
    
    /**
     * Handle user logout
     */
    const onUserLogout = () => {
        console.log('User logged out');
        
        // Show login modal
        showLoginModal();
    };
    
    /**
     * Update the user interface based on authentication state
     * @param {Object|null} user - The current user or null if not logged in
     */
    const updateUserInterface = (user) => {
        // Update user profile in header
        const userProfileEl = document.querySelector('.user-profile');
        const usernameEl = userProfileEl?.querySelector('.username');
        
        if (usernameEl) {
            if (user) {
                usernameEl.textContent = user.name;
                
                // Add logout button if it doesn't exist
                if (!document.getElementById('logout-btn')) {
                    const logoutBtn = document.createElement('button');
                    logoutBtn.id = 'logout-btn';
                    logoutBtn.className = 'btn-icon';
                    logoutBtn.innerHTML = '<span class="material-icons">logout</span>';
                    logoutBtn.addEventListener('click', () => Auth.logout());
                    userProfileEl.appendChild(logoutBtn);
                }
            } else {
                usernameEl.textContent = 'Sign In';
                
                // Remove logout button
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.remove();
                }
            }
        }
        
        // If not logged in, show login modal
        if (!user) {
            showLoginModal();
        }
    };
    
    /**
     * Show the login modal
     */
    const showLoginModal = () => {
        const loginForm = `
            <div class="modal-backdrop">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">Log In</h2>
                    </div>
                    <div class="modal-body">
                        <form id="login-form">
                            <div class="form-group">
                                <label for="email" class="form-label">Email</label>
                                <input type="email" id="email" name="email" class="form-control" required>
                                <div class="form-hint">Default: admin@example.com</div>
                            </div>
                            <div class="form-group">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" id="password" name="password" class="form-control" required>
                                <div class="form-hint">Default: admin</div>
                            </div>
                            <div class="form-group">
                                <button type="submit" class="btn btn-primary">Log In</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        modalContainer.innerHTML = loginForm;
    };
    
    /**
     * Render toast notifications
     * @param {Array} notifications - Array of notification objects
     */
    const renderToasts = (notifications) => {
        // Remove existing toasts
        const existingToasts = toastContainer.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            if (toast.classList.contains('clear-toasts')) return;
            toast.remove();
        });
        
        // Remove any existing clear button
        const clearBtn = toastContainer.querySelector('.clear-toasts');
        if (clearBtn) {
            clearBtn.remove();
        }
        
        // Only add notifications and clear button if there are notifications
        if (notifications && notifications.length > 0) {
            // Add "Clear All" button only if we have notifications to clear
            const clearAllBtn = document.createElement('button');
            clearAllBtn.className = 'btn btn-sm btn-secondary clear-toasts';
            clearAllBtn.textContent = 'Clear All';
            clearAllBtn.addEventListener('click', () => {
                State.setState('ui.notifications', []);
            });
            toastContainer.appendChild(clearAllBtn);
            
            // Add new toasts
            notifications.forEach(notification => {
                const { id, type, title, message } = notification;
                
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.dataset.id = id;
                
                let icon = 'info';
                switch (type) {
                    case 'success': icon = 'check_circle'; break;
                    case 'error': icon = 'error'; break;
                    case 'warning': icon = 'warning'; break;
                }
                
                toast.innerHTML = `
                    <span class="material-icons toast-icon">${icon}</span>
                    <div class="toast-content">
                        <div class="toast-title">${title}</div>
                        <div class="toast-message">${message}</div>
                    </div>
                    <button class="btn-icon toast-close">
                        <span class="material-icons">close</span>
                    </button>
                `;
                
                // Add event listener to close button
                toast.querySelector('.toast-close').addEventListener('click', () => {
                    State.hideNotification(id);
                });
                
                // Add to container
                toastContainer.appendChild(toast);
                
                // Add animation
                setTimeout(() => {
                    toast.classList.add('toast-enter');
                }, 10);
            });
        }
    };
    
    /**
     * Render active modal
     * @param {string|null} modalId - ID of the active modal or null to hide
     */
    const renderModals = (modalId) => {
        // If no modal is active, clear the container
        if (!modalId) {
            modalContainer.innerHTML = '';
            return;
        }
        
        const modalData = State.getState('ui.modalData') || {};
        
        // Different logic based on modal ID
        switch (modalId) {
            case 'login':
                showLoginModal();
                break;
                
            default:
                console.warn(`Unknown modal ID: ${modalId}`);
                modalContainer.innerHTML = '';
        }
    };
    
    /**
     * Update loading state
     * @param {boolean} isLoading - Whether the app is loading
     */
    const updateLoadingState = (isLoading) => {
        const existingLoader = document.querySelector('.global-loader');
        
        if (isLoading) {
            if (!existingLoader) {
                const loader = document.createElement('div');
                loader.className = 'global-loader';
                loader.innerHTML = `
                    <div class="loader-backdrop"></div>
                    <div class="loader-content">
                        <div class="spinner spinner-lg"></div>
                        <p>${State.getState('ui.loadingMessage') || 'Loading...'}</p>
                    </div>
                `;
                document.body.appendChild(loader);
            }
        } else {
            if (existingLoader) {
                existingLoader.remove();
            }
        }
    };
    
    /**
     * Load a module dynamically 
     */
    const loadModule = (moduleName, container, params) => {
        return new Promise((resolve, reject) => {
            console.log(`Loading module: ${moduleName}`);
            
            try {
                // Load modules
                const moduleMapping = {
                    'dashboard': window.dashboardModule,
                    'teams': window.teamsModule,
                    'services': window.servicesModule,
                    'cujs': window.cujsModule, 
                    'slos': window.slosModule,
                    'debug': window.debugModule,
                    'tools': window.toolsModule,
                    'privacy': window.privacyModule,
                    'help': window.helpModule,
                    'home': window.homeModule,
                    'documentation': window.documentationModule
                };
                
                const moduleInstance = moduleMapping[moduleName];
                
                if (!moduleInstance) {
                    console.error(`Module ${moduleName} not found in moduleMapping`);
                    console.log('Available modules:', Object.keys(moduleMapping)
                        .filter(key => moduleMapping[key])
                        .join(', '));
                    
                    reject(new Error(`Module ${moduleName} not found`));
                    return;
                }
                
                if (typeof moduleInstance.init !== 'function') {
                    console.error(`Module ${moduleName} does not have an init function`);
                    reject(new Error(`Module ${moduleName} does not have an init function`));
                    return;
                }
                
                // Initialize module with container and params
                const result = moduleInstance.init(container, params);
                
                resolve(result);
                
            } catch (error) {
                console.error(`Error loading module ${moduleName}:`, error);
                reject(error);
            }
        });
    };
    
    /**
     * Get parameters from the current route
     * @returns {Object} - Route parameters
     */
    const getRouteParams = () => {
        // Get hash
        const hash = window.location.hash;
        
        // Check if there are parameters
        if (hash.indexOf('?') === -1) {
            return {};
        }
        
        // Get parameters string
        const paramsString = hash.split('?')[1];
        
        // Parse parameters
        const params = {};
        paramsString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            params[key] = decodeURIComponent(value);
        });
        
        return params;
    };
    
    /**
     * Handle route changes and refresh modules as needed
     * @param {Object} route - The new route
     */
    const handleRouteChange = (route) => {
        console.log('Route changed to:', route);
        
        // If navigating to dashboard, force refresh its data
        if (route && route.module === 'dashboard') {
            setTimeout(() => {
                if (window.dashboardModule && typeof window.dashboardModule.refreshDashboard === 'function') {
                    console.log('Forcing dashboard refresh on navigation');
                    window.dashboardModule.refreshDashboard();
                }
            }, 100); // Small delay to ensure module is loaded
        }
    };
    
    // Public API
    return {
        init,
        loadModule
    };
})();

// Initialize application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing application...');
    // Initialize app after database and auth are ready
    setTimeout(() => {
        App.init();
        console.log('Application initialized');
    }, 800); // Wait for other modules to initialize
}); 