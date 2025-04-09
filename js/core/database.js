/**
 * Database Module for Corgi SLO Manager
 * Uses IndexedDB for client-side storage with export/import functionality.
 */

const Database = (function() {
    // Database constants
    const DB_NAME = 'CorgiSLOManager';
    const DB_VERSION = 3; // Increase version for schema change
    
    // Store names
    const STORES = {
        TEAMS: 'teams',
        SERVICES: 'services', 
        CUJS: 'cujs',
        SLOS: 'slos',
        AUDIT_LOGS: 'auditLogs',
        USERS: 'users',
        ACTIVITIES: 'activities'
    };
    
    // IndexedDB instance
    let db = null;

    /**
     * Initialize the database by creating object stores and indexes
     * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance
     */
    const init = () => {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }
            
            if (!window.indexedDB) {
                reject(new Error('Your browser does not support IndexedDB, which is required for this application.'));
                return;
            }
            
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = (event) => {
                reject(new Error(`Database error: ${event.target.error}`));
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                
                // Log when database is disconnected
                db.onversionchange = () => {
                    db.close();
                    alert('Database is outdated, please reload the page.');
                };
                
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create Teams store
                if (!db.objectStoreNames.contains(STORES.TEAMS)) {
                    const teamStore = db.createObjectStore(STORES.TEAMS, { keyPath: 'teamUID' });
                    teamStore.createIndex('name', 'name', { unique: true });
                    teamStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Create Services store
                if (!db.objectStoreNames.contains(STORES.SERVICES)) {
                    const serviceStore = db.createObjectStore(STORES.SERVICES, { keyPath: 'serviceUID' });
                    serviceStore.createIndex('name', 'name', { unique: true });
                    serviceStore.createIndex('teamUID', 'teamUID', { unique: false });
                    serviceStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Create CUJs store
                if (!db.objectStoreNames.contains(STORES.CUJS)) {
                    const cujStore = db.createObjectStore(STORES.CUJS, { keyPath: 'cujUID' });
                    cujStore.createIndex('name', 'name', { unique: false });
                    cujStore.createIndex('serviceUID', 'serviceUID', { unique: false });
                    cujStore.createIndex('status', 'status', { unique: false });
                    cujStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Remove old SLIs store if exists as part of the migration
                if (db.objectStoreNames.contains('slis')) {
                    db.deleteObjectStore('slis');
                }
                
                // Check if we need to recreate the SLOs store with updated schema
                if (db.objectStoreNames.contains(STORES.SLOS)) {
                    db.deleteObjectStore(STORES.SLOS);
                }
                
                // Create updated SLOs store with integrated SLI data
                const sloStore = db.createObjectStore(STORES.SLOS, { keyPath: 'sloUID' });
                sloStore.createIndex('name', 'name', { unique: false });
                sloStore.createIndex('cujUID', 'cujUID', { unique: false });
                sloStore.createIndex('status', 'status', { unique: false });
                sloStore.createIndex('createdAt', 'createdAt', { unique: false });
                sloStore.createIndex('serviceUID', 'serviceUID', { unique: false });
                sloStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
                sloStore.createIndex('approvedAt', 'approvedAt', { unique: false });
                
                // Create Audit Logs store
                if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
                    const auditStore = db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'logUID', autoIncrement: true });
                    auditStore.createIndex('entityType', 'entityType', { unique: false });
                    auditStore.createIndex('entityUID', 'entityUID', { unique: false });
                    auditStore.createIndex('action', 'action', { unique: false });
                    auditStore.createIndex('timestamp', 'timestamp', { unique: false });
                    auditStore.createIndex('userUID', 'userUID', { unique: false });
                }
                
                // Create Users store
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'userUID' });
                    userStore.createIndex('email', 'email', { unique: true });
                    userStore.createIndex('name', 'name', { unique: false });
                    userStore.createIndex('role', 'role', { unique: false });
                }
                
                // Create Activities store for recent activities tracking
                if (!db.objectStoreNames.contains(STORES.ACTIVITIES)) {
                    const activityStore = db.createObjectStore(STORES.ACTIVITIES, { keyPath: 'activityUID', autoIncrement: true });
                    activityStore.createIndex('entityType', 'entityType', { unique: false });
                    activityStore.createIndex('entityUID', 'entityUID', { unique: false });
                    activityStore.createIndex('action', 'action', { unique: false });
                    activityStore.createIndex('timestamp', 'timestamp', { unique: false });
                    activityStore.createIndex('userUID', 'userUID', { unique: false });
                }
            };
        });
    };
    
    /**
     * Create a new record in a store
     * @param {string} storeName - The name of the store
     * @param {Object} data - The data to create
     * @returns {Promise<string>} A promise that resolves with the UID of the created record
     */
    const create = (storeName, data) => {
        return new Promise((resolve, reject) => {
            // Make sure database is initialized
            if (!db) {
                console.error(`Cannot create record in ${storeName}: database not initialized`);
                return init()
                    .then(() => create(storeName, data))
                    .then(resolve)
                    .catch(reject);
            }
            
            // Make sure the store exists
            if (!Object.values(STORES).includes(storeName)) {
                console.error(`Cannot create record in ${storeName}: invalid store name`);
                reject(new Error(`Invalid store name: ${storeName}`));
                return;
            }

            // Validate data
            if (!data || typeof data !== 'object') {
                console.error(`Cannot create record in ${storeName}: data is not an object`, data);
                reject(new Error(`Invalid data: must be an object`));
                return;
            }

            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Check that keyPath exists in data
                const keyPath = store.keyPath;
                if (!data[keyPath] && !store.autoIncrement) {
                    console.error(`Cannot create record in ${storeName}: missing key ${keyPath}`, data);
                    reject(new Error(`Missing required key '${keyPath}' in data`));
                    return;
                }
                
                console.log(`Creating record in ${storeName}:`, data);
                const request = store.add(data);
                
                request.onsuccess = (event) => {
                    console.log(`Successfully created record in ${storeName} with ID:`, data[store.keyPath] || event.target.result);
                    resolve(data[store.keyPath] || event.target.result);
                };
                
                request.onerror = (event) => {
                    console.error(`Error creating record in ${storeName}:`, event.target.error);
                    // Check if it's a constraint error (like unique index violation)
                    if (event.target.error.name === 'ConstraintError') {
                        reject(new Error(`Record with the same unique key already exists in ${storeName}`));
                    } else {
                        reject(new Error(`Error creating record: ${event.target.error.message || event.target.error}`));
                    }
                };
                
                // Add transaction error handling
                transaction.onerror = (event) => {
                    console.error(`Transaction error when creating record in ${storeName}:`, event.target.error);
                    reject(new Error(`Transaction error: ${event.target.error.message || event.target.error}`));
                };
                
                // Add transaction abort handling
                transaction.onabort = (event) => {
                    console.error(`Transaction aborted when creating record in ${storeName}:`, event.target.error);
                    reject(new Error(`Transaction aborted: ${event.target.error.message || event.target.error}`));
                };
            } catch (error) {
                console.error(`Exception when creating record in ${storeName}:`, error);
                reject(new Error(`Exception: ${error.message}`));
            }
        });
    };
    
    /**
     * Get a record by its UID
     * @param {string} storeName - The name of the store
     * @param {string} uid - The UID of the record
     * @returns {Promise<Object>} A promise that resolves with the record
     */
    const get = (storeName, uid) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.get(uid);
            
            request.onsuccess = (event) => {
                if (!request.result) {
                    reject(new Error(`Record with UID ${uid} not found`));
                    return;
                }
                
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                reject(new Error(`Error getting record: ${event.target.error}`));
            };
        });
    };
    
    /**
     * Update a record
     * @param {string} storeName - The name of the store
     * @param {Object} data - The data to update (must include the key)
     * @returns {Promise<Object>} A promise that resolves with the updated record
     */
    const update = (storeName, data) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Check if record exists
            const keyPath = store.keyPath;
            const getRequest = store.get(data[keyPath]);
            
            getRequest.onsuccess = (event) => {
                if (!getRequest.result) {
                    reject(new Error(`Record with UID ${data[keyPath]} not found`));
                    return;
                }
                
                // Update the record
                const updateRequest = store.put(data);
                
                updateRequest.onsuccess = (event) => {
                    resolve(data);
                };
                
                updateRequest.onerror = (event) => {
                    reject(new Error(`Error updating record: ${event.target.error}`));
                };
            };
            
            getRequest.onerror = (event) => {
                reject(new Error(`Error getting record: ${event.target.error}`));
            };
        });
    };
    
    /**
     * Delete a record
     * @param {string} storeName - The name of the store
     * @param {string} uid - The UID of the record to delete
     * @returns {Promise<void>} A promise that resolves when the record is deleted
     */
    const remove = (storeName, uid) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(uid);
            
            request.onsuccess = (event) => {
                resolve();
            };
            
            request.onerror = (event) => {
                reject(new Error(`Error deleting record: ${event.target.error}`));
            };
        });
    };
    
    /**
     * Get all records from a store
     * @param {string} storeName - The name of the store
     * @returns {Promise<Array>} A promise that resolves with all records
     */
    const getAll = (storeName) => {
        return new Promise((resolve, reject) => {
            // Validate storeName is defined and valid
            if (!storeName) {
                console.error('Store name is undefined in getAll call');
                reject(new Error('Invalid store name: undefined'));
                return;
            }
            
            // Make sure the store exists in our defined stores
            if (!Object.values(STORES).includes(storeName)) {
                console.error(`Cannot get all records from ${storeName}: invalid or unsupported store name`);
                reject(new Error(`Invalid or unsupported store name: ${storeName}`));
                return;
            }
            
            // Make sure the database is initialized
            if (!db) {
                console.error(`Cannot get all records from ${storeName}: database not initialized`);
                return init()
                    .then(() => getAll(storeName))
                    .then(resolve)
                    .catch(reject);
            }
            
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.getAll();
                
                request.onsuccess = (event) => {
                    resolve(request.result);
                };
                
                request.onerror = (event) => {
                    reject(new Error(`Error getting all records: ${event.target.error}`));
                };
            } catch (error) {
                console.error(`Exception in getAll for ${storeName}:`, error);
                reject(new Error(`Exception in getAll: ${error.message}`));
            }
        });
    };
    
    /**
     * Query records by an index
     * @param {string} storeName - The name of the store
     * @param {string} indexName - The name of the index
     * @param {any} value - The value to query
     * @returns {Promise<Array>} A promise that resolves with the matching records
     */
    const query = (storeName, indexName, value) => {
        return new Promise((resolve, reject) => {
            // Validate storeName and indexName
            if (!storeName) {
                console.error('Store name is undefined in query call');
                reject(new Error('Invalid store name: undefined'));
                return;
            }
            
            if (!indexName) {
                console.error('Index name is undefined in query call');
                reject(new Error('Invalid index name: undefined'));
                return;
            }
            
            // Make sure the store exists in our defined stores
            if (!Object.values(STORES).includes(storeName)) {
                console.error(`Cannot query ${storeName}: invalid or unsupported store name`);
                reject(new Error(`Invalid or unsupported store name: ${storeName}`));
                return;
            }
            
            // Make sure the database is initialized
            if (!db) {
                console.error(`Cannot query ${storeName}: database not initialized`);
                return init()
                    .then(() => query(storeName, indexName, value))
                    .then(resolve)
                    .catch(reject);
            }
            
            try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                
                const request = index.getAll(value);
                
                request.onsuccess = (event) => {
                    resolve(request.result);
                };
                
                request.onerror = (event) => {
                    reject(new Error(`Error querying records: ${event.target.error}`));
                };
            } catch (error) {
                console.error(`Exception in query for ${storeName}.${indexName}:`, error);
                reject(new Error(`Exception in query: ${error.message}`));
            }
        });
    };
    
    /**
     * Log an audit entry
     * @param {string} entityType - The type of entity (team, service, cuj, sli, slo)
     * @param {string} entityUID - The UID of the entity
     * @param {string} action - The action performed (create, update, delete, approve, reject)
     * @param {string} userUID - The UID of the user who performed the action
     * @param {Object} details - Additional details about the action
     * @returns {Promise<string>} A promise that resolves with the log UID
     */
    const logAudit = (entityType, entityUID, action, userUID, details = {}) => {
        const logEntry = {
            entityType,
            entityUID,
            action,
            userUID,
            details,
            timestamp: new Date().toISOString()
        };
        
        return create(STORES.AUDIT_LOGS, logEntry);
    };
    
    /**
     * Get audit logs for an entity
     * @param {string} entityUID - The UID of the entity
     * @returns {Promise<Array>} A promise that resolves with the audit logs
     */
    const getAuditLogs = (entityUID) => {
        return query(STORES.AUDIT_LOGS, 'entityUID', entityUID);
    };
    
    /**
     * Export the entire database
     * @returns {Promise<Object>} A promise that resolves with the database data
     */
    const exportDatabase = () => {
        return new Promise(async (resolve, reject) => {
            try {
                const data = {};
                
                // Export each store
                for (const storeName of Object.values(STORES)) {
                    if (db.objectStoreNames.contains(storeName)) {
                        data[storeName] = await getAll(storeName);
                    }
                }
                
                resolve(data);
            } catch (error) {
                console.error('Error exporting database:', error);
                reject(error);
            }
        });
    };
    
    /**
     * Import database from JSON
     * @param {Object} data - The data to import
     * @returns {Promise<void>} A promise that resolves when the import is complete
     */
    const importDatabase = (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                // Import each store
                for (const [storeName, items] of Object.entries(data)) {
                    if (db.objectStoreNames.contains(storeName) && Array.isArray(items)) {
                        // Clear the store first
                        await clearStore(storeName);
                        
                        // Add each item
                        for (const item of items) {
                            try {
                                await create(storeName, item);
                            } catch (e) {
                                console.warn(`Error importing item to ${storeName}:`, e);
                                // Continue with next item
                            }
                        }
                    }
                }
                
                resolve();
            } catch (error) {
                console.error('Error importing database:', error);
                reject(error);
            }
        });
    };
    
    /**
     * Clear a store
     * @param {string} storeName - The name of the store to clear
     * @returns {Promise<void>} A promise that resolves when the store is cleared
     */
    const clearStore = (storeName) => {
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve();
                };
                
                request.onerror = (event) => {
                    reject(new Error(`Error clearing store ${storeName}: ${event.target.error}`));
                };
            } catch (error) {
                console.error(`Error clearing store ${storeName}:`, error);
                reject(error);
            }
        });
    };
    
    /**
     * Generate a unique ID for a specific entity type
     * @param {string} entityType - The type of entity (team, service, cuj, sli, slo)
     * @returns {string} A unique ID with the format {entityType}-{timestamp}-{random}
     */
    const generateUID = (entityType) => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${entityType}-${timestamp}-${random}`;
    };
    
    // Public API
    return {
        STORES,
        init,
        create,
        get,
        update,
        remove,
        getAll,
        query,
        logAudit,
        getAuditLogs,
        exportDatabase,
        importDatabase,
        generateUID,
        clearStore
    };
})();

// Initialize database when the script loads
document.addEventListener('DOMContentLoaded', () => {
    Database.init()
        .then(() => console.log('Database initialized successfully'))
        .catch(error => console.error('Failed to initialize database:', error));
}); 