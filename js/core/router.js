/**
 * Router Module for Corgi SLO Manager
 * Handles navigation between different views of the application.
 */

const Router = (function() {
    // Routes configuration
    const routes = {
        '': {
            path: '#home',
            title: 'Home',
            template: 'home-template',
            requiredPermission: null, // Everyone can access
            init: () => loadModule('home')
        },
        'home': {
            path: '#home',
            title: 'Home',
            template: 'home-template',
            requiredPermission: null, // Everyone can access
            init: () => loadModule('home')
        },
        'dashboard': {
            path: '#dashboard',
            title: 'Dashboard',
            template: 'dashboard-template',
            requiredPermission: null, // Everyone can access
            init: () => loadModule('dashboard')
        },
        'teams': {
            path: '#teams',
            title: 'Teams',
            template: null, // Will be loaded dynamically
            requiredPermission: null, // Everyone can view
            init: () => loadModule('teams')
        },
        'services': {
            path: '#services',
            title: 'Services',
            template: null,
            requiredPermission: null, // Everyone can view
            init: () => loadModule('services')
        },
        'cujs': {
            path: '#cujs',
            title: 'Critical User Journeys',
            template: null,
            requiredPermission: null, // Everyone can view
            init: () => loadModule('cujs')
        },
        'slos': {
            path: '#slos',
            title: 'Service Level Objectives',
            template: null,
            requiredPermission: null, // Everyone can view
            init: () => loadModule('slos')
        },
        'tools': {
            path: '#tools',
            title: 'Tools',
            template: null,
            requiredPermission: null, // Everyone can view, individual actions are restricted
            init: () => loadModule('tools')
        },
        'help': {
            path: '#help',
            title: 'Help',
            template: null,
            requiredPermission: null,
            init: () => loadModule('help')
        },
        'documentation': {
            path: '#documentation',
            title: 'Documentation',
            template: null,
            requiredPermission: null,
            init: () => loadModule('documentation')
        },
        'privacy': {
            path: '#privacy',
            title: 'Privacy Policy',
            template: null,
            requiredPermission: null,
            init: () => loadModule('privacy')
        },
        'notFound': {
            path: '#not-found',
            title: 'Page Not Found',
            template: null,
            requiredPermission: null,
            init: () => {
                const viewContainer = document.getElementById('view-container');
                viewContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-content">
                            <span class="material-icons">error_outline</span>
                            <h2>Page Not Found</h2>
                            <p>The page you're looking for doesn't exist or you don't have permission to view it.</p>
                            <a href="#dashboard" class="btn btn-primary">Go to Dashboard</a>
                        </div>
                    </div>
                `;
            }
        },
        'debug': {
            path: '#debug',
            title: 'Debug Tools',
            template: null,
            requiredPermission: null,
            init: () => loadModule('debug')
        }
    };
    
    // Current route
    let currentRoute = null;
    
    // View container element
    let viewContainer = null;
    
    // Event listeners
    const eventListeners = {
        routeChanged: []
    };
    
    /**
     * Initialize the router
     */
    const init = () => {
        console.log('Router initializing...');
        
        // Always use the view-container element, not the app element
        viewContainer = document.getElementById('view-container');
        
        if (!viewContainer) {
            console.error('View container not found');
            return;
        }
        
        console.log('Router initialized with view container:', viewContainer);
        
        // Set up event listeners for navigation links
        setupNavigationLinks();
        
        // Listen for hash changes
        window.addEventListener('hashchange', handleRouteChange);
        
        // Initial route
        handleRouteChange();
        
        // Listen for auth changes to check permissions
        Auth.addEventListener('userChanged', () => {
            // If current route requires permission that user doesn't have, redirect to dashboard
            if (currentRoute && currentRoute.requiredPermission && 
                !Auth.hasPermission(currentRoute.requiredPermission)) {
                navigateTo('dashboard');
            }
        });
    };
    
    /**
     * Set up event listeners for navigation links
     */
    const setupNavigationLinks = () => {
        const navLinks = document.querySelectorAll('[data-route]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                const route = link.getAttribute('data-route');
                
                // Only prevent default if it's a route we're handling
                if (routes[route]) {
                    event.preventDefault();
                    navigateTo(route);
                }
            });
        });
    };
    
    /**
     * Handle route change
     */
    const handleRouteChange = () => {
        // Default to home if no hash
        const hash = window.location.hash || '#home';
        console.log('Handling route change for hash:', hash);
        
        // Parse the hash to extract route and query parameters
        let routePath = '';
        let queryParams = '';
        
        if (hash.includes('?')) {
            [routePath, queryParams] = hash.split('?');
        } else {
            routePath = hash;
        }
        
        // Remove the # prefix to get the route key
        routePath = routePath.replace(/^#/, '');
        if (routePath === '') routePath = 'home';
        
        console.log('Looking for route with key:', routePath);
        
        // Find the route
        let route = routes[routePath];
        
        // Log available routes for debugging
        console.log('Available routes:', Object.keys(routes));
        
        // If route not found, use home or notFound
        if (!route) {
            console.warn(`Route not found: ${routePath}`);
            route = routes['home'] || routes[''];
            if (!route) {
                console.error('Could not find default route, using notFound');
                route = routes['notFound'];
            }
        }
        
        // Check permissions
        if (route.requiredPermission && !Auth.hasPermission(route.requiredPermission)) {
            console.warn(`Access denied for route: ${routePath}`);
            route = routes['notFound'];
        }
        
        console.log('Selected route:', route);
        
        // Update current route
        currentRoute = route;
        
        // Update active nav link
        updateActiveNavLink();
        
        // Update document title
        document.title = `${route.title} - Corgi SLO Manager`;
        
        // Scroll to top of the page when changing routes
        window.scrollTo(0, 0);
        
        // Show loading state
        viewContainer.innerHTML = '<div class="loading-spinner"><div class="spinner spinner-lg"></div></div>';
        
        // Parse URL parameters
        const urlParams = {};
        if (queryParams) {
            const params = new URLSearchParams(queryParams);
            params.forEach((value, key) => {
                urlParams[key] = value;
            });
            console.log('URL parameters:', urlParams);
        }
        
        // Notify listeners about route change
        notifyListeners('routeChanged', {
            module: routePath,
            route: route,
            params: urlParams
        });
        
        // Initialize the route
        try {
            // Pass query parameters to the module
            const routeName = routePath;
            if (routeName) {
                // Combine session params with URL params (URL params take precedence)
                const sessionParamsJSON = sessionStorage.getItem(`route_params_${routeName}`);
                const sessionParams = sessionParamsJSON ? JSON.parse(sessionParamsJSON) : {};
                const combinedParams = { ...sessionParams, ...urlParams };
                
                // Store combined params temporarily
                window.currentRouteParams = combinedParams;
            }
            
            route.init();
        } catch (error) {
            console.error(`Error initializing route ${route.path}:`, error);
            viewContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">error_outline</span>
                        <h2>Error Loading Page</h2>
                        <p>${error.message || 'An unexpected error occurred'}</p>
                        <a href="#dashboard" class="btn btn-primary">Go to Dashboard</a>
                    </div>
                </div>
            `;
        }
    };
    
    /**
     * Update the active nav link
     */
    const updateActiveNavLink = () => {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current route link
        if (currentRoute) {
            // Get all links that match the current route path
            document.querySelectorAll('.nav-link').forEach(link => {
                // Extract just the route part from the link's href
                const linkPath = link.getAttribute('href')?.split('?')[0];
                
                // Get the route name from the link's data-route attribute
                const routeName = link.getAttribute('data-route');
                
                // If this link matches the current route path or if the data-route matches the current route name
                if (linkPath === currentRoute.path || 
                    (routeName && routes[routeName] === currentRoute)) {
                    link.classList.add('active');
                }
            });
        }
    };
    
    /**
     * Navigate to a route
     * @param {string} routeName - Name of the route to navigate to
     * @param {Object} params - Parameters to pass to the route
     */
    const navigateTo = (routeName, params = {}) => {
        console.log(`Router.navigateTo called:`, {
            routeName,
            params,
            currentRoute: currentRoute?.path
        });
        
        // Default to home if no route name is provided
        if (!routeName) {
            routeName = 'home';
        }
        
        const route = routes[routeName];
        
        if (!route) {
            console.error(`Route "${routeName}" not found`);
            navigateTo('notFound'); // Redirect to not found page
            return;
        }
        
        // Check if user has permission
        if (route.requiredPermission && !Auth.hasPermission(route.requiredPermission)) {
            console.error(`User doesn't have permission to access ${routeName}`);
            navigateTo('notFound');
            return;
        }
        
        // Store params in sessionStorage
        if (Object.keys(params).length > 0) {
            console.log(`Storing params in sessionStorage for route ${routeName}:`, params);
            sessionStorage.setItem(`route_params_${routeName}`, JSON.stringify(params));
        } else {
            console.log(`Removing sessionStorage params for route ${routeName}`);
            sessionStorage.removeItem(`route_params_${routeName}`);
        }
        
        // Update URL
        if (params && Object.keys(params).length > 0) {
            // Build query string
            const queryString = new URLSearchParams(params).toString();
            window.location.hash = `${route.path}?${queryString}`;
            console.log(`Setting URL hash to: ${route.path}?${queryString}`);
        } else {
            window.location.hash = route.path;
            console.log(`Setting URL hash to: ${route.path}`);
        }
    };
    
    /**
     * Get parameters for the current route
     * @returns {Object} Route parameters
     */
    const getRouteParams = () => {
        console.log(`Router.getRouteParams called, current route:`, currentRoute?.path);
        
        if (!currentRoute) {
            console.log('No current route, returning empty params object');
            return {}; 
        }
        
        const routeName = Object.keys(routes).find(key => routes[key] === currentRoute);
        if (!routeName) {
            console.log(`Could not find routeName for current route, returning empty params`);
            return {};
        }
        
        // Get URL parameters from the hash
        const hash = window.location.hash || '';
        const queryParamsString = hash.includes('?') ? hash.split('?')[1] : '';
        const urlParams = {};
        
        if (queryParamsString) {
            const searchParams = new URLSearchParams(queryParamsString);
            searchParams.forEach((value, key) => {
                // Parse numeric values
                if (!isNaN(value) && value !== '') {
                    urlParams[key] = parseInt(value, 10);
                } else {
                    urlParams[key] = value;
                }
            });
            console.log(`URL params from hash:`, urlParams);
        } else {
            console.log(`No URL params found in hash`);
        }
        
        // Get session storage params
        const paramsJson = sessionStorage.getItem(`route_params_${routeName}`);
        const sessionParams = paramsJson ? JSON.parse(paramsJson) : {};
        
        console.log(`Session params for route ${routeName}:`, sessionParams);
        
        // URL params take precedence over session params
        const combinedParams = { ...sessionParams, ...urlParams };
        console.log(`Combined route params:`, combinedParams);
        
        return combinedParams;
    };
    
    /**
     * Load a module for a route
     * @param {string} moduleName - Name of the module to load
     */
    const loadModule = (moduleName) => {
        console.log(`Router loading module: ${moduleName}`);
        
        try {
            // Get the container
            const container = document.getElementById('view-container');
            if (!container) {
                console.error('View container not found');
                return;
            }
            
            // Get parameters
            const params = getRouteParams();
            
            // Use App.loadModule if available, otherwise try direct access
            if (typeof App !== 'undefined' && typeof App.loadModule === 'function') {
                App.loadModule(moduleName, container, params)
                    .catch(error => {
                        console.error(`Error loading module ${moduleName} via App:`, error);
                        showModuleError(container, moduleName, error);
                    });
            } else {
                // Fallback to direct module access
                console.log(`Fallback: Directly accessing ${moduleName}Module`);
                const moduleObj = window[`${moduleName}Module`];
                
                if (typeof moduleObj === 'object' && typeof moduleObj.init === 'function') {
                    moduleObj.init(container, params);
                } else {
                    console.error(`Module "${moduleName}" not found or doesn't have init function`);
                    showModuleError(container, moduleName);
                }
            }
        } catch (error) {
            console.error(`Error in loadModule for ${moduleName}:`, error);
            const container = document.getElementById('view-container');
            if (container) {
                showModuleError(container, moduleName, error);
            }
        }
    };
    
    /**
     * Show module error message
     */
    const showModuleError = (container, moduleName, error) => {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-content">
                    <span class="material-icons">construction</span>
                    <h2>Module Error</h2>
                    <p>The ${moduleName} module could not be loaded.</p>
                    ${error ? `<p class="error-message">${error.message}</p>` : ''}
                    <a href="#dashboard" class="btn btn-primary">Go to Dashboard</a>
                </div>
            </div>
        `;
    };
    
    /**
     * Add an event listener
     * @param {string} event - Event name (routeChanged)
     * @param {Function} callback - Callback function
     */
    const addEventListener = (event, callback) => {
        if (eventListeners[event]) {
            eventListeners[event].push(callback);
        }
    };
    
    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    const removeEventListener = (event, callback) => {
        if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
        }
    };
    
    /**
     * Notify all listeners of an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    const notifyListeners = (event, data) => {
        if (eventListeners[event]) {
            eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} event listener:`, error);
                }
            });
        }
    };
    
    /**
     * Handle user login
     * @param {Object} user - User object
     */
    const onUserLogin = (user) => {
        console.log('User logged in', user);
        
        // Refresh data
        State.loadAllData();
        
        // Navigate to home
        Router.navigateTo('home');
    };
    
    // Public API
    return {
        init,
        navigateTo,
        getRouteParams,
        getCurrentRoute: () => currentRoute,
        addEventListener,
        removeEventListener
    };
})();

// Initialize router when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, initializing router...');
    // Wait for Auth to initialize first
    setTimeout(() => {
        try {
            Router.init();
            console.log('Router initialized');
        } catch (error) {
            console.error('Error initializing router:', error);
        }
    }, 500); // Increased timeout to ensure all modules are loaded
}); 