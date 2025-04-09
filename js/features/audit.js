/**
 * Audit Feature Module for Corgi SLO Manager
 */

console.log('Audit module loading...');

// Make sure to expose auditModule in the global scope
window.auditModule = (function() {
    let auditLogs = [];
    
    /**
     * Initialize the audit module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Audit module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            auditLogs = await Database.getAll(Database.STORES.AUDIT_LOGS);
            renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing audit module:', error);
            return false;
        }
    };
    
    /**
     * Get all audit logs
     * @returns {Array} Array of audit logs
     */
    const getAllLogs = () => {
        return auditLogs;
    };
    
    /**
     * Get audit logs for a specific entity
     * @param {string} entityUID - Entity UID
     * @returns {Array} Array of audit logs for the entity
     */
    const getLogsForEntity = (entityUID) => {
        return auditLogs.filter(log => log.entityUID === entityUID);
    };
    
    /**
     * Get audit logs for a specific user
     * @param {string} userUID - User UID
     * @returns {Array} Array of audit logs for the user
     */
    const getLogsForUser = (userUID) => {
        return auditLogs.filter(log => log.userUID === userUID);
    };
    
    /**
     * Create a new audit log entry
     * @param {string} entityType - Type of entity (team, service, cuj, sli, slo)
     * @param {string} entityUID - Entity UID
     * @param {string} action - Action performed (create, update, delete)
     * @param {string} userUID - User UID
     * @param {Object} details - Additional details
     * @returns {Promise<string>} Log UID
     */
    const createLog = async (entityType, entityUID, action, userUID, details = {}) => {
        const log = {
            logUID: Database.generateUID('log'),
            entityType,
            entityUID,
            action,
            userUID,
            details,
            timestamp: new Date().toISOString()
        };
        
        const logUID = await Database.create(Database.STORES.AUDIT_LOGS, log);
        auditLogs.push(log);
        return logUID;
    };
    
    /**
     * Render the audit view
     * @param {HTMLElement} container - Container element
     */
    const renderView = (container) => {
        container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.classList.add('section-header');
        header.innerHTML = `
            <h2>Audit Logs</h2>
            <div class="filter-controls">
                <select id="entity-type-filter">
                    <option value="">All Entity Types</option>
                    <option value="team">Teams</option>
                    <option value="service">Services</option>
                    <option value="cuj">CUJs</option>
                    <option value="sli">SLIs</option>
                    <option value="slo">SLOs</option>
                </select>
                <select id="action-filter">
                    <option value="">All Actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                </select>
            </div>
        `;
        container.appendChild(header);
        
        // Create audit logs table
        const table = UI.createTable(
            ['Timestamp', 'Entity Type', 'Action', 'User', 'Details'],
            auditLogs,
            log => log.logUID,
            log => {
                // Handle row click
                console.log('Log clicked:', log);
            }
        );
        container.appendChild(table);
        
        // Add event listeners for filters
        const entityTypeFilter = document.getElementById('entity-type-filter');
        const actionFilter = document.getElementById('action-filter');
        
        if (entityTypeFilter) {
            entityTypeFilter.addEventListener('change', () => {
                // TODO: Filter logs by entity type
                console.log('Entity type filter changed:', entityTypeFilter.value);
            });
        }
        
        if (actionFilter) {
            actionFilter.addEventListener('change', () => {
                // TODO: Filter logs by action
                console.log('Action filter changed:', actionFilter.value);
            });
        }
    };
    
    // Public API
    return {
        init,
        getAllLogs,
        getLogsForEntity,
        getLogsForUser,
        createLog,
        renderView
    };
})();

console.log('Audit module loaded, module object:', window.auditModule); 