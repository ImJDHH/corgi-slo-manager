/**
 * SLOs Feature Module for Corgi SLO Manager
 * Updated to include integrated SLI data within each SLO
 */

console.log('SLOs module loading...');

// Make sure to expose slosModule in the global scope
window.slosModule = (function() {
    let slos = [];
    let allTeams = [];
    let currentTeamFilter = 'all'; // Default to show all teams
    
    /**
     * Initialize the SLOs module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('SLOs module init called', { 
            container, 
            params,
            paramType: typeof params,
            hasParams: !!params,
            teamParam: params?.team
        });
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            slos = await Database.getAll(Database.STORES.SLOS);
            // Load teams for filter
            allTeams = await Database.getAll(Database.STORES.TEAMS);
            
            console.log('SLOs module loaded data:', {
                slosCount: slos.length,
                teamsCount: allTeams.length
            });
            
            // Check for team filter in URL
            if (params && params.team) {
                console.log(`Setting currentTeamFilter from params: ${params.team}`);
                currentTeamFilter = params.team;
            } else {
                console.log(`No team param found, using default: ${currentTeamFilter}`);
            }
            
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing SLOs module:', error);
            return false;
        }
    };
    
    /**
     * Get all SLOs with enriched data
     * @returns {Promise<Array>} Array of SLO objects
     */
    const getAllSLOs = async () => {
        try {
            const slos = await Database.getAll(Database.STORES.SLOS);
            console.log(`Retrieved ${slos.length} SLOs from database`);
            
            // Get related data for enrichment
            const services = await Database.getAll(Database.STORES.SERVICES);
            const teams = await Database.getAll(Database.STORES.TEAMS);
            const cujs = await Database.getAll(Database.STORES.CUJS);
            
            console.log(`Retrieved related data for enrichment: ${services.length} services, ${teams.length} teams, ${cujs.length} CUJs`);
            
            const enrichedSLOs = slos.map(slo => {
                // Deep clone to avoid mutations
                slo = JSON.parse(JSON.stringify(slo));
                
                const enrichmentLog = {
                    serviceFound: false,
                    teamFound: false,
                    cujFound: false,
                    service: null,
                    team: null
                };
                
                // Add service name
                if (slo.serviceUID) {
                    const service = services.find(s => s.serviceUID === slo.serviceUID);
                    if (service) {
                        enrichmentLog.serviceFound = true;
                        enrichmentLog.service = {
                            uid: service.serviceUID,
                            name: service.name,
                            teamUID: service.teamUID
                        };
                        
                        slo.serviceName = service.name;
                        slo.serviceTier = service.tier;
                        
                        // Add team information from service
                        if (service.teamUID) {
                            const team = teams.find(t => t.teamUID === service.teamUID);
                            if (team) {
                                enrichmentLog.teamFound = true;
                                enrichmentLog.team = {
                                    uid: team.teamUID,
                                    name: team.name
                                };
                                
                                slo.teamUID = service.teamUID;
                                slo.teamName = team.name;
                            }
                        }
                    }
                }
                
                // Add CUJ name
                if (slo.cujUID) {
                    const cuj = cujs.find(c => c.cujUID === slo.cujUID);
                    if (cuj) {
                        enrichmentLog.cujFound = true;
                        slo.cujName = cuj.name;
                    }
                }
                
                // Print debug information for a sample SLO
                if (slo === slos[0]) {
                    console.log('SLO enrichment details for sample:', enrichmentLog);
                    console.log('Enriched SLO sample:', slo);
                }
                
                return slo;
            });
            
            console.log('SLOs after enrichment:', {
                count: enrichedSLOs.length,
                withTeamUID: enrichedSLOs.filter(slo => slo.teamUID).length,
                teamUIDs: [...new Set(enrichedSLOs.map(slo => slo.teamUID).filter(Boolean))],
                withCUJ: enrichedSLOs.filter(slo => slo.cujName).length
            });
            
            return enrichedSLOs;
        } catch (error) {
            console.error('Error getting SLOs:', error);
            return [];
        }
    };
    
    /**
     * Get an SLO by UID with enriched data
     * @param {string} sloUID - SLO UID
     * @returns {Promise<Object>} SLO object with enriched data
     */
    const getSLO = async (sloUID) => {
        try {
            const slo = await Database.get(Database.STORES.SLOS, sloUID);
            if (!slo) return null;
            
            // Enrich with related data
            const service = await Database.get(Database.STORES.SERVICES, slo.serviceUID);
            if (service) {
                slo.serviceName = service.name;
                slo.serviceTier = service.tier;
                
                // Get team data
                if (service.teamUID) {
                    const team = await Database.get(Database.STORES.TEAMS, service.teamUID);
                    if (team) {
                        slo.teamUID = service.teamUID;
                        slo.teamName = team.name;
                    }
                }
            }
            
            // Get CUJ data
            if (slo.cujUID) {
                const cuj = await Database.get(Database.STORES.CUJS, slo.cujUID);
                if (cuj) {
                    slo.cujName = cuj.name;
                }
            }
            
            return slo;
        } catch (error) {
            console.error(`Error retrieving SLO ${sloUID}:`, error);
            return null;
        }
    };
    
    /**
     * Create a new SLO with integrated SLI data
     * @param {Object} sloData - SLO data
     * @returns {Promise<string>} SLO UID
     */
    const createSLO = async (sloData) => {
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        const slo = {
            ...sloData,
            sloUID: Database.generateUID('slo'),
            createdAt: now,
            modifiedAt: now,
            authors: [currentUser.name || currentUser.email || currentUser.userUID],
            modifiedBy: currentUser.name || currentUser.email || currentUser.userUID,
            history: [{
                action: 'created',
                timestamp: now,
                user: currentUser.name || currentUser.email || currentUser.userUID,
                details: 'SLO created'
            }]
        };
        
        const sloUID = await Database.create(Database.STORES.SLOS, slo);
        slos.push(slo);
        return sloUID;
    };
    
    /**
     * Update an existing SLO
     * @param {Object} slo - SLO object to update
     * @returns {Promise} - Promise that resolves when SLO is updated
     */
    const updateSLO = (slo) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (!slo || !slo.sloUID) {
                    throw new Error('Invalid SLO data');
                }
                
                // Get the current user
                const currentUser = Auth.getCurrentUser();
                const now = new Date().toISOString();
                
                // Get the existing SLO to compare changes
                const existingSLO = await Database.get(Database.STORES.SLOS, slo.sloUID);
                
                // Create history entry with changes
                const changes = [];
                if (existingSLO.name !== slo.name) changes.push('name');
                if (existingSLO.description !== slo.description) changes.push('description');
                if (existingSLO.cujUID !== slo.cujUID) changes.push('CUJ reference');
                if (existingSLO.sliDescription !== slo.sliDescription) changes.push('SLI description');
                if (existingSLO.sliMetricSource !== slo.sliMetricSource) changes.push('SLI metric source');
                if (existingSLO.sliMetricName !== slo.sliMetricName) changes.push('SLI metric name');
                if (existingSLO.target !== slo.target) changes.push('target percentage');
                if (existingSLO.window !== slo.window) changes.push('evaluation window');
                
                // Track status changes specially
                let statusChanged = false;
                let oldStatus = existingSLO.status;
                let newStatus = slo.status;
                
                if (oldStatus !== newStatus) {
                    statusChanged = true;
                    changes.push('status');
                }
                
                // Update the SLO with audit information
                slo.modifiedAt = now;
                slo.modifiedBy = currentUser.name || currentUser.email || currentUser.userUID;
                
                // Add current user to authors if not already present
                const authorName = currentUser.name || currentUser.email || currentUser.userUID;
                if (!slo.authors) {
                    slo.authors = [authorName];
                } else if (!slo.authors.includes(authorName)) {
                    slo.authors.push(authorName);
                }
                
                // Add history entry
                if (!slo.history) {
                    slo.history = [];
                }
                
                // Add generic update entry
                if (changes.length > 0) {
                    slo.history.push({
                        action: 'updated',
                        timestamp: now,
                        user: authorName,
                        details: `Updated: ${changes.join(', ')}`
                    });
                }
                
                // Add specific status change entry if status changed
                if (statusChanged) {
                    slo.history.push({
                        action: 'status_changed',
                        fromStatus: oldStatus || 'draft',
                        toStatus: newStatus,
                        timestamp: now,
                        user: authorName,
                        details: `Status changed from ${getStatusText(oldStatus || 'draft')} to ${getStatusText(newStatus)}`
                    });
                }
                
                // Update in database
                await Database.update(Database.STORES.SLOS, slo);
                console.log('SLO updated successfully:', slo);
                
                // Update local cache
                const index = slos.findIndex(s => s.sloUID === slo.sloUID);
                if (index !== -1) {
                    slos[index] = slo;
                }
                
                resolve(slo);
            } catch (error) {
                console.error('Error updating SLO:', error);
                reject(error);
            }
        });
    };
    
    /**
     * Delete an SLO
     * @param {string} sloUID - SLO UID
     * @returns {Promise<void>}
     */
    const deleteSLO = async (sloUID) => {
        await Database.remove(Database.STORES.SLOS, sloUID);
        slos = slos.filter(slo => slo.sloUID !== sloUID);
    };
    
    /**
     * Approve an SLO
     * @param {string} sloUID - SLO UID
     * @returns {Promise<Object>} Updated SLO
     */
    const approveSLO = async (sloUID) => {
        const slo = await Database.get(Database.STORES.SLOS, sloUID);
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        if (!slo.approvals) {
            slo.approvals = [];
        }
        
        const approverName = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Add approval
        slo.approvals.push({
            user: approverName,
            timestamp: now,
            action: 'approved'
        });
        
        // If this is the first approval, update status
        slo.status = 'approved';
        slo.approvedAt = now;
        slo.approvedBy = approverName;
        
        // Add to history
        if (!slo.history) {
            slo.history = [];
        }
        
        slo.history.push({
            action: 'status_changed',
            fromStatus: slo.status || 'draft',
            toStatus: 'approved',
            timestamp: now,
            user: approverName,
            details: `SLO approved by ${approverName}`
        });
        
        await Database.update(Database.STORES.SLOS, slo);
        
        // Update local cache
        const index = slos.findIndex(s => s.sloUID === slo.sloUID);
        if (index !== -1) {
            slos[index] = slo;
        }
        
        // Refresh the view to show updated status in the table
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            renderView(viewContainer);
        }
        
        return slo;
    };
    
    /**
     * Deny an SLO
     * @param {string} sloUID - SLO UID
     * @param {string} reason - Reason for denial
     * @returns {Promise<Object>} Updated SLO
     */
    const denySLO = async (sloUID, reason) => {
        const slo = await Database.get(Database.STORES.SLOS, sloUID);
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        if (!slo.reviews) {
            slo.reviews = [];
        }
        
        const reviewerName = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Store original status before changing it
        const originalStatus = slo.status || 'ready-for-review';
        
        // Add denial
        slo.reviews.push({
            user: reviewerName,
            timestamp: now,
            action: 'denied',
            reason: reason
        });
        
        // Update status
        slo.status = 'denied';
        slo.deniedAt = now;
        slo.deniedBy = reviewerName;
        
        // Add to history
        if (!slo.history) {
            slo.history = [];
        }
        
        slo.history.push({
            action: 'status_changed',
            fromStatus: originalStatus,
            toStatus: 'denied',
            timestamp: now,
            user: reviewerName,
            details: `SLO denied by ${reviewerName}${reason ? ': ' + reason : ''}`
        });
        
        await Database.update(Database.STORES.SLOS, slo);
        
        // Update local cache
        const index = slos.findIndex(s => s.sloUID === slo.sloUID);
        if (index !== -1) {
            slos[index] = slo;
        }
        
        // Refresh the view to show updated status in the table
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            renderView(viewContainer);
        }
        
        return slo;
    };
    
    /**
     * Set an SLO to Ready for Review status
     * @param {string} sloUID - SLO UID
     * @returns {Promise<Object>} Updated SLO
     */
    const setReadyForReviewSLO = async (sloUID) => {
        const slo = await Database.get(Database.STORES.SLOS, sloUID);
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        // Update status
        const oldStatus = slo.status || 'draft';
        slo.status = 'ready-for-review';
        slo.readyForReviewAt = now;
        slo.readyForReviewBy = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Add to history
        if (!slo.history) {
            slo.history = [];
        }
        
        const userName = currentUser.name || currentUser.email || currentUser.userUID;
        
        slo.history.push({
            action: 'status_changed',
            fromStatus: oldStatus,
            toStatus: 'ready-for-review',
            timestamp: now,
            user: userName,
            details: `SLO marked as Ready for Review by ${userName}`
        });
        
        await Database.update(Database.STORES.SLOS, slo);
        
        // Update local cache
        const index = slos.findIndex(s => s.sloUID === slo.sloUID);
        if (index !== -1) {
            slos[index] = slo;
        }
        
        // Refresh the view to show updated status in the table
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            renderView(viewContainer);
        }
        
        return slo;
    };
    
    /**
     * Render the SLOs view
     * @param {HTMLElement} container - Container element
     */
    const renderView = async (container) => {
        console.log('Rendering SLOs view');
        
        // Show loading indicator
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        
        // Get SLOs from database
        const slos = await getAllSLOs();
        
        // If no SLOs found, show empty state
        if (slos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">bubble_chart</span>
                        <h2>No Service Level Objectives</h2>
                        <p>Create your first SLO to start tracking your service reliability.</p>
                        <button id="create-slo-btn" class="btn btn-primary">Create SLO</button>
                    </div>
                </div>
            `;
            
            // Add event listener for Create SLO button
            const createSLOBtn = document.getElementById('create-slo-btn');
            if (createSLOBtn) {
                createSLOBtn.addEventListener('click', () => {
                    showCreateSLOModal();
                });
            }
            
            return;
        }
        
        // Get route params for pagination and filtering
        const params = Router.getRouteParams();
        console.log('SLOs: Route params:', params);
        
        // Create a header with title and actions
        const header = document.createElement('header');
        header.classList.add('section-header');
        
        // Update module-level currentTeamFilter from params if present
        if (params && params.team) {
            console.log(`Updating module-level currentTeamFilter from params: ${params.team}`);
            currentTeamFilter = params.team;
        }
        
        console.log(`Current team filter (module level): ${currentTeamFilter}`);
        
        if (params.filter || currentTeamFilter !== 'all') {
            header.classList.add('filtered');
        }
        
        // Get team name for display if filtered
        const teamName = currentTeamFilter !== 'all' 
            ? allTeams.find(t => t.teamUID === currentTeamFilter)?.name || 'Unknown Team'
            : null;
        
        const headerContent = `
            <h2>Service Level Objectives${teamName ? ` <span class="filter-tag">Team: ${teamName}</span>` : ''}</h2>
            <div class="controls">
                <div class="team-filter">
                    <label for="sloTeamFilter">Team:</label>
                    <select id="sloTeamFilter">
                        <option value="all">All Teams</option>
                        <!-- Team options will be populated dynamically -->
                    </select>
                </div>
                <div class="status-filter">
                    <label for="sloStatusFilter">Status:</label>
                    <select id="sloStatusFilter">
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="ready-for-review">Ready for Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="inactive">Inactive</option>
                        <option value="experimental">Experimental</option>
                    </select>
                </div>
                <div class="actions">
                    <button id="create-slo-btn" class="btn btn-primary">Create SLO</button>
                    <button id="refresh-slos-btn" class="btn-icon" title="Refresh SLOs">
                        <span class="material-icons">refresh</span>
                    </button>
                </div>
            </div>
        `;
        
        header.innerHTML = headerContent;
        container.innerHTML = '';
        container.appendChild(header);
        
        // Populate team filter
        const teamFilter = document.getElementById('sloTeamFilter');
        if (teamFilter && allTeams) {
            // Add team options
            allTeams.sort((a, b) => a.name.localeCompare(b.name)).forEach(team => {
                const option = document.createElement('option');
                option.value = team.teamUID;
                option.textContent = team.name;
                teamFilter.appendChild(option);
            });
            
            // Set current selection
            console.log(`Setting team filter dropdown value to: ${currentTeamFilter}`);
            teamFilter.value = currentTeamFilter;
            
            // Add event listener
            teamFilter.addEventListener('change', () => {
                const selectedTeam = teamFilter.value;
                console.log(`Team filter changed to: ${selectedTeam}`, {
                    previousValue: currentTeamFilter,
                    newValue: selectedTeam,
                    allTeams: allTeams
                });
                
                // Update current team filter value
                currentTeamFilter = selectedTeam;
                
                // Use Router.navigateTo to update URL parameters
                const currentParams = Router.getRouteParams();
                const newParams = { ...currentParams };
                
                if (selectedTeam !== 'all') {
                    newParams.team = selectedTeam;
                } else {
                    delete newParams.team;
                }
                
                console.log('Updating URL params:', {
                    currentParams: currentParams,
                    newParams: newParams
                });
                
                // Get the current hash to determine the current route
                const hash = window.location.hash || '#dashboard';
                let routeName = hash.replace(/^#/, '').split('?')[0];
                if (routeName === '') routeName = 'dashboard';
                
                // Navigate to the same route but with updated parameters (this updates the URL)
                Router.navigateTo(routeName, newParams);
                
                // Important: Also refresh the table immediately without waiting for route change
                console.log('Calling renderView to refresh table immediately');
                renderView(container);
            });
        }
        
        // Add status filter event listener
        const statusFilter = document.getElementById('sloStatusFilter');
        if (statusFilter) {
            // Set current selection if it exists in URL
            const urlParams = new URLSearchParams(window.location.search);
            const statusParam = urlParams.get('sloStatus') || Router.getRouteParams().sloStatus;
            if (statusParam) {
                statusFilter.value = statusParam;
            }
            
            statusFilter.addEventListener('change', () => {
                const selectedStatus = statusFilter.value;
                
                // Update URL with status filter parameter
                const currentParams = Router.getRouteParams();
                const newParams = { ...currentParams };
                
                if (selectedStatus !== 'all') {
                    newParams.sloStatus = selectedStatus;
                } else {
                    delete newParams.sloStatus;
                }
                
                console.log('Updating URL params for status filter:', {
                    currentParams: currentParams,
                    newParams: newParams
                });
                
                // Get the current hash to determine the current route
                const hash = window.location.hash || '#dashboard';
                let routeName = hash.replace(/^#/, '').split('?')[0];
                if (routeName === '') routeName = 'dashboard';
                
                // Navigate to the same route but with updated parameters (this updates the URL)
                Router.navigateTo(routeName, newParams);
                
                // Important: Also refresh the table immediately without waiting for route change
                console.log('Calling renderView to refresh table immediately with status filter');
                renderView(container);
            });
        }
        
        // Add refresh button event listener
        const refreshButton = document.getElementById('refresh-slos-btn');
        if (refreshButton) {
            refreshButton.addEventListener('click', async () => {
                refreshButton.classList.add('rotating');
                await renderView(container);
                setTimeout(() => {
                    refreshButton.classList.remove('rotating');
                }, 500);
            });
        }
        
        // Create pagination options
        const paginationOptions = { 
            itemsPerPage: params.perPage || 10, 
            currentPage: params.page || 1,
            containerPrefix: 'slos'
        };
        
        console.log('Pagination options:', paginationOptions);
        
        // Filter SLOs if needed
        let filteredSLOs = [...slos];
        
        // Apply team filter if set
        if (currentTeamFilter !== 'all') {
            console.log(`Applying module-level team filter: ${currentTeamFilter}`, {
                beforeFiltering: filteredSLOs.length
            });
            filteredSLOs = filterSLOsByTeam(filteredSLOs, currentTeamFilter);
            console.log('After filtering:', {
                filteredCount: filteredSLOs.length
            });
        } else {
            console.log('No team filter applied, showing all SLOs');
        }
        
        // Apply status filter if set
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = Router.getRouteParams().sloStatus;
        if (statusParam && statusParam !== 'all') {
            console.log(`Applying SLO status filter: ${statusParam}`, {
                beforeFiltering: filteredSLOs.length
            });
            
            // Case-insensitive status filtering with special handling for ready-for-review/pending
            filteredSLOs = filteredSLOs.filter(slo => {
                // Make sure we have a valid status
                const sloStatus = (slo.status || 'draft').toLowerCase();
                const paramStatus = statusParam.toLowerCase();
                
                // Special handling for ready-for-review and pending (they're treated as equivalent)
                if (paramStatus === 'ready-for-review') {
                    return sloStatus === 'ready-for-review' || sloStatus === 'pending';
                }
                
                if (paramStatus === 'pending') {
                    return sloStatus === 'ready-for-review' || sloStatus === 'pending';
                }
                
                return sloStatus === paramStatus;
            });
            
            console.log('After status filtering:', {
                filteredCount: filteredSLOs.length,
                statuses: filteredSLOs.map(slo => slo.status)
            });
        } else {
            console.log('No status filter applied, showing all SLOs');
        }
        
        // Sort SLOs by most recently updated or created
        filteredSLOs.sort((a, b) => {
            // First check for updatedAt or modifiedAt (most recently edited)
            if ((a.updatedAt || a.modifiedAt) && (b.updatedAt || b.modifiedAt)) {
                const aDate = a.updatedAt || a.modifiedAt;
                const bDate = b.updatedAt || b.modifiedAt;
                return new Date(bDate) - new Date(aDate);
            } else if (a.updatedAt || a.modifiedAt) {
                return -1; // a was updated, b wasn't, so a comes first
            } else if (b.updatedAt || b.modifiedAt) {
                return 1;  // b was updated, a wasn't, so b comes first
            }
            // If neither has updatedAt or they're the same, use createdAt
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Create SLOs table with pagination
        const table = UI.createPaginatedTable(
            ['Name', 'Description', 'Team', 'Service', 'Target', 'Window', 'Status', 'Actions'],
            filteredSLOs.map(slo => ({
                ...slo,
                team: slo.teamName || 'N/A',
                service: slo.serviceName ? (slo.serviceTier ? `${slo.serviceName} (Tier ${slo.serviceTier})` : slo.serviceName) : 'N/A',
                target: formatTargetPercentage(slo.target),
                window: formatWindow(slo.window || '28d'),
                status: getStatusText(slo.status || 'draft'),
            })),
            slo => slo.sloUID,
            async slo => {
                // Handle row click
                console.log('SLO clicked:', slo);
                try {
                    const fullSLO = await getSLO(slo.sloUID);
                    if (fullSLO) {
                        showSLODetails(fullSLO);
                    } else {
                        UI.showToast('Error retrieving SLO details', 'error');
                    }
                } catch (error) {
                    console.error('Error getting SLO details:', error);
                    UI.showToast('Error loading SLO details', 'error');
                }
            },
            // Edit handler
            async slo => {
                console.log('Edit SLO from actions:', slo);
                try {
                    const fullSLO = await getSLO(slo.sloUID);
                    if (fullSLO) {
                        showEditSLOModal(fullSLO);
                    } else {
                        UI.showToast('Error retrieving SLO details for editing', 'error');
                    }
                } catch (error) {
                    console.error('Error getting SLO for edit:', error);
                    UI.showToast('Error loading SLO details for editing', 'error');
                }
            },
            // Delete handler
            slo => {
                console.log('Delete SLO from actions:', slo);
                
                // Create confirmation modal
                const confirmContent = document.createElement('div');
                confirmContent.innerHTML = `
                    <p>Are you sure you want to delete the SLO "${slo.name}"?</p>
                    <p>This action cannot be undone.</p>
                `;
                
                const deleteButton = UI.createButton('Delete', async () => {
                    try {
                        await deleteSLO(slo.sloUID);
                        UI.showToast('SLO deleted successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error deleting SLO:', error);
                        UI.showToast('Error deleting SLO', 'error');
                    }
                }, 'danger');
                
                const cancelButton = UI.createButton('Cancel', () => {
                    const modalElement = document.querySelector('.modal-overlay');
                    if (modalElement) {
                        UI.hideModal(modalElement);
                    }
                }, 'secondary');
                
                const modal = UI.createModal('Confirm Delete', confirmContent, [cancelButton, deleteButton]);
                UI.showModal(modal);
            },
            paginationOptions
        );
        
        container.appendChild(table);
        
        // Add event listener for Create SLO button
        const createSLOBtn = document.getElementById('create-slo-btn');
        if (createSLOBtn) {
            createSLOBtn.addEventListener('click', () => {
                showCreateSLOModal();
            });
        }
    };
    
    /**
     * Helper function to format window display
     */
    const formatWindow = (window) => {
        if (!window) return 'N/A';
        
        if (window === '1d' || window === 'day') return '1 day';
        if (window === '7d' || window === 'week') return '7 days';
        if (window === '28d' || window === 'month') return '28 days';
        if (window === '30d') return '30 days'; // Keep for backward compatibility
        
        return window;
    };
    
    /**
     * Helper function to format status (returns the status text only)
     * Used for table data
     */
    const getStatusText = (status) => {
        if (!status) return 'N/A';
        
        // Convert 'active' to 'approved' for display purposes
        if (status === 'active') {
            status = 'approved';
        }
        
        // Convert 'pending' to 'ready-for-review' for display purposes
        if (status === 'pending') {
            status = 'ready-for-review';
        }
        
        const statusMap = {
            'ready-for-review': 'Ready for Review',
            'approved': 'Approved',
            'draft': 'Draft',
            'inactive': 'Inactive',
            'experimental': 'Experimental',
            'denied': 'Denied'
        };
        
        return statusMap[status] || status;
    };
    
    /**
     * Helper function to format status (returns HTML with styling)
     * Used for detail views
     */
    const formatStatus = (status) => {
        if (!status) return 'N/A';
        
        // Convert 'active' to 'approved' for display purposes
        if (status === 'active') {
            status = 'approved';
        }
        
        // Convert 'pending' to 'ready-for-review' for display purposes
        if (status === 'pending') {
            status = 'ready-for-review';
        }
        
        const statusMap = {
            'ready-for-review': '<span class="status-badge status-ready-for-review">Ready for Review</span>',
            'approved': '<span class="status-badge status-approved">Approved</span>',
            'draft': '<span class="status-badge status-draft">Draft</span>',
            'inactive': '<span class="status-badge status-inactive">Inactive</span>',
            'experimental': '<span class="status-badge status-experimental">Experimental</span>',
            'denied': '<span class="status-badge status-denied">Denied</span>'
        };
        
        return statusMap[status] || status;
    };
    
    /**
     * Filter SLOs by team
     * @param {Array} sloList - List of SLOs to filter
     * @param {string} teamUID - Team UID to filter by
     * @returns {Array} Filtered list of SLOs
     */
    const filterSLOsByTeam = (sloList, teamUID) => {
        console.log(`Filtering SLOs by team: ${teamUID}`, {
            totalSLOs: sloList.length,
            teamUID: teamUID,
            slosWithTeamUID: sloList.filter(slo => slo.teamUID === teamUID).length,
            sloTeamUIDs: sloList.map(slo => slo.teamUID)
        });
        
        if (teamUID === 'all') {
            console.log('Returning all SLOs (no filter)');
            return sloList;
        }
        
        const filtered = sloList.filter(slo => slo.teamUID === teamUID);
        console.log(`Filtered SLOs: ${filtered.length} of ${sloList.length} match team ${teamUID}`);
        return filtered;
    };
    
    /**
     * Show modal to create a new SLO
     */
    const showCreateSLOModal = async () => {
        // Get all required data
        const teams = await Database.getAll(Database.STORES.TEAMS);
        const services = await Database.getAll(Database.STORES.SERVICES);
        const cujs = await Database.getAll(Database.STORES.CUJS);
        
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <form id="create-slo-form" class="form">
                <div class="form-group">
                    <label for="name">Name *:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="description">Description *:</label>
                    <textarea id="description" name="description" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="teamUID">Team *:</label>
                    <select id="teamUID" name="teamUID" required>
                        <option value="">Select Team</option>
                        ${teams.map(team => `<option value="${team.teamUID}">${team.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="serviceUID">Service *:</label>
                    <select id="serviceUID" name="serviceUID" required disabled>
                        <option value="">Select a Team first</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="cujUID">CUJ Reference *:</label>
                    <select id="cujUID" name="cujUID" required disabled>
                        <option value="">Select a Service first</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="status">Status *:</label>
                    <select id="status" name="status" required>
                        <option value="draft" selected>Draft</option>
                        <option value="ready-for-review">Ready for Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="inactive">Inactive</option>
                        <option value="experimental">Experimental</option>
                    </select>
                    <div class="form-help-text">
                        <span class="material-icons info-icon">info</span>
                        <span>Select the appropriate status for this SLO:
                            <ul>
                                <li><strong>Draft</strong>: Initial creation or still being edited</li>
                                <li><strong>Ready for Review</strong>: Complete and ready for approval</li>
                                <li><strong>Approved</strong>: Reviewed and approved</li>
                                <li><strong>Denied</strong>: Reviewed and not approved</li>
                                <li><strong>Inactive</strong>: No longer in use</li>
                                <li><strong>Experimental</strong>: Testing or proof of concept</li>
                            </ul>
                        </span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="sliDescription">SLI Description *:</label>
                    <textarea id="sliDescription" name="sliDescription" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="sliMetricSource">SLI Metric Source (Optional):</label>
                    <input type="text" id="sliMetricSource" name="sliMetricSource">
                </div>
                <div class="form-group">
                    <label for="sliMetricName">SLI Metric Name (Optional):</label>
                    <input type="text" id="sliMetricName" name="sliMetricName">
                </div>
                <div class="form-group">
                    <label for="target">Target (%) *:</label>
                    <input type="number" id="target" name="target" step="0.01" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label for="window">Evaluation Window *:</label>
                    <select id="window" name="window" required>
                        <option value="1d">1 day</option>
                        <option value="7d">7 days</option>
                        <option value="28d" selected>28 days</option>
                    </select>
                </div>
            </form>
        `;
        
        // After the modal is created, set up the cascading dropdowns
        const setupDropdowns = () => {
            const teamSelect = document.getElementById('teamUID');
            const serviceSelect = document.getElementById('serviceUID');
            const cujSelect = document.getElementById('cujUID');
            
            if (!teamSelect || !serviceSelect || !cujSelect) {
                console.error('Could not find dropdown elements');
                return;
            }
            
            // Event handler for team selection
            teamSelect.addEventListener('change', () => {
                const selectedTeamId = teamSelect.value;
                
                // Reset and disable dependent dropdowns if no team is selected
                if (!selectedTeamId) {
                    serviceSelect.innerHTML = '<option value="">Select a Team first</option>';
                    serviceSelect.disabled = true;
                    
                    cujSelect.innerHTML = '<option value="">Select a Service first</option>';
                    cujSelect.disabled = true;
                    return;
                }
                
                // Filter services by selected team
                const teamServices = services.filter(service => service.teamUID === selectedTeamId);
                
                // Update services dropdown
                serviceSelect.innerHTML = '<option value="">Select Service</option>';
                teamServices.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.serviceUID;
                    const tierInfo = service.tier ? ` (Tier ${service.tier})` : '';
                    option.textContent = service.name + tierInfo;
                    serviceSelect.appendChild(option);
                });
                
                // Enable service dropdown
                serviceSelect.disabled = false;
                
                // Reset CUJ dropdown
                cujSelect.innerHTML = '<option value="">Select a Service first</option>';
                cujSelect.disabled = true;
            });
            
            // Event handler for service selection
            serviceSelect.addEventListener('change', () => {
                const selectedServiceId = serviceSelect.value;
                
                // Reset and disable CUJ dropdown if no service is selected
                if (!selectedServiceId) {
                    cujSelect.innerHTML = '<option value="">Select a Service first</option>';
                    cujSelect.disabled = true;
                    return;
                }
                
                // Filter CUJs by selected service
                const serviceCUJs = cujs.filter(cuj => cuj.serviceUID === selectedServiceId);
                
                // Update CUJs dropdown
                cujSelect.innerHTML = '<option value="">Select CUJ</option>';
                serviceCUJs.forEach(cuj => {
                    const option = document.createElement('option');
                    option.value = cuj.cujUID;
                    option.textContent = cuj.name;
                    cujSelect.appendChild(option);
                });
                
                // Enable CUJ dropdown
                cujSelect.disabled = false;
            });
        };
        
        const saveButton = UI.createButton('Save', async () => {
            console.log('Save button clicked in SLO modal');
            const form = document.getElementById('create-slo-form');
            if (form.checkValidity()) {
                const formData = new FormData(form);
                
                const sloData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    serviceUID: formData.get('serviceUID'),
                    cujUID: formData.get('cujUID'),
                    sliDescription: formData.get('sliDescription'),
                    sliMetricSource: formData.get('sliMetricSource'),
                    sliMetricName: formData.get('sliMetricName'),
                    target: parseFloat(formData.get('target')) / 100, // Convert from percentage to decimal
                    window: formData.get('window'),
                    status: formData.get('status')
                };
                
                try {
                    console.log('Calling createSLO with data:', sloData);
                    await createSLO(sloData);
                    UI.showToast('SLO created successfully', 'success');
                    // Let the hideModal function properly clean up
                    const modalElement = document.querySelector('.modal-overlay');
                    if (modalElement) {
                        UI.hideModal(modalElement);
                    }
                    renderView(document.getElementById('view-container'));
                } catch (error) {
                    console.error('Error creating SLO:', error);
                    UI.showToast('Error creating SLO', 'error');
                }
            } else {
                form.reportValidity();
            }
        }, 'primary');
        
        const cancelButton = UI.createButton('Cancel', () => {
            console.log('Cancel button clicked in SLO modal');
            // Let the modal framework handle the modal closing
            // No need to manually remove it
        }, 'secondary');
        
        const modal = UI.createModal('Create SLO', modalContent, [cancelButton, saveButton]);
        UI.showModal(modal);
        
        // Set up the cascading dropdowns after the modal is shown
        setTimeout(setupDropdowns, 100);
    };
    
    /**
     * Show SLO details with a custom modal implementation
     * @param {Object} slo - SLO object
     */
    const showSLODetails = async (slo) => {
        console.log('Showing SLO details:', slo);
        
        try {
            const services = await Database.getAll(Database.STORES.SERVICES);
            const cujs = await Database.getAll(Database.STORES.CUJS);
            
            // Find related objects
            const service = services.find(s => s.serviceUID === slo.serviceUID);
            const cuj = cujs.find(c => c.cujUID === slo.cujUID);
            
            console.log('Related service:', service);
            console.log('Related CUJ:', cuj);
            
            // Format created/modified dates
            const createdDate = new Date(slo.createdAt).toLocaleString();
            const modifiedDate = slo.modifiedAt ? new Date(slo.modifiedAt).toLocaleString() : 'N/A';
            const approvedDate = slo.approvedAt ? new Date(slo.approvedAt).toLocaleString() : 'N/A';
            
            // Format target percentage using the helper function
            const targetFormatted = formatTargetPercentage(slo.target);
            
            // CUSTOM MODAL IMPLEMENTATION
            // Create overlay
            const modalOverlay = document.createElement('div');
            modalOverlay.style.position = 'fixed';
            modalOverlay.style.top = '0';
            modalOverlay.style.left = '0';
            modalOverlay.style.width = '100%';
            modalOverlay.style.height = '100%';
            modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modalOverlay.style.display = 'flex';
            modalOverlay.style.justifyContent = 'center';
            modalOverlay.style.alignItems = 'center';
            modalOverlay.style.zIndex = '1000';
            modalOverlay.style.backdropFilter = 'blur(2px)';
            
            // Create modal container
            const modalContainer = document.createElement('div');
            modalContainer.style.backgroundColor = 'white';
            modalContainer.style.borderRadius = '12px';
            modalContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
            modalContainer.style.width = '90%';
            modalContainer.style.maxWidth = '700px';
            modalContainer.style.maxHeight = '90vh';
            modalContainer.style.overflow = 'auto';
            modalContainer.style.display = 'flex';
            modalContainer.style.flexDirection = 'column';
            
            // Create modal header
            const modalHeader = document.createElement('div');
            modalHeader.style.padding = '20px';
            modalHeader.style.borderBottom = '1px solid #e9ecef';
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = `SLO: ${slo.name}`;
            modalTitle.style.margin = '0';
            modalTitle.style.fontSize = '1.25rem';
            modalTitle.style.fontWeight = '600';
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '1.5rem';
            closeButton.style.cursor = 'pointer';
            closeButton.style.padding = '0';
            closeButton.style.lineHeight = '1';
            closeButton.onclick = () => document.body.removeChild(modalOverlay);
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            modalContainer.appendChild(modalHeader);
            
            // Create modal body
            const modalBody = document.createElement('div');
            modalBody.style.padding = '20px';
            modalBody.style.maxHeight = 'calc(90vh - 140px)';
            modalBody.style.overflow = 'auto';
            
            modalBody.innerHTML = `
                <div class="details-view">
                    <div class="details-section">
                        <h3>Service Level Objective Details</h3>
                        <div class="details-grid">
                            <div class="details-label">Name:</div>
                            <div class="details-value">${slo.name || 'N/A'}</div>
                            
                            <div class="details-label">Description:</div>
                            <div class="details-value">${slo.description || 'N/A'}</div>
                            
                            <div class="details-label">Service:</div>
                            <div class="details-value">${service ? service.name : 'N/A'}</div>
                            
                            <div class="details-label">CUJ:</div>
                            <div class="details-value">${cuj ? cuj.name : 'N/A'}</div>
                            
                            <div class="details-label">Target:</div>
                            <div class="details-value">${targetFormatted}</div>
                            
                            <div class="details-label">Evaluation Window:</div>
                            <div class="details-value">${formatWindow(slo.window || '28d')}</div>
                            
                            <div class="details-label">Status:</div>
                            <div class="details-value">
                                ${formatStatus(slo.status || 'draft')}
                                ${slo.status === 'denied' && slo.reviews && slo.reviews.length > 0 ? 
                                    `<div class="denial-reason">${slo.reviews[slo.reviews.length-1].reason ? 
                                        `<span class="reason-label">Reason:</span> ${slo.reviews[slo.reviews.length-1].reason}` : 
                                        'No reason provided'}</div>` : 
                                    ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>SLI Information</h3>
                        <div class="details-grid">
                            <div class="details-label">Description:</div>
                            <div class="details-value">${slo.sliDescription || 'N/A'}</div>
                            
                            <div class="details-label">Metric Source:</div>
                            <div class="details-value">${slo.sliMetricSource || 'N/A'}</div>
                            
                            <div class="details-label">Metric Name:</div>
                            <div class="details-value">${slo.sliMetricName || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Audit Information</h3>
                        <div class="details-grid">
                            <div class="details-label">Created:</div>
                            <div class="details-value">${createdDate}</div>
                            
                            <div class="details-label">Last Modified:</div>
                            <div class="details-value">${modifiedDate}</div>
                            
                            <div class="details-label">Approved Date:</div>
                            <div class="details-value">${approvedDate}</div>
                            
                            <div class="details-label">Authors:</div>
                            <div class="details-value">${slo.authors ? slo.authors.join(', ') : 'Unknown'}</div>
                            
                            <div class="details-label">Modified By:</div>
                            <div class="details-value">${slo.modifiedBy || 'N/A'}</div>
                            
                            <div class="details-label">Approvals:</div>
                            <div class="details-value">${
                                slo.approvals && slo.approvals.length > 0 
                                    ? slo.approvals.map(a => `${a.user} (${new Date(a.timestamp).toLocaleString()})`).join(', ')
                                    : 'None'
                            }</div>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>History</h3>
                        <div class="history-list">
                            ${
                                slo.history && slo.history.length > 0
                                    ? slo.history.map(h => `
                                        <div class="history-item" data-action="${h.action || 'unknown'}">
                                            <div class="history-header">
                                                <span class="history-action">${h.action === 'status_changed' ? 'Status Changed' : h.action}</span>
                                                <span class="history-timestamp">${new Date(h.timestamp).toLocaleString()}</span>
                                                <span class="history-user">by ${h.user}</span>
                                            </div>
                                            <div class="history-details">
                                                ${h.action === 'status_changed' 
                                                    ? `Changed from <strong>${getStatusText(h.fromStatus)}</strong> to <strong>${getStatusText(h.toStatus)}</strong>` 
                                                    : h.details}
                                            </div>
                                        </div>
                                    `).join('')
                                    : '<div class="empty-state">No history records available</div>'
                            }
                        </div>
                    </div>
                </div>
            `;
            
            modalContainer.appendChild(modalBody);
            
            // Create modal footer
            const modalFooter = document.createElement('div');
            modalFooter.style.padding = '20px';
            modalFooter.style.borderTop = '1px solid #e9ecef';
            modalFooter.style.display = 'flex';
            modalFooter.style.justifyContent = 'flex-end';
            modalFooter.style.gap = '10px';
            
            // Add Close button 
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            closeBtn.className = 'btn btn-secondary';
            closeBtn.style.padding = '8px 16px';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.border = '1px solid #dee2e6';
            closeBtn.style.backgroundColor = '#f8f9fa';
            closeBtn.style.color = '#212529';
            closeBtn.style.fontWeight = '500';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.minWidth = '100px';
            closeBtn.onclick = () => document.body.removeChild(modalOverlay);
            modalFooter.appendChild(closeBtn);
            
            // Only show edit for drafts or if user has permissions
            if (slo.status === 'draft' || Auth.hasPermission('MANAGE_SLOS')) {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit SLO';
                editBtn.className = 'btn btn-primary';
                editBtn.style.padding = '8px 16px';
                editBtn.style.borderRadius = '4px';
                editBtn.style.border = 'none';
                editBtn.style.backgroundColor = '#4361ee';
                editBtn.style.color = '#ffffff';
                editBtn.style.fontWeight = '500';
                editBtn.style.cursor = 'pointer';
                editBtn.style.minWidth = '100px';
                editBtn.onclick = () => {
                    document.body.removeChild(modalOverlay);
                    setTimeout(() => {
                        showEditSLOModal(slo);
                    }, 350);
                };
                modalFooter.appendChild(editBtn);
            }
            
            // Show "Ready for Review" button for draft SLOs
            if (slo.status === 'draft') {
                const readyBtn = document.createElement('button');
                readyBtn.textContent = 'Ready for Review';
                readyBtn.className = 'btn btn-primary ready-for-review-btn';
                
                // Create a distinct style element for this button
                const styleEl = document.createElement('style');
                styleEl.textContent = '.ready-for-review-btn { background-color: #ff9500 !important; }';
                document.head.appendChild(styleEl);
                
                readyBtn.style.padding = '8px 16px';
                readyBtn.style.borderRadius = '4px';
                readyBtn.style.border = 'none';
                readyBtn.setAttribute('data-custom-bg', 'true');
                // Direct attribute setting as a backup
                readyBtn.setAttribute('style', 'padding: 8px 16px; border-radius: 4px; border: none; background-color: #ff9500 !important; color: #ffffff; font-weight: 500; cursor: pointer; min-width: 100px;');
                readyBtn.style.color = '#ffffff';
                readyBtn.style.fontWeight = '500';
                readyBtn.style.cursor = 'pointer';
                readyBtn.style.minWidth = '100px';
                readyBtn.onclick = async () => {
                    try {
                        const updatedSLO = await setReadyForReviewSLO(slo.sloUID);
                        UI.showToast('SLO marked as Ready for Review', 'success');
                        document.body.removeChild(modalOverlay);
                        showSLODetails(updatedSLO); // Reopen with updated data
                    } catch (error) {
                        console.error('Error marking SLO as Ready for Review:', error);
                        UI.showToast('Error updating SLO status', 'error');
                    }
                };
                modalFooter.appendChild(readyBtn);
            }
            
            // Only show approve/deny if ready for review and user has permissions
            if ((slo.status === 'ready-for-review' || slo.status === 'pending') && Auth.hasPermission('APPROVE_SLOS')) {
                const approveBtn = document.createElement('button');
                approveBtn.textContent = 'Approve';
                approveBtn.className = 'btn btn-success';
                approveBtn.style.padding = '8px 16px';
                approveBtn.style.borderRadius = '4px';
                approveBtn.style.border = 'none';
                approveBtn.style.backgroundColor = '#06d6a0';
                approveBtn.style.color = '#ffffff';
                approveBtn.style.fontWeight = '500';
                approveBtn.style.cursor = 'pointer';
                approveBtn.style.minWidth = '100px';
                approveBtn.onclick = async () => {
                    try {
                        const updatedSLO = await approveSLO(slo.sloUID);
                        UI.showToast('SLO approved successfully', 'success');
                        document.body.removeChild(modalOverlay);
                        showSLODetails(updatedSLO); // Reopen with updated data
                    } catch (error) {
                        console.error('Error approving SLO:', error);
                        UI.showToast('Error approving SLO', 'error');
                    }
                };
                modalFooter.appendChild(approveBtn);
                
                const denyBtn = document.createElement('button');
                denyBtn.textContent = 'Deny';
                denyBtn.className = 'btn btn-danger';
                denyBtn.style.padding = '8px 16px';
                denyBtn.style.borderRadius = '4px';
                denyBtn.style.border = 'none';
                denyBtn.style.backgroundColor = '#ef476f';
                denyBtn.style.color = '#ffffff';
                denyBtn.style.fontWeight = '500';
                denyBtn.style.cursor = 'pointer';
                denyBtn.style.minWidth = '100px';
                denyBtn.onclick = () => {
                    // Create a custom denial reason modal
                    const denialModalOverlay = document.createElement('div');
                    denialModalOverlay.style.position = 'fixed';
                    denialModalOverlay.style.top = '0';
                    denialModalOverlay.style.left = '0';
                    denialModalOverlay.style.width = '100%';
                    denialModalOverlay.style.height = '100%';
                    denialModalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    denialModalOverlay.style.display = 'flex';
                    denialModalOverlay.style.justifyContent = 'center';
                    denialModalOverlay.style.alignItems = 'center';
                    denialModalOverlay.style.zIndex = '1001'; // Higher than the main modal
                    
                    // Create modal container with controlled width
                    const denialModalContainer = document.createElement('div');
                    denialModalContainer.style.backgroundColor = 'white';
                    denialModalContainer.style.borderRadius = '12px';
                    denialModalContainer.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                    denialModalContainer.style.width = '90%';
                    denialModalContainer.style.maxWidth = '500px'; // Narrower than the main modal
                    denialModalContainer.style.overflow = 'auto';
                    denialModalContainer.style.display = 'flex';
                    denialModalContainer.style.flexDirection = 'column';
                    
                    // Create modal header
                    const denialModalHeader = document.createElement('div');
                    denialModalHeader.style.padding = '20px';
                    denialModalHeader.style.borderBottom = '1px solid #e9ecef';
                    denialModalHeader.style.display = 'flex';
                    denialModalHeader.style.justifyContent = 'space-between';
                    denialModalHeader.style.alignItems = 'center';
                    
                    const denialModalTitle = document.createElement('h3');
                    denialModalTitle.textContent = 'Deny SLO';
                    denialModalTitle.style.margin = '0';
                    denialModalTitle.style.fontSize = '1.25rem';
                    denialModalTitle.style.fontWeight = '600';
                    
                    const denialCloseButton = document.createElement('button');
                    denialCloseButton.innerHTML = '&times;';
                    denialCloseButton.style.background = 'none';
                    denialCloseButton.style.border = 'none';
                    denialCloseButton.style.fontSize = '1.5rem';
                    denialCloseButton.style.cursor = 'pointer';
                    denialCloseButton.style.padding = '0';
                    denialCloseButton.style.lineHeight = '1';
                    denialCloseButton.onclick = () => document.body.removeChild(denialModalOverlay);
                    
                    denialModalHeader.appendChild(denialModalTitle);
                    denialModalHeader.appendChild(denialCloseButton);
                    denialModalContainer.appendChild(denialModalHeader);
                    
                    // Create modal body
                    const denialModalBody = document.createElement('div');
                    denialModalBody.style.padding = '20px';
                    denialModalBody.innerHTML = `
                        <p>Please provide a reason for denying this SLO:</p>
                        <div class="form-group">
                            <textarea id="denial-reason" rows="3" placeholder="Reason for denial..." style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ced4da;"></textarea>
                        </div>
                    `;
                    denialModalContainer.appendChild(denialModalBody);
                    
                    // Create modal footer
                    const denialModalFooter = document.createElement('div');
                    denialModalFooter.style.padding = '20px';
                    denialModalFooter.style.borderTop = '1px solid #e9ecef';
                    denialModalFooter.style.display = 'flex';
                    denialModalFooter.style.justifyContent = 'flex-end';
                    denialModalFooter.style.gap = '10px';
                    
                    // Add Cancel button
                    const cancelBtn = document.createElement('button');
                    cancelBtn.textContent = 'Cancel';
                    cancelBtn.className = 'btn btn-secondary';
                    cancelBtn.style.padding = '8px 16px';
                    cancelBtn.style.borderRadius = '4px';
                    cancelBtn.style.border = '1px solid #dee2e6';
                    cancelBtn.style.backgroundColor = '#f8f9fa';
                    cancelBtn.style.color = '#212529';
                    cancelBtn.style.fontWeight = '500';
                    cancelBtn.style.cursor = 'pointer';
                    cancelBtn.style.minWidth = '100px';
                    cancelBtn.onclick = () => document.body.removeChild(denialModalOverlay);
                    denialModalFooter.appendChild(cancelBtn);
                    
                    // Add Submit button
                    const submitBtn = document.createElement('button');
                    submitBtn.textContent = 'Submit';
                    submitBtn.className = 'btn btn-danger';
                    submitBtn.style.padding = '8px 16px';
                    submitBtn.style.borderRadius = '4px';
                    submitBtn.style.border = 'none';
                    submitBtn.style.backgroundColor = '#ef476f';
                    submitBtn.style.color = '#ffffff';
                    submitBtn.style.fontWeight = '500';
                    submitBtn.style.cursor = 'pointer';
                    submitBtn.style.minWidth = '100px';
                    submitBtn.onclick = async () => {
                        const reason = document.getElementById('denial-reason').value.trim();
                        try {
                            const updatedSLO = await denySLO(slo.sloUID, reason);
                            UI.showToast('SLO denied', 'warning');
                            
                            // Close both modals
                            document.body.removeChild(modalOverlay);
                            document.body.removeChild(denialModalOverlay);
                            
                            // Reopen details with updated data
                            showSLODetails(updatedSLO);
                        } catch (error) {
                            console.error('Error denying SLO:', error);
                            UI.showToast('Error denying SLO', 'error');
                        }
                    };
                    denialModalFooter.appendChild(submitBtn);
                    
                    denialModalContainer.appendChild(denialModalFooter);
                    denialModalOverlay.appendChild(denialModalContainer);
                    
                    // Add to document
                    document.body.appendChild(denialModalOverlay);
                };
                modalFooter.appendChild(denyBtn);
            }
            
            modalContainer.appendChild(modalFooter);
            modalOverlay.appendChild(modalContainer);
            
            // Add to document
            document.body.appendChild(modalOverlay);
            
        } catch (error) {
            console.error('Error showing SLO details:', error);
            UI.showToast('Error showing SLO details', 'error');
        }
    };
    
    /**
     * Show modal to edit an SLO
     * @param {Object} slo - SLO to edit
     */
    const showEditSLOModal = async (slo) => {
        const services = await Database.getAll(Database.STORES.SERVICES);
        const allCujs = await Database.getAll(Database.STORES.CUJS);
        
        // Filter CUJs by the current service UID
        const serviceCujs = allCujs.filter(cuj => cuj.serviceUID === slo.serviceUID);
        
        // Format the target value correctly for the input field
        let targetValue = '';
        if (slo.target !== undefined && slo.target !== null) {
            let targetNum = parseFloat(slo.target);
            if (!isNaN(targetNum)) {
                // If target is in decimal format (0-1 range)
                if (targetNum <= 1) {
                    targetValue = (targetNum * 100).toFixed(2);
                }
                // If target is already in percentage format (1-100 range)
                else if (targetNum <= 100) {
                    targetValue = targetNum.toFixed(2);
                }
                // If target is very large (needs division by 100)
                else {
                    targetValue = (targetNum / 100).toFixed(2);
                }
            }
        }
        
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <form id="edit-slo-form" class="form">
                <div class="form-group">
                    <label for="name">Name *:</label>
                    <input type="text" id="name" name="name" value="${slo.name}" required>
                </div>
                <div class="form-group">
                    <label for="description">Description *:</label>
                    <textarea id="description" name="description" rows="3" required>${slo.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="serviceUID">Service *:</label>
                    <select id="serviceUID" name="serviceUID" required>
                        <option value="">Select Service</option>
                        ${services.map(service => 
                            `<option value="${service.serviceUID}" ${service.serviceUID === slo.serviceUID ? 'selected' : ''}>${service.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="cujUID">CUJ Reference *:</label>
                    <select id="cujUID" name="cujUID" required>
                        <option value="">Select CUJ</option>
                        ${serviceCujs.map(cuj => 
                            `<option value="${cuj.cujUID}" ${cuj.cujUID === slo.cujUID ? 'selected' : ''}>${cuj.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="status">Status *:</label>
                    <select id="status" name="status" required>
                        <option value="draft" selected>Draft</option>
                        <option value="ready-for-review" ${slo.status === 'ready-for-review' || slo.status === 'pending' ? 'selected' : ''}>Ready for Review</option>
                        <option value="approved" ${slo.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="denied" ${slo.status === 'denied' ? 'selected' : ''}>Denied</option>
                        <option value="inactive" ${slo.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="experimental" ${slo.status === 'experimental' ? 'selected' : ''}>Experimental</option>
                    </select>
                    <div class="form-help-text">
                        <span class="material-icons info-icon">info</span>
                        <span>Select the appropriate status for this SLO:
                            <ul>
                                <li><strong>Draft</strong>: Initial creation or still being edited</li>
                                <li><strong>Ready for Review</strong>: Complete and ready for approval</li>
                                <li><strong>Approved</strong>: Reviewed and approved</li>
                                <li><strong>Denied</strong>: Reviewed and not approved</li>
                                <li><strong>Inactive</strong>: No longer in use</li>
                                <li><strong>Experimental</strong>: Testing or proof of concept</li>
                            </ul>
                        </span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="sliDescription">SLI Description *:</label>
                    <textarea id="sliDescription" name="sliDescription" rows="3" required>${slo.sliDescription || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="sliMetricSource">SLI Metric Source (Optional):</label>
                    <input type="text" id="sliMetricSource" name="sliMetricSource" value="${slo.sliMetricSource || ''}">
                </div>
                <div class="form-group">
                    <label for="sliMetricName">SLI Metric Name (Optional):</label>
                    <input type="text" id="sliMetricName" name="sliMetricName" value="${slo.sliMetricName || ''}">
                </div>
                <div class="form-group">
                    <label for="target">Target (%) *:</label>
                    <input type="number" id="target" name="target" step="0.01" min="0" max="100" value="${targetValue}" required>
                </div>
                <div class="form-group">
                    <label for="window">Evaluation Window *:</label>
                    <select id="window" name="window" required>
                        <option value="1d" ${slo.window === '1d' ? 'selected' : ''}>1 day</option>
                        <option value="7d" ${slo.window === '7d' ? 'selected' : ''}>7 days</option>
                        <option value="28d" ${slo.window === '28d' ? 'selected' : ''}>28 days</option>
                    </select>
                </div>
            </form>
        `;
        
        UI.showModal('Edit SLO', modalContent, [
            UI.createButton('Cancel', () => {
                const modalElement = document.querySelector('.modal-overlay');
                if (modalElement) {
                    UI.hideModal(modalElement);
                }
            }, 'secondary'),
            UI.createButton('Save', async () => {
                const form = document.getElementById('edit-slo-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    
                    const updatedSLO = {
                        ...slo,
                        name: formData.get('name'),
                        description: formData.get('description'),
                        serviceUID: formData.get('serviceUID'),
                        cujUID: formData.get('cujUID'),
                        sliDescription: formData.get('sliDescription'),
                        sliMetricSource: formData.get('sliMetricSource'),
                        sliMetricName: formData.get('sliMetricName'),
                        target: parseFloat(formData.get('target')) / 100, // Convert from percentage to decimal
                        window: formData.get('window'),
                        status: formData.get('status')
                    };
                    
                    try {
                        await updateSLO(updatedSLO);
                        UI.showToast('SLO updated successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error updating SLO:', error);
                        UI.showToast('Error updating SLO', 'error');
                    }
                } else {
                    form.reportValidity();
                }
            }, 'primary')
        ]);
        
        // Set up service change handler to update CUJ options
        const serviceSelect = document.getElementById('serviceUID');
        const cujSelect = document.getElementById('cujUID');
        
        if (serviceSelect && cujSelect) {
            serviceSelect.addEventListener('change', () => {
                const selectedServiceId = serviceSelect.value;
                
                // Reset CUJ dropdown if no service is selected
                if (!selectedServiceId) {
                    cujSelect.innerHTML = '<option value="">Select a Service first</option>';
                    return;
                }
                
                // Filter CUJs by selected service
                const filteredCujs = allCujs.filter(cuj => cuj.serviceUID === selectedServiceId);
                
                // Update CUJs dropdown
                cujSelect.innerHTML = '<option value="">Select CUJ</option>';
                filteredCujs.forEach(cuj => {
                    const option = document.createElement('option');
                    option.value = cuj.cujUID;
                    option.textContent = cuj.name;
                    cujSelect.appendChild(option);
                });
            });
        }
    };
    
    // Add a helper function for formatting target percentages
    /**
     * Helper function to safely format target percentage values
     * @param {any} target - The target value to format
     * @returns {string} Formatted percentage string
     */
    const formatTargetPercentage = (target) => {
        if (target === undefined || target === null) return 'N/A';
        
        let targetNum = parseFloat(target);
        if (isNaN(targetNum)) return 'N/A';
        
        // Debug the incoming target value
        console.log(`Formatting target value: ${target}, parsed as: ${targetNum}`);
        
        // Check if the target value seems too large (likely an error in sample data)
        if (targetNum > 100) {
            // If extremely large (e.g., 9900 for 99%), divide by 100
            return `${(targetNum / 100).toFixed(2)}%`;
        }
        // If it's a decimal (0-1 range), convert to percentage
        else if (targetNum <= 1) {
            return `${(targetNum * 100).toFixed(2)}%`;
        }
        // If it's already in percentage format (1-100)
        else {
            return `${targetNum.toFixed(2)}%`;
        }
    };
    
    // Public API
    return {
        init,
        getAllSLOs,
        getSLO,
        createSLO,
        updateSLO,
        deleteSLO,
        approveSLO,
        denySLO,
        setReadyForReviewSLO
    };
})();

console.log('SLOs module loaded, module object:', window.slosModule);