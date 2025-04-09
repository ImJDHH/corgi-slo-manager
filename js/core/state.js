/**
 * State Management Module for Corgi SLO Manager
 * Provides a centralized state store with pub/sub functionality.
 * 
 * Version: 2.0 - Updated to remove SLIs dependency (2024-04-02)
 */

console.log('Loading State module v2.0 (No SLIs)...');

const State = (function() {
    // Private state object
    const state = {
        teams: [],
        services: [],
        cujs: [],
        slos: [],
        stats: {
            activeSLOs: 0,
            totalCUJs: 0,
            teamsWithSLOs: 0,
            pendingApprovals: 0
        },
        filters: {
            teams: null,
            services: null,
            status: null,
            timeRange: 'last30days'
        },
        ui: {
            isSidebarOpen: window.innerWidth > 768,
            activeModal: null,
            modalData: null,
            notifications: [],
            isLoading: false,
            loadingMessage: ''
        }
    };
    
    // Listeners for state changes
    const listeners = {};
    
    /**
     * Get the current state or a slice of it
     * @param {string} [path=null] - Dot notation path to a specific state slice (e.g., 'ui.isLoading')
     * @returns {*} The requested state or slice
     */
    const getState = (path = null) => {
        if (!path) {
            return { ...state }; // Return a copy to prevent direct mutation
        }
        
        return getNestedProperty(state, path);
    };
    
    /**
     * Update the state
     * @param {string} path - Dot notation path to the property to update
     * @param {*} value - New value
     * @param {boolean} [silent=false] - If true, don't notify listeners
     */
    const setState = (path, value, silent = false) => {
        // Get the old value for comparison
        const oldValue = getNestedProperty(state, path);
        
        // Update the state
        setNestedProperty(state, path, value);
        
        // Skip notifications if silent or value didn't change
        if (silent || JSON.stringify(oldValue) === JSON.stringify(value)) {
            return;
        }
        
        // Notify listeners
        notifyListeners(path, value, oldValue);
    };
    
    /**
     * Subscribe to state changes
     * @param {string} path - Dot notation path to the property to listen for
     * @param {Function} callback - Function to call when the property changes
     * @returns {Function} Unsubscribe function
     */
    const subscribe = (path, callback) => {
        if (!listeners[path]) {
            listeners[path] = [];
        }
        
        listeners[path].push(callback);
        
        // Return unsubscribe function
        return () => {
            listeners[path] = listeners[path].filter(cb => cb !== callback);
        };
    };
    
    /**
     * Notify listeners of a state change
     * @param {string} path - Path that changed
     * @param {*} newValue - New value
     * @param {*} oldValue - Old value
     */
    const notifyListeners = (path, newValue, oldValue) => {
        // Notify listeners of the exact path
        if (listeners[path]) {
            listeners[path].forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error(`Error in state listener for ${path}:`, error);
                }
            });
        }
        
        // Notify listeners of parent paths
        const pathParts = path.split('.');
        while (pathParts.length > 0) {
            pathParts.pop();
            const parentPath = pathParts.join('.');
            
            if (parentPath && listeners[parentPath]) {
                const newParentValue = getNestedProperty(state, parentPath);
                listeners[parentPath].forEach(callback => {
                    try {
                        callback(newParentValue, null); // Old value is harder to determine for parents
                    } catch (error) {
                        console.error(`Error in state listener for ${parentPath}:`, error);
                    }
                });
            }
        }
        
        // Notify listeners of the root state
        if (listeners['']) {
            listeners[''].forEach(callback => {
                try {
                    callback(state, null);
                } catch (error) {
                    console.error('Error in root state listener:', error);
                }
            });
        }
    };
    
    /**
     * Get a nested property from an object using dot notation
     * @param {Object} obj - Object to get property from
     * @param {string} path - Dot notation path to property
     * @returns {*} Property value
     */
    const getNestedProperty = (obj, path) => {
        const value = path.split('.').reduce((o, key) => {
            return o && o[key] !== undefined ? o[key] : undefined;
        }, obj);
        
        return value !== undefined ? value : null;
    };
    
    /**
     * Set a nested property on an object using dot notation
     * @param {Object} obj - Object to set property on
     * @param {string} path - Dot notation path to property
     * @param {*} value - Value to set
     */
    const setNestedProperty = (obj, path, value) => {
        const parts = path.split('.');
        const lastKey = parts.pop();
        
        const target = parts.reduce((o, key) => {
            // If the key doesn't exist or is not an object, create an object
            if (o[key] === undefined || typeof o[key] !== 'object') {
                o[key] = {};
            }
            return o[key];
        }, obj);
        
        target[lastKey] = value;
    };
    
    /**
     * Show a loading indicator
     * @param {string} [message='Loading...'] - Loading message
     */
    const showLoading = (message = 'Loading...') => {
        setState('ui.isLoading', true);
        setState('ui.loadingMessage', message);
    };
    
    /**
     * Hide the loading indicator
     */
    const hideLoading = () => {
        setState('ui.isLoading', false);
    };
    
    /**
     * Show a notification
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {number} [duration=5000] - Duration in milliseconds (0 for no auto-hide)
     */
    const showNotification = (type, title, message, duration = 5000) => {
        const notification = {
            id: Date.now(),
            type,
            title,
            message,
            timestamp: new Date().toISOString()
        };
        
        // Add to notifications
        const notifications = [...state.ui.notifications, notification];
        setState('ui.notifications', notifications);
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                hideNotification(notification.id);
            }, duration);
        }
        
        return notification.id;
    };
    
    /**
     * Hide a notification
     * @param {number} id - Notification ID
     */
    const hideNotification = (id) => {
        const notifications = state.ui.notifications.filter(n => n.id !== id);
        setState('ui.notifications', notifications);
    };
    
    /**
     * Show a modal
     * @param {string} modalId - ID of the modal to show
     * @param {Object} [data=null] - Data to pass to the modal
     */
    const showModal = (modalId, data = null) => {
        setState('ui.activeModal', modalId);
        setState('ui.modalData', data);
    };
    
    /**
     * Hide the active modal
     */
    const hideModal = () => {
        setState('ui.activeModal', null);
        setState('ui.modalData', null);
    };
    
    /**
     * Load teams from the database
     * @returns {Promise<Array>} - Teams data
     */
    const loadTeams = async () => {
        showLoading('Loading teams...');
        
        try {
            const teams = await Database.getAll(Database.STORES.TEAMS);
            
            // Sort by name
            teams.sort((a, b) => a.name.localeCompare(b.name));
            
            setState('teams', teams);
            return teams;
        } catch (error) {
            console.error('Failed to load teams:', error);
            showNotification('error', 'Error', 'Failed to load teams');
            return [];
        } finally {
            hideLoading();
        }
    };
    
    /**
     * Load services from the database
     * @param {string|null} [teamUID=null] - Optional team UID to filter by
     * @returns {Promise<Array>} - Services data
     */
    const loadServices = async (teamUID = null) => {
        showLoading('Loading services...');
        
        try {
            let services;
            
            if (teamUID) {
                services = await Database.query(Database.STORES.SERVICES, 'teamUID', teamUID);
            } else {
                services = await Database.getAll(Database.STORES.SERVICES);
            }
            
            // Sort by name
            services.sort((a, b) => a.name.localeCompare(b.name));
            
            if (teamUID) {
                // Only update the services for this team
                const allServices = [...state.services];
                const otherServices = allServices.filter(s => s.teamUID !== teamUID);
                setState('services', [...otherServices, ...services]);
            } else {
                setState('services', services);
            }
            
            return services;
        } catch (error) {
            console.error('Failed to load services:', error);
            showNotification('error', 'Error', 'Failed to load services');
            return [];
        } finally {
            hideLoading();
        }
    };
    
    /**
     * Load CUJs from the database
     * @param {string|null} [serviceUID=null] - Optional service UID to filter by
     * @returns {Promise<Array>} - CUJs data
     */
    const loadCUJs = async (serviceUID = null) => {
        showLoading('Loading critical user journeys...');
        
        try {
            let cujs;
            
            if (serviceUID) {
                cujs = await Database.query(Database.STORES.CUJS, 'serviceUID', serviceUID);
            } else {
                cujs = await Database.getAll(Database.STORES.CUJS);
            }
            
            // Sort by name
            cujs.sort((a, b) => a.name.localeCompare(b.name));
            
            if (serviceUID) {
                // Only update the CUJs for this service
                const allCujs = [...state.cujs];
                const otherCujs = allCujs.filter(c => c.serviceUID !== serviceUID);
                setState('cujs', [...otherCujs, ...cujs]);
            } else {
                setState('cujs', cujs);
            }
            
            // Update stats
            setState('stats.totalCUJs', cujs.length);
            
            return cujs;
        } catch (error) {
            console.error('Failed to load CUJs:', error);
            showNotification('error', 'Error', 'Failed to load critical user journeys');
            return [];
        } finally {
            hideLoading();
        }
    };
    
    /**
     * Load SLOs from the database
     * @param {string|null} [cujUID=null] - Optional CUJ UID to filter by
     * @returns {Promise<Array>} - SLOs data
     */
    const loadSLOs = async (cujUID = null) => {
        showLoading('Loading service level objectives...');
        
        try {
            let slos;
            
            if (cujUID) {
                slos = await Database.query(Database.STORES.SLOS, 'cujUID', cujUID);
            } else {
                slos = await Database.getAll(Database.STORES.SLOS);
            }
            
            // Convert any 'active' status to 'approved' for backward compatibility
            slos = slos.map(slo => {
                if (slo.status === 'active') {
                    console.log(`Converting SLO status from 'active' to 'approved' for SLO: ${slo.name}`);
                    return { ...slo, status: 'approved' };
                }
                return slo;
            });
            
            // Sort by name
            slos.sort((a, b) => a.name.localeCompare(b.name));
            
            if (cujUID) {
                // Only update the SLOs for this CUJ
                const allSlos = [...state.slos];
                const otherSlos = allSlos.filter(s => s.cujUID !== cujUID);
                setState('slos', [...otherSlos, ...slos]);
            } else {
                setState('slos', slos);
            }
            
            // Update stats - now counting 'approved' instead of 'active'
            const activeSlos = slos.filter(s => s.status === 'approved').length;
            setState('stats.activeSLOs', activeSlos);
            
            // Count pending approvals across CUJs and SLOs
            const pendingCujs = state.cujs.filter(c => c.status === 'pending').length;
            const pendingSlos = slos.filter(s => s.status === 'pending').length;
            setState('stats.pendingApprovals', pendingCujs + pendingSlos);
            
            return slos;
        } catch (error) {
            console.error('Failed to load SLOs:', error);
            showNotification('error', 'Error', 'Failed to load service level objectives');
            return [];
        } finally {
            hideLoading();
        }
    };
    
    /**
     * Dummy function for backward compatibility
     * @deprecated SLIs are now embedded in SLOs
     */
    const loadSLIs = async () => {
        console.warn('State.loadSLIs is deprecated - SLIs are now embedded in SLOs');
        return [];
    };
    
    /**
     * Load all data
     * @returns {Promise<void>}
     */
    const loadAllData = async () => {
        showLoading('Loading data...');
        console.log('State.loadAllData: Starting to load data...');
        
        try {
            console.log('State.loadAllData: Loading teams...');
            await loadTeams();
            
            console.log('State.loadAllData: Loading services...');
            await loadServices();
            
            console.log('State.loadAllData: Loading CUJs...');
            await loadCUJs();
            
            console.log('State.loadAllData: Loading SLOs...');
            await loadSLOs();
            
            // Note: We no longer load SLIs as they are embedded in SLOs
            
            console.log('State.loadAllData: All data loaded successfully!');
        } catch (error) {
            console.error('Failed to load all data:', error);
            showNotification('error', 'Error', 'Failed to load application data');
        } finally {
            hideLoading();
        }
    };
    
    /**
     * Set filter values
     * @param {Object} filters - Filter values to set
     */
    const setFilters = (filters) => {
        setState('filters', { ...state.filters, ...filters });
    };
    
    /**
     * Clear filters
     */
    const clearFilters = () => {
        setState('filters', {
            teams: null,
            services: null,
            status: null,
            timeRange: 'last30days'
        });
    };
    
    /**
     * Toggle sidebar visibility
     */
    const toggleSidebar = () => {
        setState('ui.isSidebarOpen', !state.ui.isSidebarOpen);
    };
    
    /**
     * Handle loading sample data for the Debug module
     */
    const handleLoadSampleData = async () => {
        try {
            // Fetch sample data from file
            const response = await fetch('data/sample-data.json');
            if (!response.ok) {
                throw new Error(`Failed to load sample data: ${response.statusText}`);
            }
            
            const sampleData = await response.json();
            
            // Process the data
            await handleImport(sampleData, true);
            
            return true;
        } catch (error) {
            console.error('Error loading sample data:', error);
            throw error;
        }
    };

    /**
     * Handle importing data from JSON
     * @param {Object} data - The data to import
     * @param {boolean} overwrite - Whether to overwrite existing data
     * @returns {Promise<boolean>} Success status
     */
    const handleImport = async (data, overwrite = false) => {
        try {
            // Create teams
            if (data.teams && Array.isArray(data.teams)) {
                for (const team of data.teams) {
                    try {
                        await Database.create(Database.STORES.TEAMS, team);
                    } catch (error) {
                        if (overwrite && error.message.includes('already exists')) {
                            await Database.update(Database.STORES.TEAMS, team);
                        } else {
                            console.warn(`Error importing team: ${error.message}`);
                        }
                    }
                }
            }
            
            // Create services
            if (data.services && Array.isArray(data.services)) {
                for (const service of data.services) {
                    try {
                        await Database.create(Database.STORES.SERVICES, service);
                    } catch (error) {
                        if (overwrite && error.message.includes('already exists')) {
                            await Database.update(Database.STORES.SERVICES, service);
                        } else {
                            console.warn(`Error importing service: ${error.message}`);
                        }
                    }
                }
            }
            
            // Create CUJs
            if (data.cujs && Array.isArray(data.cujs)) {
                for (const cuj of data.cujs) {
                    try {
                        await Database.create(Database.STORES.CUJS, cuj);
                    } catch (error) {
                        if (overwrite && error.message.includes('already exists')) {
                            await Database.update(Database.STORES.CUJS, cuj);
                        } else {
                            console.warn(`Error importing CUJ: ${error.message}`);
                        }
                    }
                }
            }
            
            // Create SLOs
            if (data.slos && Array.isArray(data.slos)) {
                for (const slo of data.slos) {
                    try {
                        await Database.create(Database.STORES.SLOS, slo);
                    } catch (error) {
                        if (overwrite && error.message.includes('already exists')) {
                            await Database.update(Database.STORES.SLOS, slo);
                        } else {
                            console.warn(`Error importing SLO: ${error.message}`);
                        }
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error during import:', error);
            throw error;
        }
    };
    
    // Initialize state
    const init = () => {
        // Responsive sidebar state
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                setState('ui.isSidebarOpen', false, true); // Silent update
            }
        });
        
        // Load initial data
        loadAllData();
    };
    
    // Public API
    return {
        init,
        getState,
        setState,
        subscribe,
        showLoading,
        hideLoading,
        showNotification,
        hideNotification,
        showModal,
        hideModal,
        loadTeams,
        loadServices,
        loadCUJs,
        loadSLOs,
        loadSLIs,
        loadAllData,
        setFilters,
        clearFilters,
        toggleSidebar,
        handleLoadSampleData,
        handleImport
    };
})();

// Initialize state manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Database and Auth to initialize first
    setTimeout(() => {
        State.init();
        console.log('State manager initialized');
    }, 300);
}); 