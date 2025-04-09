/**
 * Services Feature Module for Corgi SLO Manager
 */

console.log('Services module loading...');

// Make sure to expose servicesModule in the global scope
window.servicesModule = (function() {
    let services = [];
    let allTeams = [];
    let currentTeamFilter = 'all'; // Default to show all teams
    
    /**
     * Initialize the services module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Services module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            services = await Database.getAll(Database.STORES.SERVICES);
            // Load teams for filter
            allTeams = await Database.getAll(Database.STORES.TEAMS);
            
            // Check for team filter in URL
            if (params && params.team) {
                currentTeamFilter = params.team;
            }
            
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing services module:', error);
            return false;
        }
    };
    
    /**
     * Get all services
     * @returns {Array} Array of services
     */
    const getAllServices = () => {
        return services;
    };
    
    /**
     * Get a service by UID
     * @param {string} serviceUID - Service UID
     * @returns {Object} Service object
     */
    const getService = (serviceUID) => {
        return services.find(service => service.serviceUID === serviceUID);
    };
    
    /**
     * Create a new service
     * @param {Object} serviceData - Service data
     * @returns {Promise<string>} Service UID
     */
    const createService = async (serviceData) => {
        const service = {
            ...serviceData,
            serviceUID: Database.generateUID('service'),
            createdAt: new Date().toISOString()
        };
        
        const serviceUID = await Database.create(Database.STORES.SERVICES, service);
        services.push(service);
        return serviceUID;
    };
    
    /**
     * Update a service
     * @param {Object} service - Updated service data
     * @returns {Promise<void>}
     */
    const updateService = async (service) => {
        await Database.update(Database.STORES.SERVICES, service);
        const index = services.findIndex(s => s.serviceUID === service.serviceUID);
        if (index !== -1) {
            services[index] = service;
        }
    };
    
    /**
     * Delete a service
     * @param {string} serviceUID - Service UID
     * @returns {Promise<void>}
     */
    const deleteService = async (serviceUID) => {
        await Database.remove(Database.STORES.SERVICES, serviceUID);
        services = services.filter(service => service.serviceUID !== serviceUID);
    };
    
    /**
     * Render the services view
     * @param {HTMLElement} container - Container element
     */
    const renderView = async (container) => {
        console.log('Rendering Services view');
        container.innerHTML = '';
        
        // Ensure the container has an ID for proper re-rendering
        if (!container.id) {
            container.id = 'view-container';
        }
        
        // Fetch team data for services
        try {
            const teams = await Database.getAll(Database.STORES.TEAMS);
            allTeams = teams; // Update teams list
            
            // Add team names to services
            services.forEach(service => {
                if (service.teamUID) {
                    const team = teams.find(t => t.teamUID === service.teamUID);
                    if (team) {
                        service.teamName = team.name;
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching team data:', error);
        }
        
        // Filter services by team if a team filter is set
        let filteredServices = filterServicesByTeam(services, currentTeamFilter);
        
        // Sort services by most recently updated or created
        filteredServices.sort((a, b) => {
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
            <h2>Services${teamName ? ` <span class="filter-tag">Team: ${teamName}</span>` : ''}</h2>
            <div class="controls">
                <div class="team-filter">
                    <label for="serviceTeamFilter">Team:</label>
                    <select id="serviceTeamFilter">
                        <option value="all">All Teams</option>
                        <!-- Team options will be populated dynamically -->
                    </select>
                </div>
                <button class="btn btn-primary" id="create-service-btn">Create Service</button>
            </div>
        `;
        container.appendChild(header);
        
        // Populate team filter
        const teamFilter = document.getElementById('serviceTeamFilter');
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
        
        // Get pagination options from URL
        const paginationOptions = UI.getPaginationFromURL('services');
        
        // Create services table with pagination
        const table = UI.createPaginatedTable(
            ['Name', 'Description', 'Team', 'Tier', 'Actions'],
            filteredServices,
            service => service.serviceUID,
            service => {
                // Handle row click
                console.log('Service clicked:', service);
                showServiceDetails(service);
            },
            // Edit handler
            service => {
                console.log('Edit service from actions:', service);
                showEditServiceModal(service);
            },
            // Delete handler
            service => {
                console.log('Delete service from actions:', service);
                
                // Create confirmation modal
                const confirmContent = document.createElement('div');
                confirmContent.innerHTML = `
                    <p>Are you sure you want to delete the service "${service.name}"?</p>
                    <p>This action cannot be undone.</p>
                `;
                
                const deleteButton = UI.createButton('Delete', async () => {
                    try {
                        await deleteService(service.serviceUID);
                        UI.showToast('Service deleted successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error deleting service:', error);
                        UI.showToast('Error deleting service', 'error');
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
        const createServiceBtn = document.getElementById('create-service-btn');
        if (createServiceBtn) {
            createServiceBtn.addEventListener('click', () => {
                showCreateServiceModal();
            });
        }
    };
    
    /**
     * Filter services by team
     * @param {Array} serviceList - List of services to filter
     * @param {string} teamUID - Team UID to filter by, or 'all' for all teams
     * @returns {Array} Filtered services
     */
    const filterServicesByTeam = (serviceList, teamUID) => {
        if (teamUID === 'all') {
            return serviceList;
        }
        
        return serviceList.filter(service => service.teamUID === teamUID);
    };
    
    /**
     * Show the create service modal
     */
    const showCreateServiceModal = async () => {
        try {
            // Get teams for dropdown
            const teams = await Database.getAll(Database.STORES.TEAMS);
            
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <form id="create-service-form">
                    <div class="form-group">
                        <label for="service-name" class="form-label">Service Name *</label>
                        <input type="text" id="service-name" name="name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="service-description" class="form-label">Description</label>
                        <textarea id="service-description" name="description" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="service-team" class="form-label">Team *</label>
                        <select id="service-team" name="teamUID" class="form-control" required>
                            <option value="">Select a team</option>
                            ${teams.map(team => `<option value="${team.teamUID}">${team.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="service-tier" class="form-label">Service Tier *</label>
                        <select id="service-tier" name="tier" class="form-control" required>
                            <option value="">Select a tier</option>
                            <option value="1">Tier 1 (Critical)</option>
                            <option value="2">Tier 2 (Important)</option>
                            <option value="3">Tier 3 (Standard)</option>
                            <option value="4">Tier 4 (Development)</option>
                        </select>
                    </div>
                </form>
            `;
            
            const saveButton = UI.createButton('Save', async () => {
                const form = document.getElementById('create-service-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    
                    const serviceData = {
                        name: formData.get('name'),
                        description: formData.get('description'),
                        teamUID: formData.get('teamUID'),
                        tier: formData.get('tier')
                    };
                    
                    try {
                        await createService(serviceData);
                        UI.showToast('Service created successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error creating service:', error);
                        UI.showToast('Error creating service', 'error');
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
            
            const modal = UI.createModal('Create Service', modalContent, [cancelButton, saveButton]);
            
            // Adding a class to ensure the modal header's text is clean for test
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.setAttribute('data-testid', 'close-button');
                closeBtn.textContent = ''; // Remove text content
                closeBtn.innerHTML = '&times;'; // Set it as HTML
            }
            
            UI.showModal(modal);
        } catch (error) {
            console.error('Error preparing service modal:', error);
            UI.showToast('Error loading teams', 'error');
        }
    };
    
    /**
     * Show service details
     * @param {Object} service - Service object
     */
    const showServiceDetails = async (service) => {
        // Skip showing the details if we're cancelling from edit
        if (window._skipShowingDetails) {
            window._skipShowingDetails = false;
            return;
        }
    
        console.log('Showing details for service:', service);
        
        // Get team data for displaying the team name
        let teamName = 'N/A';
        try {
            if (service.teamUID) {
                const team = await Database.get(Database.STORES.TEAMS, service.teamUID);
                teamName = team.name;
            }
        } catch (error) {
            console.error('Error getting team data:', error);
        }
        
        // Create tier text display
        let tierText = 'N/A';
        if (service.tier) {
            switch(service.tier) {
                case '1': tierText = 'Tier 1 (Critical)'; break;
                case '2': tierText = 'Tier 2 (Important)'; break;
                case '3': tierText = 'Tier 3 (Standard)'; break;
                case '4': tierText = 'Tier 4 (Development)'; break;
                default: tierText = `Tier ${service.tier}`;
            }
        }
        
        const detailsContent = document.createElement('div');
        detailsContent.classList.add('details-view');
        
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>Service Details</h3>
                <div class="details-grid">
                    <div class="details-label">Name:</div>
                    <div class="details-value">${service.name || 'N/A'}</div>
                    
                    <div class="details-label">Description:</div>
                    <div class="details-value">${service.description || 'N/A'}</div>
                    
                    <div class="details-label">Team:</div>
                    <div class="details-value">${teamName}</div>
                    
                    <div class="details-label">Service Tier:</div>
                    <div class="details-value">${tierText}</div>
                    
                    <div class="details-label">Created:</div>
                    <div class="details-value">${new Date(service.createdAt).toLocaleString() || 'N/A'}</div>
                </div>
            </div>
        `;
        
        const editButton = UI.createButton('Edit Service', () => {
            // Set flag to prevent showing details after edit modal is closed
            window._skipShowingDetails = true;
            
            // Close this modal properly
            const modalElement = document.querySelector('.modal-overlay');
            if (modalElement) {
                UI.hideModal(modalElement);
                
                // Show edit modal after a slight delay to allow close animation
                setTimeout(() => {
                    showEditServiceModal(service);
                }, 350);
            }
        }, 'primary');
        
        const closeButton = UI.createButton('Close', () => {
            const modalElement = document.querySelector('.modal-overlay');
            if (modalElement) {
                UI.hideModal(modalElement);
            }
        }, 'secondary');
        
        const modal = UI.createModal(`Service: ${service.name}`, detailsContent, [closeButton, editButton]);
        UI.showModal(modal);
    };
    
    /**
     * Show the edit service modal
     * @param {Object} service - Service to edit
     */
    const showEditServiceModal = async (service) => {
        try {
            // Get teams for dropdown
            const teams = await Database.getAll(Database.STORES.TEAMS);
            
            const modalContent = document.createElement('div');
            modalContent.innerHTML = `
                <form id="edit-service-form">
                    <div class="form-group">
                        <label for="service-name" class="form-label">Service Name *</label>
                        <input type="text" id="service-name" name="name" class="form-control" value="${service.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="service-description" class="form-label">Description</label>
                        <textarea id="service-description" name="description" class="form-control" rows="3">${service.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="service-team" class="form-label">Team *</label>
                        <select id="service-team" name="teamUID" class="form-control" required>
                            <option value="">Select a team</option>
                            ${teams.map(team => `<option value="${team.teamUID}" ${team.teamUID === service.teamUID ? 'selected' : ''}>${team.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="service-tier" class="form-label">Service Tier *</label>
                        <select id="service-tier" name="tier" class="form-control" required>
                            <option value="">Select a tier</option>
                            <option value="1" ${service.tier === '1' ? 'selected' : ''}>Tier 1 (Critical)</option>
                            <option value="2" ${service.tier === '2' ? 'selected' : ''}>Tier 2 (Important)</option>
                            <option value="3" ${service.tier === '3' ? 'selected' : ''}>Tier 3 (Standard)</option>
                            <option value="4" ${service.tier === '4' ? 'selected' : ''}>Tier 4 (Development)</option>
                        </select>
                    </div>
                </form>
            `;
            
            const saveButton = UI.createButton('Save Changes', async () => {
                const form = document.getElementById('edit-service-form');
                if (form.checkValidity()) {
                    const formData = new FormData(form);
                    
                    const updatedService = {
                        ...service,
                        name: formData.get('name'),
                        description: formData.get('description'),
                        teamUID: formData.get('teamUID'),
                        tier: formData.get('tier'),
                        updatedAt: new Date().toISOString()
                    };
                    
                    try {
                        await updateService(updatedService);
                        UI.showToast('Service updated successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error updating service:', error);
                        UI.showToast('Error updating service', 'error');
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
            
            const modal = UI.createModal(`Edit Service: ${service.name}`, modalContent, [cancelButton, saveButton]);
            UI.showModal(modal);
        } catch (error) {
            console.error('Error preparing service edit modal:', error);
            UI.showToast('Error loading teams data', 'error');
        }
    };
    
    // Public API
    return {
        init,
        getAllServices,
        getService,
        createService,
        updateService,
        deleteService,
        renderView
    };
})();

console.log('Services module loaded, module object:', window.servicesModule);