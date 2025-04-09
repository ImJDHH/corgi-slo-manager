/**
 * CUJs Feature Module for Corgi SLO Manager
 */

console.log('CUJs module loading...');

// Make sure to expose cujsModule in the global scope
window.cujsModule = (function() {
    let cujs = [];
    let allTeams = [];
    let currentTeamFilter = 'all'; // Default to show all teams
    
    /**
     * Setup team-service cascading selection in create/edit forms
     * @param {HTMLSelectElement} teamSelectElement - The team select element
     * @param {HTMLSelectElement} serviceSelectElement - The service select element
     * @param {Array} servicesData - Array of service objects
     */
    const setupTeamServiceCascading = (teamSelectElement, serviceSelectElement, servicesData) => {
        if (!teamSelectElement || !serviceSelectElement || !servicesData) {
            console.error('Missing required elements for cascading dropdowns');
            return;
        }
        
        console.log('Setting up team-service cascading with', 
            teamSelectElement.id, 
            serviceSelectElement.id,
            servicesData.length + ' services'
        );
        
        // Event handler for team selection
        teamSelectElement.addEventListener('change', () => {
            const selectedTeamId = teamSelectElement.value;
            console.log('Team selected:', selectedTeamId);
            
            // Reset and disable service dropdown if no team is selected
            if (!selectedTeamId) {
                serviceSelectElement.innerHTML = '<option value="">Select a team first</option>';
                serviceSelectElement.disabled = true;
                return;
            }
            
            // Filter services by selected team
            const teamServices = servicesData.filter(service => service.teamUID === selectedTeamId);
            console.log('Filtered services for team:', teamServices.length);
            
            // Update services dropdown
            serviceSelectElement.innerHTML = '<option value="">Select Service</option>';
            teamServices.forEach(service => {
                const option = document.createElement('option');
                option.value = service.serviceUID;
                const tierInfo = service.tier ? ` (Tier ${service.tier})` : '';
                option.textContent = service.name + tierInfo;
                serviceSelectElement.appendChild(option);
            });
            
            // Enable service dropdown
            serviceSelectElement.disabled = false;
        });
    };
    
    /**
     * Initialize the CUJs module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('CUJs module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            cujs = await Database.getAll(Database.STORES.CUJS);
            // Load teams for filter
            allTeams = await Database.getAll(Database.STORES.TEAMS);
            
            // Check for team filter in URL
            if (params && params.team) {
                currentTeamFilter = params.team;
            }
            
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing CUJs module:', error);
            return false;
        }
    };
    
    /**
     * Get all CUJs
     * @returns {Array} Array of CUJs
     */
    const getAllCUJs = () => {
        return cujs;
    };
    
    /**
     * Get a CUJ by UID
     * @param {string} cujUID - CUJ UID
     * @returns {Object} CUJ object
     */
    const getCUJ = (cujUID) => {
        return cujs.find(cuj => cuj.cujUID === cujUID);
    };
    
    /**
     * Create a new CUJ
     * @param {Object} cujData - CUJ data
     * @returns {Promise<string>} CUJ UID
     */
    const createCUJ = async (cujData) => {
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        const cuj = {
            ...cujData,
            cujUID: Database.generateUID('cuj'),
            createdAt: now,
            status: cujData.status || 'draft',
            authors: [currentUser.name || currentUser.email || currentUser.userUID],
            modifiedAt: now,
            modifiedBy: currentUser.name || currentUser.email || currentUser.userUID,
            history: [{
                action: 'created',
                timestamp: now,
                user: currentUser.name || currentUser.email || currentUser.userUID,
                details: 'CUJ created'
            }]
        };
        
        const cujUID = await Database.create(Database.STORES.CUJS, cuj);
        cujs.push(cuj);
        return cujUID;
    };
    
    /**
     * Update a CUJ
     * @param {Object} cuj - Updated CUJ data
     * @returns {Promise<void>}
     */
    const updateCUJ = async (cuj) => {
        // Get the current user
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        // Get the existing CUJ to compare changes
        const existingCUJ = await Database.get(Database.STORES.CUJS, cuj.cujUID);
        
        // Create history entry with changes
        const changes = [];
        if (existingCUJ.name !== cuj.name) changes.push('name');
        if (existingCUJ.description !== cuj.description) changes.push('description');
        if (existingCUJ.serviceUID !== cuj.serviceUID) changes.push('service reference');
        
        // Track status changes specially
        let statusChanged = false;
        let oldStatus = existingCUJ.status;
        let newStatus = cuj.status;
        
        if (oldStatus !== newStatus) {
            statusChanged = true;
            changes.push('status');
        }
        
        // Update the CUJ with audit information
        cuj.modifiedAt = now;
        cuj.modifiedBy = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Add current user to authors if not already present
        const authorName = currentUser.name || currentUser.email || currentUser.userUID;
        if (!cuj.authors) {
            cuj.authors = [authorName];
        } else if (!cuj.authors.includes(authorName)) {
            cuj.authors.push(authorName);
        }
        
        // Add history entry
        if (!cuj.history) {
            cuj.history = [];
        }
        
        // Add generic update entry
        if (changes.length > 0) {
            cuj.history.push({
                action: 'updated',
                timestamp: now,
                user: authorName,
                details: `Updated: ${changes.join(', ')}`
            });
        }
        
        // Add specific status change entry if status changed
        if (statusChanged) {
            cuj.history.push({
                action: 'status_changed',
                fromStatus: oldStatus || 'draft',
                toStatus: newStatus,
                timestamp: now,
                user: authorName,
                details: `Status changed from ${getStatusText(oldStatus || 'draft')} to ${getStatusText(newStatus)}`
            });
        }
        
        await Database.update(Database.STORES.CUJS, cuj);
        const index = cujs.findIndex(c => c.cujUID === cuj.cujUID);
        if (index !== -1) {
            cujs[index] = cuj;
        }
    };
    
    /**
     * Delete a CUJ
     * @param {string} cujUID - CUJ UID
     * @returns {Promise<void>}
     */
    const deleteCUJ = async (cujUID) => {
        await Database.remove(Database.STORES.CUJS, cujUID);
        cujs = cujs.filter(cuj => cuj.cujUID !== cujUID);
    };
    
    /**
     * Helper function to get status text (returns the status text only)
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
     * Set a CUJ to Ready for Review status
     * @param {string} cujUID - CUJ UID
     * @returns {Promise<Object>} Updated CUJ
     */
    const setReadyForReviewCUJ = async (cujUID) => {
        const cuj = await Database.get(Database.STORES.CUJS, cujUID);
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        // Update status
        const oldStatus = cuj.status || 'draft';
        cuj.status = 'ready-for-review';
        cuj.readyForReviewAt = now;
        cuj.readyForReviewBy = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Add to history
        if (!cuj.history) {
            cuj.history = [];
        }
        
        const userName = currentUser.name || currentUser.email || currentUser.userUID;
        
        cuj.history.push({
            action: 'status_changed',
            fromStatus: oldStatus,
            toStatus: 'ready-for-review',
            timestamp: now,
            user: userName,
            details: `CUJ marked as Ready for Review by ${userName}`
        });
        
        await Database.update(Database.STORES.CUJS, cuj);
        
        // Update local cache
        const index = cujs.findIndex(c => c.cujUID === cuj.cujUID);
        if (index !== -1) {
            cujs[index] = cuj;
        }
        
        // Refresh the view to show updated status in the table
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            renderView(viewContainer);
        }
        
        return cuj;
    };
    
    /**
     * Approve a CUJ
     * @param {string} cujUID - CUJ UID
     * @returns {Promise<Object>} Updated CUJ
     */
    const approveCUJ = async (cujUID) => {
        const cuj = await Database.get(Database.STORES.CUJS, cujUID);
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        if (!cuj.approvals) {
            cuj.approvals = [];
        }
        
        const approverName = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Add approval
        cuj.approvals.push({
            user: approverName,
            timestamp: now,
            action: 'approved'
        });
        
        // Update status
        cuj.status = 'approved';
        cuj.approvedAt = now;
        cuj.approvedBy = approverName;
        
        // Add to history
        if (!cuj.history) {
            cuj.history = [];
        }
        
        cuj.history.push({
            action: 'status_changed',
            fromStatus: cuj.status || 'draft',
            toStatus: 'approved',
            timestamp: now,
            user: approverName,
            details: `CUJ approved by ${approverName}`
        });
        
        await Database.update(Database.STORES.CUJS, cuj);
        
        // Update local cache
        const index = cujs.findIndex(c => c.cujUID === cuj.cujUID);
        if (index !== -1) {
            cujs[index] = cuj;
        }
        
        // Refresh the view to show updated status in the table
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            renderView(viewContainer);
        }
        
        return cuj;
    };
    
    /**
     * Deny a CUJ
     * @param {string} cujUID - CUJ UID
     * @param {string} reason - Reason for denial
     * @returns {Promise<Object>} Updated CUJ
     */
    const denyCUJ = async (cujUID, reason) => {
        const cuj = await Database.get(Database.STORES.CUJS, cujUID);
        const currentUser = Auth.getCurrentUser();
        const now = new Date().toISOString();
        
        if (!cuj.reviews) {
            cuj.reviews = [];
        }
        
        const reviewerName = currentUser.name || currentUser.email || currentUser.userUID;
        
        // Store original status before changing it
        const originalStatus = cuj.status || 'ready-for-review';
        
        // Add denial
        cuj.reviews.push({
            user: reviewerName,
            timestamp: now,
            action: 'denied',
            reason: reason
        });
        
        // Update status
        cuj.status = 'denied';
        cuj.deniedAt = now;
        cuj.deniedBy = reviewerName;
        
        // Add to history
        if (!cuj.history) {
            cuj.history = [];
        }
        
        cuj.history.push({
            action: 'status_changed',
            fromStatus: originalStatus,
            toStatus: 'denied',
            timestamp: now,
            user: reviewerName,
            details: `CUJ denied by ${reviewerName}${reason ? ': ' + reason : ''}`
        });
        
        await Database.update(Database.STORES.CUJS, cuj);
        
        // Update local cache
        const index = cujs.findIndex(c => c.cujUID === cuj.cujUID);
        if (index !== -1) {
            cujs[index] = cuj;
        }
        
        // Refresh the view to show updated status in the table
        const viewContainer = document.getElementById('view-container');
        if (viewContainer) {
            renderView(viewContainer);
        }
        
        return cuj;
    };
    
    /**
     * Render the CUJs view
     * @param {HTMLElement} container - Container element
     */
    const renderView = async (container) => {
        console.log('Rendering CUJs view');
        container.innerHTML = '';
        
        // Ensure the container has an ID for proper re-rendering
        if (!container.id) {
            container.id = 'view-container';
        }
        
        // Fetch service data for CUJs
        try {
            const services = await Database.getAll(Database.STORES.SERVICES);
            const teams = await Database.getAll(Database.STORES.TEAMS);
            allTeams = teams; // Update teams list
            
            // Add service names and team info to CUJs
            cujs.forEach(cuj => {
                if (cuj.serviceUID) {
                    const service = services.find(s => s.serviceUID === cuj.serviceUID);
                    if (service) {
                        cuj.serviceName = service.name;
                        
                        // Add team information from the associated service
                        if (service.teamUID) {
                            const team = teams.find(t => t.teamUID === service.teamUID);
                            if (team) {
                                cuj.teamUID = service.teamUID;
                                cuj.teamName = team.name;
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching service or team data:', error);
        }
        
        // Filter CUJs by team if a team filter is set
        let filteredCUJs = filterCUJsByTeam(cujs, currentTeamFilter);
        
        // Filter by status if status filter is set
        const urlParams = new URLSearchParams(window.location.search);
        const statusParam = urlParams.get('cujStatus');
        if (statusParam && statusParam !== 'all') {
            console.log(`Applying CUJ status filter: ${statusParam}`, {
                beforeFiltering: filteredCUJs.length
            });
            
            // Case-insensitive status filtering with special handling for ready-for-review/pending
            filteredCUJs = filteredCUJs.filter(cuj => {
                // Make sure we have a valid status
                const cujStatus = (cuj.status || 'draft').toLowerCase();
                const paramStatus = statusParam.toLowerCase();
                
                // Special handling for ready-for-review and pending (they're treated as equivalent)
                if (paramStatus === 'ready-for-review') {
                    return cujStatus === 'ready-for-review' || cujStatus === 'pending';
                }
                
                if (paramStatus === 'pending') {
                    return cujStatus === 'ready-for-review' || cujStatus === 'pending';
                }
                
                return cujStatus === paramStatus;
            });
            
            console.log('After status filtering:', {
                filteredCount: filteredCUJs.length,
                statuses: filteredCUJs.map(cuj => cuj.status)
            });
        }
        
        // Sort CUJs by most recently updated or created
        filteredCUJs.sort((a, b) => {
            // First check for updatedAt (most recently edited)
            if (a.updatedAt && b.updatedAt) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            } else if (a.updatedAt) {
                return -1; // a was updated, b wasn't, so a comes first
            } else if (b.updatedAt) {
                return 1;  // b was updated, a wasn't, so b comes first
            }
            // If neither has updatedAt or they're the same, use createdAt
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Create header with team filter
        const header = document.createElement('div');
        header.classList.add('section-header');
        
        // Add filtered class if a team is selected
        if (currentTeamFilter !== 'all') {
            header.classList.add('filtered');
        }
        
        const teamName = currentTeamFilter !== 'all' 
            ? allTeams.find(t => t.teamUID === currentTeamFilter)?.name || 'Unknown Team'
            : null;
            
        header.innerHTML = `
            <h2>Critical User Journeys (CUJs)${teamName ? ` <span class="filter-tag">Team: ${teamName}</span>` : ''}</h2>
            <div class="controls">
                <div class="team-filter">
                    <label for="cujTeamFilter">Team:</label>
                    <select id="cujTeamFilter">
                        <option value="all">All Teams</option>
                        <!-- Team options will be populated dynamically -->
                    </select>
                </div>
                <div class="status-filter">
                    <label for="cujStatusFilter">Status:</label>
                    <select id="cujStatusFilter">
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="ready-for-review">Ready for Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="inactive">Inactive</option>
                        <option value="experimental">Experimental</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="create-cuj-btn">Create CUJ</button>
            </div>
        `;
        container.appendChild(header);
        
        // Populate team filter
        const teamFilter = document.getElementById('cujTeamFilter');
        if (teamFilter) {
            // Add team options
            allTeams.sort((a, b) => a.name.localeCompare(b.name)).forEach(team => {
                const option = document.createElement('option');
                option.value = team.teamUID;
                option.textContent = team.name;
                teamFilter.appendChild(option);
            });
            
            // Set current selection
            teamFilter.value = currentTeamFilter;
            
            // Add event listener
            teamFilter.addEventListener('change', () => {
                currentTeamFilter = teamFilter.value;
                // Update URL with team filter parameter
                const url = new URL(window.location);
                if (currentTeamFilter !== 'all') {
                    url.searchParams.set('team', currentTeamFilter);
                } else {
                    url.searchParams.delete('team');
                }
                window.history.replaceState({}, '', url);
                
                // Re-render view with new filter
                renderView(container);
            });
        }
        
        // Add status filter event listener
        const statusFilter = document.getElementById('cujStatusFilter');
        if (statusFilter) {
            // Set current selection if it exists in URL
            const urlParams = new URLSearchParams(window.location.search);
            const statusParam = urlParams.get('cujStatus');
            if (statusParam) {
                statusFilter.value = statusParam;
            }
            
            statusFilter.addEventListener('change', () => {
                const selectedStatus = statusFilter.value;
                
                // Update URL with status filter parameter
                const url = new URL(window.location);
                if (selectedStatus !== 'all') {
                    url.searchParams.set('cujStatus', selectedStatus);
                } else {
                    url.searchParams.delete('cujStatus');
                }
                window.history.replaceState({}, '', url);
                
                // Re-render view with new filter
                renderView(container);
            });
        }
        
        // Get pagination options from URL
        const paginationOptions = UI.getPaginationFromURL('cujs');
        
        // Create CUJs table with pagination
        const table = UI.createPaginatedTable(
            ['Name', 'Description', 'Team', 'Service', 'Status', 'Actions'],
            filteredCUJs.map(cuj => ({
                ...cuj,
                team: cuj.teamName || 'N/A',
                service: cuj.serviceName || 'N/A',
                status: getStatusText(cuj.status || 'draft'),
            })),
            cuj => cuj.cujUID,
            cuj => {
                // Handle row click
                console.log('CUJ clicked:', cuj);
                showCUJDetails(cuj);
            },
            // Edit handler
            cuj => {
                console.log('Edit CUJ from actions:', cuj);
                showEditCUJModal(cuj);
            },
            // Delete handler
            cuj => {
                console.log('Delete CUJ from actions:', cuj);
                
                // Create confirmation modal
                const confirmContent = document.createElement('div');
                confirmContent.innerHTML = `
                    <p>Are you sure you want to delete the CUJ "${cuj.name}"?</p>
                    <p>This action cannot be undone.</p>
                `;
                
                const deleteButton = UI.createButton('Delete', async () => {
                    try {
                        await deleteCUJ(cuj.cujUID);
                        UI.showToast('CUJ deleted successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error deleting CUJ:', error);
                        UI.showToast('Error deleting CUJ', 'error');
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
        
        // Add event listeners
        const createCUJBtn = document.getElementById('create-cuj-btn');
        if (createCUJBtn) {
            createCUJBtn.addEventListener('click', () => {
                showCreateCUJModal();
            });
        }
    };
    
    /**
     * Filter CUJs by team
     * @param {Array} cujList - List of CUJs to filter
     * @param {string} teamUID - Team UID to filter by, or 'all' for all teams
     * @returns {Array} Filtered CUJs
     */
    const filterCUJsByTeam = (cujList, teamUID) => {
        if (teamUID === 'all') {
            return cujList;
        }
        
        return cujList.filter(cuj => cuj.teamUID === teamUID);
    };
    
    /**
     * Show the create CUJ modal
     */
    const showCreateCUJModal = async () => {
        try {
            console.log("Showing Create CUJ Modal");
            // Get teams and services for dropdowns
            const teams = await Database.getAll(Database.STORES.TEAMS);
            const services = await Database.getAll(Database.STORES.SERVICES);
            
            console.log("Teams and services loaded for cascading dropdowns");
            
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <form id="create-cuj-form">
                    <div class="form-group">
                        <label for="cuj-name" class="form-label">CUJ Name *</label>
                        <input type="text" id="cuj-name" name="name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="cuj-description" class="form-label">Description</label>
                        <textarea id="cuj-description" name="description" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="cuj-team" class="form-label">Team *</label>
                        <select id="cuj-team" name="teamUID" class="form-control" required>
                            <option value="">Select a team</option>
                            ${teams.map(team => `<option value="${team.teamUID}">${team.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cuj-service" class="form-label">Service *</label>
                        <select id="cuj-service" name="serviceUID" class="form-control" required disabled>
                            <option value="">Select a team first</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cuj-status" class="form-label">Status *</label>
                        <select id="cuj-status" name="status" class="form-control" required>
                            <option value="draft" selected>Draft</option>
                            <option value="ready-for-review">Ready for Review</option>
                            <option value="approved">Approved</option>
                            <option value="denied">Denied</option>
                            <option value="inactive">Inactive</option>
                            <option value="experimental">Experimental</option>
                        </select>
                        <div class="form-help-text">
                            <span class="material-icons info-icon">info</span>
                            <span>Select the appropriate status for this CUJ:
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
                </form>
            `;
            
            const saveButton = UI.createButton('Save', async () => {
                const form = document.getElementById('create-cuj-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    
                    const cujData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        serviceUID: formData.get('serviceUID'),
                        teamUID: formData.get('teamUID'), // Store the team UID as well
                        status: formData.get('status')
                    };
                    
                    try {
                        await createCUJ(cujData);
                        UI.showToast('CUJ created successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error creating CUJ:', error);
                        UI.showToast('Error creating CUJ', 'error');
                    }
                } else {
                    form.reportValidity();
                }
            }, 'primary');
            
            const cancelButton = UI.createButton('Cancel', () => {
                const modalElement = document.querySelector('.modal-overlay');
                if (modalElement) {
                    UI.hideModal(modalElement);
                }
            }, 'secondary');
            
            // Update the title to match what's expected in the test
            const modal = UI.createModal('Create Critical User Journey', modalContent, [cancelButton, saveButton]);
            
            // Adding a class to ensure the modal header's text is clean for test
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.setAttribute('data-testid', 'close-button');
                closeBtn.textContent = ''; // Remove text content
                closeBtn.innerHTML = '&times;'; // Set it as HTML
            }
            
            UI.showModal(modal);
            
            // Set up the cascading dropdowns using our dedicated function
            const teamSelect = document.getElementById('cuj-team');
            const serviceSelect = document.getElementById('cuj-service');
            setupTeamServiceCascading(teamSelect, serviceSelect, services);
        } catch (error) {
            console.error('Error preparing CUJ modal:', error);
            UI.showToast('Error loading teams and services', 'error');
        }
    };
    
    /**
     * Show CUJ details with a custom modal implementation
     * @param {Object} cuj - CUJ object
     */
    const showCUJDetails = async (cuj) => {
        // Skip showing the details if we're cancelling from edit
        if (window._skipShowingDetails) {
            window._skipShowingDetails = false;
            return;
        }
    
        console.log('Showing details for CUJ:', cuj);
        console.log('CUJ status:', cuj.status, 'Type:', typeof cuj.status);
        
        // Get service data for displaying the service name
        let serviceName = 'N/A';
        let teamName = 'N/A';
        try {
            if (cuj.serviceUID) {
                const service = await Database.get(Database.STORES.SERVICES, cuj.serviceUID);
                serviceName = service.name;
                
                // Get team information from service
                if (service.teamUID) {
                    const team = await Database.get(Database.STORES.TEAMS, service.teamUID);
                    if (team) {
                        teamName = team.name;
                    }
                }
            }
        } catch (error) {
            console.error('Error getting service or team data:', error);
        }
        
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
        modalTitle.textContent = `CUJ: ${cuj.name}`;
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
                    <h3>Critical User Journey Details</h3>
                    <div class="details-grid">
                        <div class="details-label">Name:</div>
                        <div class="details-value">${cuj.name || 'N/A'}</div>
                        
                        <div class="details-label">Description:</div>
                        <div class="details-value">${cuj.description || 'N/A'}</div>
                        
                        <div class="details-label">Team:</div>
                        <div class="details-value">${teamName}</div>
                        
                        <div class="details-label">Service:</div>
                        <div class="details-value">${serviceName}</div>
                        
                        <div class="details-label">Status:</div>
                        <div class="details-value">
                            ${formatStatus(cuj.status || 'draft')}
                            ${cuj.status === 'denied' && cuj.reviews && cuj.reviews.length > 0 ? 
                                `<div class="denial-reason">${cuj.reviews[cuj.reviews.length-1].reason ? 
                                    `<span class="reason-label">Reason:</span> ${cuj.reviews[cuj.reviews.length-1].reason}` : 
                                    'No reason provided'}</div>` : 
                                ''}
                        </div>
                        
                        <div class="details-label">Created:</div>
                        <div class="details-value">${new Date(cuj.createdAt).toLocaleString() || 'N/A'}</div>
                        
                        <div class="details-label">Last Modified:</div>
                        <div class="details-value">${cuj.modifiedAt ? new Date(cuj.modifiedAt).toLocaleString() : 'N/A'}</div>
                        
                        <div class="details-label">Authors:</div>
                        <div class="details-value">${cuj.authors ? cuj.authors.join(', ') : 'N/A'}</div>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>History</h3>
                    <div class="history-list">
                        ${
                            cuj.history && cuj.history.length > 0
                                ? cuj.history.map(h => `
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
        
        // Add Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit CUJ';
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
            window._skipShowingDetails = true;
            document.body.removeChild(modalOverlay);
            setTimeout(() => {
                showEditCUJModal(cuj);
            }, 350);
        };
        modalFooter.appendChild(editBtn);
        
        // Add Ready for Review button if CUJ is in Draft status
        console.log('Checking if should show Ready for Review button. Status is:', cuj.status);
        if (cuj.status && cuj.status.toLowerCase() === 'draft') {
            console.log('Adding Ready for Review button');
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
                    const updatedCUJ = await setReadyForReviewCUJ(cuj.cujUID);
                    UI.showToast('CUJ marked as Ready for Review', 'success');
                    document.body.removeChild(modalOverlay);
                    showCUJDetails(updatedCUJ); // Reopen with updated data
                } catch (error) {
                    console.error('Error marking CUJ as Ready for Review:', error);
                    UI.showToast('Error updating CUJ status', 'error');
                }
            };
            modalFooter.appendChild(readyBtn);
        }
        
        // Add Approve and Deny buttons if CUJ is in Ready for Review status
        console.log('Checking if should show Approve/Deny buttons. Status is:', cuj.status);
        const readyStatus = cuj.status && (
            cuj.status.toLowerCase() === 'ready-for-review' || 
            cuj.status.toLowerCase() === 'pending'
        );
        if (readyStatus) {
            console.log('Adding Approve and Deny buttons');
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
                    const updatedCUJ = await approveCUJ(cuj.cujUID);
                    UI.showToast('CUJ approved successfully', 'success');
                    document.body.removeChild(modalOverlay);
                    showCUJDetails(updatedCUJ); // Reopen with updated data
                } catch (error) {
                    console.error('Error approving CUJ:', error);
                    UI.showToast('Error approving CUJ', 'error');
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
                // Create a denial reason modal using the regular UI modal
                const denyContent = document.createElement('div');
                denyContent.innerHTML = `
                    <p>Please provide a reason for denying this CUJ:</p>
                    <div class="form-group">
                        <textarea id="denial-reason" rows="3" placeholder="Reason for denial..."></textarea>
                    </div>
                `;
                
                // Create a custom modal similar to our main modal
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
                denialModalTitle.textContent = 'Deny CUJ';
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
                denialModalBody.appendChild(denyContent);
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
                        const updatedCUJ = await denyCUJ(cuj.cujUID, reason);
                        UI.showToast('CUJ denied', 'warning');
                        
                        // Close both modals
                        document.body.removeChild(modalOverlay);
                        document.body.removeChild(denialModalOverlay);
                        
                        // Reopen details with updated data
                        showCUJDetails(updatedCUJ);
                    } catch (error) {
                        console.error('Error denying CUJ:', error);
                        UI.showToast('Error denying CUJ', 'error');
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
    };
    
    /**
     * Show the edit CUJ modal
     * @param {Object} cuj - CUJ to edit
     */
    const showEditCUJModal = async (cuj) => {
        try {
            // Get teams and services for dropdowns
            const teams = await Database.getAll(Database.STORES.TEAMS);
            const services = await Database.getAll(Database.STORES.SERVICES);
            
            // Get the current service to determine the team
            const currentService = services.find(service => service.serviceUID === cuj.serviceUID);
            const currentTeamUID = currentService ? currentService.teamUID : cuj.teamUID;
            
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <form id="edit-cuj-form">
                    <div class="form-group">
                        <label for="cuj-name" class="form-label">CUJ Name *</label>
                        <input type="text" id="cuj-name" name="name" class="form-control" value="${cuj.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="cuj-description" class="form-label">Description</label>
                        <textarea id="cuj-description" name="description" class="form-control" rows="3">${cuj.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="cuj-team" class="form-label">Team *</label>
                        <select id="cuj-team" name="teamUID" class="form-control" required>
                            <option value="">Select a team</option>
                            ${teams.map(team => `<option value="${team.teamUID}" ${team.teamUID === currentTeamUID ? 'selected' : ''}>${team.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cuj-service" class="form-label">Service *</label>
                        <select id="cuj-service" name="serviceUID" class="form-control" required>
                            <option value="">Select a service</option>
                            <!-- Will be populated based on team selection -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cuj-status" class="form-label">Status *</label>
                        <select id="cuj-status" name="status" class="form-control" required>
                            <option value="draft" selected>Draft</option>
                            <option value="ready-for-review" ${cuj.status === 'ready-for-review' || cuj.status === 'pending' ? 'selected' : ''}>Ready for Review</option>
                            <option value="approved" ${cuj.status === 'approved' ? 'selected' : ''}>Approved</option>
                            <option value="denied" ${cuj.status === 'denied' ? 'selected' : ''}>Denied</option>
                            <option value="inactive" ${cuj.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="experimental" ${cuj.status === 'experimental' ? 'selected' : ''}>Experimental</option>
                        </select>
                        <div class="form-help-text">
                            <span class="material-icons info-icon">info</span>
                            <span>Select the appropriate status for this CUJ:
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
                </form>
            `;
            
            const saveButton = UI.createButton('Save Changes', async () => {
                const form = document.getElementById('edit-cuj-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    
                    const updatedCuj = {
                        ...cuj,
                        name: formData.get('name'),
                        description: formData.get('description'),
                        serviceUID: formData.get('serviceUID'),
                        teamUID: formData.get('teamUID'),
                        status: formData.get('status'),
                        updatedAt: new Date().toISOString()
                    };
                    
                    try {
                        await updateCUJ(updatedCuj);
                        UI.showToast('CUJ updated successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error updating CUJ:', error);
                        UI.showToast('Error updating CUJ', 'error');
                    }
                } else {
                    form.reportValidity();
                }
            }, 'primary');
            
            const cancelButton = UI.createButton('Cancel', () => {
                // Set flag to skip showing details when cancelling edits
                window._skipShowingDetails = true;
                // No need to do anything else - just close the modal
            }, 'secondary');
            
            const modal = UI.createModal(`Edit CUJ: ${cuj.name}`, modalContent, [cancelButton, saveButton]);
            UI.showModal(modal);
            
            // Set up the cascading dropdowns using the helper function
            const teamSelect = document.getElementById('cuj-team');
            const serviceSelect = document.getElementById('cuj-service');
            setupTeamServiceCascading(teamSelect, serviceSelect, services);
            
            // Since team is already selected, we need to trigger the change event to load the services
            if (currentTeamUID) {
                // Pre-select the correct service once services are loaded
                const initialTeamServices = services.filter(service => service.teamUID === currentTeamUID);
                serviceSelect.innerHTML = '<option value="">Select Service</option>';
                initialTeamServices.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.serviceUID;
                    const tierInfo = service.tier ? ` (Tier ${service.tier})` : '';
                    option.textContent = service.name + tierInfo;
                    option.selected = (service.serviceUID === cuj.serviceUID);
                    serviceSelect.appendChild(option);
                });
                serviceSelect.disabled = false;
            }
        } catch (error) {
            console.error('Error preparing edit CUJ modal:', error);
            UI.showToast('Error loading data for edit form', 'error');
        }
    };
    
    // Public API
    return {
        init,
        getAllCUJs,
        getCUJ,
        createCUJ,
        updateCUJ,
        deleteCUJ,
        approveCUJ,
        denyCUJ,
        setReadyForReviewCUJ,
        renderView,
        showCreateCUJModal,
        setupTeamServiceCascading
    };
})();

console.log('CUJs module loaded, module object:', window.cujsModule); 