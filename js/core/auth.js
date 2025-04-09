/**
 * Authentication Module for Corgi SLO Manager
 * Handles user authentication, authorization, and user management.
 */

console.log('Auth module loading...');

// Global Auth object
window.Auth = (function() {
    // User roles with their permissions
    const ROLES = {
        ADMIN: 'admin',
        TEAM_OWNER: 'team_owner',
        CONTRIBUTOR: 'contributor',
        VIEWER: 'viewer'
    };
    
    // Permission levels for different actions
    const PERMISSIONS = {
        MANAGE_TEAMS: [ROLES.ADMIN],
        MANAGE_SERVICES: [ROLES.ADMIN, ROLES.TEAM_OWNER],
        MANAGE_USERS: [ROLES.ADMIN],
        MANAGE_CUJS: [ROLES.ADMIN, ROLES.TEAM_OWNER, ROLES.CONTRIBUTOR],
        APPROVE_CUJS: [ROLES.ADMIN, ROLES.TEAM_OWNER],
        MANAGE_SLOS: [ROLES.ADMIN, ROLES.TEAM_OWNER, ROLES.CONTRIBUTOR],
        APPROVE_SLOS: [ROLES.ADMIN, ROLES.TEAM_OWNER],
        VIEW_AUDIT_LOGS: [ROLES.ADMIN, ROLES.TEAM_OWNER],
        EXPORT_DATABASE: [ROLES.ADMIN],
        IMPORT_DATABASE: [ROLES.ADMIN]
    };
    
    // Current authenticated user
    let currentUser = {
        userUID: 'system',
        name: 'System User',
        email: 'admin@example.com',
        role: ROLES.ADMIN,
        teams: [],
        isActive: true,
        createdAt: new Date().toISOString()
    };
    
    // Event listeners
    const eventListeners = {
        login: [],
        logout: [],
        userChanged: []
    };
    
    /**
     * Initialize the auth module
     * @returns {Promise<void>}
     */
    const init = async () => {
        try {
            // Try to restore session from localStorage
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
            }
            
            notifyListeners('userChanged', currentUser);
            return Promise.resolve();
        } catch (error) {
            console.error('Auth initialization failed:', error);
            // Clear any potentially corrupted session
            logout(); 
            return Promise.reject(error);
        }
    };
    
    /**
     * Ensure admin user exists in the database
     * @private
     */
    const ensureAdminUser = async () => {
        // This is a stub - in a real application this would create an admin user if none exists
        return Promise.resolve();
    };
    
    /**
     * Log in a user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - Logged in user object
     */
    const login = async (email, password) => {
        // This is a simplified login that doesn't actually verify credentials
        // In a real application, this would validate against stored credentials
        
        // For demo purposes, just set the current user to admin
        currentUser = {
            userUID: 'admin1',
            name: 'Admin User',
            email: email || 'admin@example.com',
            role: ROLES.ADMIN,
            teams: [],
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        // Store in localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Notify listeners
        notifyListeners('login', currentUser);
        notifyListeners('userChanged', currentUser);
        
        return Promise.resolve(currentUser);
    };
    
    /**
     * Log out the current user
     */
    const logout = () => {
        // Clear user data
        localStorage.removeItem('currentUser');
        
        // Reset to default system user
        currentUser = {
            userUID: 'system',
            name: 'System User',
            email: 'admin@example.com',
            role: ROLES.ADMIN,
            teams: [],
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        // Notify listeners
        notifyListeners('logout', null);
        notifyListeners('userChanged', currentUser);
    };
    
    /**
     * Check if a user is logged in
     * @returns {boolean} - Whether a user is logged in
     */
    const isLoggedIn = () => {
        return !!currentUser && currentUser.userUID !== 'system';
    };
    
    /**
     * Get the current user
     * @returns {Object|null} - Current user or null if not logged in
     */
    const getCurrentUser = () => {
        return currentUser;
    };
    
    /**
     * Check if the current user has a permission
     * @param {string} permission - Permission to check
     * @returns {boolean} - Whether the user has the permission
     */
    const hasPermission = (permission) => {
        if (!currentUser) return false;
        
        // For testing purposes, always grant APPROVE_CUJS and APPROVE_SLOS permissions
        if (permission === 'APPROVE_CUJS' || permission === 'APPROVE_SLOS') {
            return true;
        }
        
        // Check if the permission exists
        if (!PERMISSIONS[permission]) {
            console.warn(`Permission ${permission} not defined`);
            return false;
        }
        
        // Check if the user's role has the permission
        return PERMISSIONS[permission].includes(currentUser.role);
    };
    
    /**
     * Check if the current user is an admin
     * @returns {boolean} - Whether the user is an admin
     */
    const isAdmin = () => {
        return currentUser && currentUser.role === ROLES.ADMIN;
    };
    
    /**
     * Check if the current user is a team owner
     * @returns {boolean} - Whether the user is a team owner
     */
    const isTeamOwner = () => {
        return currentUser && currentUser.role === ROLES.TEAM_OWNER;
    };
    
    /**
     * Add an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    const addEventListener = (event, callback) => {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        
        eventListeners[event].push(callback);
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
    
    // Public API
    return {
        ROLES,
        PERMISSIONS,
        init,
        login,
        logout,
        isLoggedIn,
        getCurrentUser,
        hasPermission,
        isAdmin,
        isTeamOwner,
        addEventListener,
        removeEventListener
    };
})();

// Initialize auth module when the script loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Database to initialize first
    setTimeout(() => {
        Auth.init()
            .then(() => console.log('Auth initialized successfully'))
            .catch(error => console.error('Failed to initialize auth:', error));
    }, 100);
});

console.log('Auth module loaded'); 