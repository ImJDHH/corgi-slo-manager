/**
 * API Module for Corgi SLO Manager
 * Provides a clean interface for interacting with the Database module.
 */

const API = (function() {
    /**
     * Create a new team
     * @param {Object} teamData - Team data without teamUID
     * @returns {Promise<string>} - UID of created team
     */
    const createTeam = async (teamData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_TEAMS')) {
                throw new Error('Permission denied: Cannot create teams');
            }
            
            // Prepare team data
            const team = {
                teamUID: Database.generateUID('team'),
                ...teamData,
                createdAt: new Date().toISOString(),
                createdBy: Auth.getCurrentUser().userUID
            };
            
            // Create team
            const teamUID = await Database.create(Database.STORES.TEAMS, team);
            
            // Log the action
            await Database.logAudit(
                'team',
                teamUID,
                'create',
                Auth.getCurrentUser().userUID,
                { name: team.name }
            );
            
            return teamUID;
        } catch (error) {
            throw new Error(`Failed to create team: ${error.message}`);
        }
    };
    
    /**
     * Update a team
     * @param {Object} teamData - Team data with teamUID
     * @returns {Promise<Object>} - Updated team
     */
    const updateTeam = async (teamData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_TEAMS')) {
                throw new Error('Permission denied: Cannot update teams');
            }
            
            // Get current team data
            const existingTeam = await Database.get(Database.STORES.TEAMS, teamData.teamUID);
            
            // Prepare update data
            const updatedTeam = {
                ...existingTeam,
                ...teamData,
                updatedAt: new Date().toISOString(),
                updatedBy: Auth.getCurrentUser().userUID
            };
            
            // Update team
            await Database.update(Database.STORES.TEAMS, updatedTeam);
            
            // Log the action
            await Database.logAudit(
                'team',
                teamData.teamUID,
                'update',
                Auth.getCurrentUser().userUID,
                { name: updatedTeam.name }
            );
            
            return updatedTeam;
        } catch (error) {
            throw new Error(`Failed to update team: ${error.message}`);
        }
    };
    
    /**
     * Delete a team
     * @param {string} teamUID - Team UID to delete
     * @returns {Promise<void>}
     */
    const deleteTeam = async (teamUID) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_TEAMS')) {
                throw new Error('Permission denied: Cannot delete teams');
            }
            
            // Get team data for logging
            const team = await Database.get(Database.STORES.TEAMS, teamUID);
            
            // First check if team has any services
            const services = await Database.query(Database.STORES.SERVICES, 'teamUID', teamUID);
            
            if (services.length > 0) {
                throw new Error('Cannot delete team with existing services. Please delete the services first.');
            }
            
            // Delete team
            await Database.remove(Database.STORES.TEAMS, teamUID);
            
            // Log the action
            await Database.logAudit(
                'team',
                teamUID,
                'delete',
                Auth.getCurrentUser().userUID,
                { name: team.name }
            );
        } catch (error) {
            throw new Error(`Failed to delete team: ${error.message}`);
        }
    };
    
    /**
     * Create a new service
     * @param {Object} serviceData - Service data without serviceUID
     * @returns {Promise<string>} - UID of created service
     */
    const createService = async (serviceData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_SERVICES')) {
                throw new Error('Permission denied: Cannot create services');
            }
            
            // Verify team exists
            await Database.get(Database.STORES.TEAMS, serviceData.teamUID);
            
            // Prepare service data
            const service = {
                serviceUID: Database.generateUID('service'),
                ...serviceData,
                createdAt: new Date().toISOString(),
                createdBy: Auth.getCurrentUser().userUID
            };
            
            // Create service
            const serviceUID = await Database.create(Database.STORES.SERVICES, service);
            
            // Log the action
            await Database.logAudit(
                'service',
                serviceUID,
                'create',
                Auth.getCurrentUser().userUID,
                { name: service.name, teamUID: service.teamUID }
            );
            
            return serviceUID;
        } catch (error) {
            throw new Error(`Failed to create service: ${error.message}`);
        }
    };
    
    /**
     * Update a service
     * @param {Object} serviceData - Service data with serviceUID
     * @returns {Promise<Object>} - Updated service
     */
    const updateService = async (serviceData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_SERVICES')) {
                throw new Error('Permission denied: Cannot update services');
            }
            
            // Get current service data
            const existingService = await Database.get(Database.STORES.SERVICES, serviceData.serviceUID);
            
            // Prepare update data
            const updatedService = {
                ...existingService,
                ...serviceData,
                updatedAt: new Date().toISOString(),
                updatedBy: Auth.getCurrentUser().userUID
            };
            
            // Update service
            await Database.update(Database.STORES.SERVICES, updatedService);
            
            // Log the action
            await Database.logAudit(
                'service',
                serviceData.serviceUID,
                'update',
                Auth.getCurrentUser().userUID,
                { name: updatedService.name }
            );
            
            return updatedService;
        } catch (error) {
            throw new Error(`Failed to update service: ${error.message}`);
        }
    };
    
    /**
     * Delete a service
     * @param {string} serviceUID - Service UID to delete
     * @returns {Promise<void>}
     */
    const deleteService = async (serviceUID) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_SERVICES')) {
                throw new Error('Permission denied: Cannot delete services');
            }
            
            // Get service data for logging
            const service = await Database.get(Database.STORES.SERVICES, serviceUID);
            
            // First check if service has any CUJs
            const cujs = await Database.query(Database.STORES.CUJS, 'serviceUID', serviceUID);
            
            if (cujs.length > 0) {
                throw new Error('Cannot delete service with existing CUJs. Please delete the CUJs first.');
            }
            
            // Delete service
            await Database.remove(Database.STORES.SERVICES, serviceUID);
            
            // Log the action
            await Database.logAudit(
                'service',
                serviceUID,
                'delete',
                Auth.getCurrentUser().userUID,
                { name: service.name }
            );
        } catch (error) {
            throw new Error(`Failed to delete service: ${error.message}`);
        }
    };
    
    /**
     * Create a new CUJ (Critical User Journey)
     * @param {Object} cujData - CUJ data without cujUID
     * @returns {Promise<string>} - UID of created CUJ
     */
    const createCUJ = async (cujData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_CUJS')) {
                throw new Error('Permission denied: Cannot create CUJs');
            }
            
            // Verify service exists
            await Database.get(Database.STORES.SERVICES, cujData.serviceUID);
            
            // Prepare CUJ data
            const cuj = {
                cujUID: Database.generateUID('cuj'),
                ...cujData,
                status: 'pending', // All CUJs start in pending status
                createdAt: new Date().toISOString(),
                createdBy: Auth.getCurrentUser().userUID
            };
            
            // Create CUJ
            const cujUID = await Database.create(Database.STORES.CUJS, cuj);
            
            // Log the action
            await Database.logAudit(
                'cuj',
                cujUID,
                'create',
                Auth.getCurrentUser().userUID,
                { name: cuj.name, serviceUID: cuj.serviceUID }
            );
            
            return cujUID;
        } catch (error) {
            throw new Error(`Failed to create CUJ: ${error.message}`);
        }
    };
    
    /**
     * Update a CUJ
     * @param {Object} cujData - CUJ data with cujUID
     * @returns {Promise<Object>} - Updated CUJ
     */
    const updateCUJ = async (cujData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_CUJS')) {
                throw new Error('Permission denied: Cannot update CUJs');
            }
            
            // Get current CUJ data
            const existingCUJ = await Database.get(Database.STORES.CUJS, cujData.cujUID);
            
            // Don't allow updating approved CUJs unless you're an admin or team owner
            if (existingCUJ.status === 'active' && 
                !Auth.hasPermission('APPROVE_CUJS')) {
                throw new Error('Cannot update an approved CUJ');
            }
            
            // Prepare update data
            const updatedCUJ = {
                ...existingCUJ,
                ...cujData,
                updatedAt: new Date().toISOString(),
                updatedBy: Auth.getCurrentUser().userUID
            };
            
            // If status is changing to active, add approval info
            if (cujData.status === 'active' && existingCUJ.status !== 'active') {
                if (!Auth.hasPermission('APPROVE_CUJS')) {
                    throw new Error('Permission denied: Cannot approve CUJs');
                }
                
                updatedCUJ.approvedAt = new Date().toISOString();
                updatedCUJ.approvedBy = Auth.getCurrentUser().userUID;
            }
            
            // Update CUJ
            await Database.update(Database.STORES.CUJS, updatedCUJ);
            
            // Log the action with appropriate action type
            let actionType = 'update';
            if (cujData.status === 'active' && existingCUJ.status !== 'active') {
                actionType = 'approve';
            } else if (cujData.status === 'rejected' && existingCUJ.status !== 'rejected') {
                actionType = 'reject';
            }
            
            await Database.logAudit(
                'cuj',
                cujData.cujUID,
                actionType,
                Auth.getCurrentUser().userUID,
                { name: updatedCUJ.name, status: updatedCUJ.status }
            );
            
            return updatedCUJ;
        } catch (error) {
            throw new Error(`Failed to update CUJ: ${error.message}`);
        }
    };
    
    /**
     * Delete a CUJ
     * @param {string} cujUID - CUJ UID to delete
     * @returns {Promise<void>}
     */
    const deleteCUJ = async (cujUID) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_CUJS')) {
                throw new Error('Permission denied: Cannot delete CUJs');
            }
            
            // Get CUJ data for logging and permission check
            const cuj = await Database.get(Database.STORES.CUJS, cujUID);
            
            // Don't allow deleting approved CUJs unless you're an admin or team owner
            if (cuj.status === 'active' && 
                !Auth.hasPermission('APPROVE_CUJS')) {
                throw new Error('Cannot delete an approved CUJ');
            }
            
            // First check if CUJ has any SLIs
            // SLI data is now embedded directly in SLOs, so we don't need to query a separate SLIs store
            
            // Delete CUJ
            await Database.remove(Database.STORES.CUJS, cujUID);
            
            // Log the action
            await Database.logAudit(
                'cuj',
                cujUID,
                'delete',
                Auth.getCurrentUser().userUID,
                { name: cuj.name }
            );
        } catch (error) {
            throw new Error(`Failed to delete CUJ: ${error.message}`);
        }
    };
    
    /**
     * Create a new SLO with embedded SLI data
     * @param {Object} sloData - SLO data without sloUID
     * @returns {Promise<string>} - UID of created SLO
     */
    const createSLO = async (sloData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_SLOS')) {
                throw new Error('Permission denied: Cannot create SLOs');
            }
            
            // Verify CUJ exists
            const cuj = await Database.get(Database.STORES.CUJS, sloData.cujUID);
            
            // Get service details
            const service = await Database.get(Database.STORES.SERVICES, cuj.serviceUID);
            
            // Add service name for display convenience
            sloData.serviceName = service.name;
            
            // Prepare SLO data
            const currentUser = Auth.getCurrentUser();
            const slo = {
                sloUID: Database.generateUID('slo'),
                ...sloData,
                status: sloData.status || 'draft',
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                modifiedBy: currentUser.name,
                authors: [currentUser.name],
                history: [
                    {
                        action: 'created',
                        timestamp: new Date().toISOString(),
                        user: currentUser.name,
                        details: 'SLO created'
                    }
                ]
            };
            
            // Create SLO
            const sloUID = await Database.create(Database.STORES.SLOS, slo);
            
            // Log the action
            await Database.logAudit(
                'slo',
                sloUID,
                'create',
                currentUser.userUID,
                { name: slo.name, cujUID: slo.cujUID }
            );
            
            return sloUID;
        } catch (error) {
            throw new Error(`Failed to create SLO: ${error.message}`);
        }
    };
    
    /**
     * Update an SLO
     * @param {Object} sloData - SLO data with sloUID
     * @returns {Promise<Object>} - Updated SLO
     */
    const updateSLO = async (sloData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_SLOS')) {
                throw new Error('Permission denied: Cannot update SLOs');
            }
            
            // Get current SLO data
            const existingSLO = await Database.get(Database.STORES.SLOS, sloData.sloUID);
            
            // Keep history from existing SLO
            const history = existingSLO.history || [];
            const authors = existingSLO.authors || [];
            const currentUser = Auth.getCurrentUser();
            
            // Add history entry
            history.push({
                action: 'updated',
                timestamp: new Date().toISOString(),
                user: currentUser.name,
                details: 'SLO updated'
            });
            
            // Add author if not already in the list
            if (!authors.includes(currentUser.name)) {
                authors.push(currentUser.name);
            }
            
            // Prepare update data
            const updatedSLO = {
                ...existingSLO,
                ...sloData,
                history,
                authors,
                modifiedAt: new Date().toISOString(),
                modifiedBy: currentUser.name
            };
            
            // Add approval info if being approved
            if (sloData.status === 'active' && existingSLO.status !== 'active') {
                updatedSLO.approvedAt = new Date().toISOString();
                updatedSLO.approvedBy = currentUser.name;
                
                // Add approval to history
                updatedSLO.history.push({
                    action: 'approved',
                    timestamp: updatedSLO.approvedAt,
                    user: currentUser.name,
                    details: 'SLO approved and activated'
                });
            }
            
            // Update SLO
            await Database.update(Database.STORES.SLOS, updatedSLO);
            
            // Log the action
            await Database.logAudit(
                'slo',
                sloData.sloUID,
                'update',
                currentUser.userUID,
                { name: updatedSLO.name, status: updatedSLO.status }
            );
            
            return updatedSLO;
        } catch (error) {
            throw new Error(`Failed to update SLO: ${error.message}`);
        }
    };
    
    /**
     * Delete an SLO
     * @param {string} sloUID - SLO UID to delete
     * @returns {Promise<void>}
     */
    const deleteSLO = async (sloUID) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('MANAGE_SLOS')) {
                throw new Error('Permission denied: Cannot delete SLOs');
            }
            
            // Get SLO data for logging
            const slo = await Database.get(Database.STORES.SLOS, sloUID);
            
            // Delete SLO
            await Database.remove(Database.STORES.SLOS, sloUID);
            
            // Log the action
            await Database.logAudit(
                'slo',
                sloUID,
                'delete',
                Auth.getCurrentUser().userUID,
                { name: slo.name }
            );
        } catch (error) {
            throw new Error(`Failed to delete SLO: ${error.message}`);
        }
    };
    
    /**
     * Get audit logs
     * @param {string} entityUID - Entity UID to get logs for
     * @param {string} [entityType] - Optional entity type filter
     * @returns {Promise<Array>} - Audit logs
     */
    const getAuditLogs = async (entityUID, entityType = null) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('VIEW_AUDIT_LOGS')) {
                throw new Error('Permission denied: Cannot view audit logs');
            }
            
            // Get logs
            const logs = await Database.getAuditLogs(entityUID);
            
            // Filter by entity type if provided
            if (entityType) {
                return logs.filter(log => log.entityType === entityType);
            }
            
            return logs;
        } catch (error) {
            throw new Error(`Failed to get audit logs: ${error.message}`);
        }
    };
    
    /**
     * Export the database
     * @returns {Promise<Object>} - Database data
     */
    const exportDatabase = async () => {
        try {
            // Check permissions
            if (!Auth.hasPermission('EXPORT_DATABASE')) {
                throw new Error('Permission denied: Cannot export database');
            }
            
            // Export database
            const exportData = await Database.exportDatabase();
            
            // Log the action
            await Database.logAudit(
                'system',
                'database',
                'export',
                Auth.getCurrentUser().userUID,
                { timestamp: new Date().toISOString() }
            );
            
            return exportData;
        } catch (error) {
            throw new Error(`Failed to export database: ${error.message}`);
        }
    };
    
    /**
     * Import database data
     * @param {Object} importData - Data to import
     * @returns {Promise<boolean>} - Success status
     */
    const importDatabase = async (importData) => {
        try {
            // Check permissions
            if (!Auth.hasPermission('IMPORT_DATABASE')) {
                throw new Error('Permission denied: Cannot import database');
            }
            
            // Import database
            await Database.importDatabase(importData);
            
            // Log already happens in the Database module
            
            return true;
        } catch (error) {
            throw new Error(`Failed to import database: ${error.message}`);
        }
    };
    
    // Public API
    return {
        // Teams
        createTeam,
        updateTeam,
        deleteTeam,
        
        // Services
        createService,
        updateService,
        deleteService,
        
        // CUJs
        createCUJ,
        updateCUJ,
        deleteCUJ,
        
        // SLOs
        createSLO,
        updateSLO,
        deleteSLO,
        
        // Audit logs
        getAuditLogs,
        
        // Database operations
        exportDatabase,
        importDatabase
    };
})(); 