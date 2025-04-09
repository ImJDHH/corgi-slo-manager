/**
 * Teams Feature Module for Corgi SLO Manager
 */

console.log('Teams module loading...');

// Make sure to expose teamsModule in the global scope
window.teamsModule = (function() {
    let teams = [];
    
    /**
     * Initialize the teams module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Teams module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            teams = await Database.getAll(Database.STORES.TEAMS);
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing teams module:', error);
            return false;
        }
    };
    
    /**
     * Get all teams
     * @returns {Array} Array of teams
     */
    const getAllTeams = () => {
        return teams;
    };
    
    /**
     * Get a team by UID
     * @param {string} teamUID - Team UID
     * @returns {Object} Team object
     */
    const getTeam = (teamUID) => {
        return teams.find(team => team.teamUID === teamUID);
    };
    
    /**
     * Create a new team
     * @param {Object} teamData - Team data
     * @returns {Promise<string>} Team UID
     */
    const createTeam = async (teamData) => {
        const team = {
            ...teamData,
            teamUID: Database.generateUID('team'),
            createdAt: new Date().toISOString()
        };
        
        const teamUID = await Database.create(Database.STORES.TEAMS, team);
        teams.push(team);
        return teamUID;
    };
    
    /**
     * Update a team
     * @param {Object} team - Updated team data
     * @returns {Promise<void>}
     */
    const updateTeam = async (team) => {
        await Database.update(Database.STORES.TEAMS, team);
        const index = teams.findIndex(t => t.teamUID === team.teamUID);
        if (index !== -1) {
            teams[index] = team;
        }
    };
    
    /**
     * Delete a team
     * @param {string} teamUID - Team UID
     * @returns {Promise<void>}
     */
    const deleteTeam = async (teamUID) => {
        await Database.remove(Database.STORES.TEAMS, teamUID);
        teams = teams.filter(team => team.teamUID !== teamUID);
    };
    
    /**
     * Render the teams view
     * @param {HTMLElement} container - Container element
     */
    const renderView = (container) => {
        console.log('Rendering Teams view');
        container.innerHTML = '';
        
        // Ensure the container has an ID for proper re-rendering
        if (!container.id) {
            container.id = 'view-container';
        }
        
        // Create header
        const header = document.createElement('div');
        header.classList.add('section-header');
        header.innerHTML = `
            <h2>Teams</h2>
            <button class="btn btn-primary" id="create-team-btn">Create Team</button>
        `;
        container.appendChild(header);
        
        // Get pagination options from URL
        const paginationOptions = UI.getPaginationFromURL('teams');
        
        // Sort teams by most recently updated or created
        const sortedTeams = [...teams].sort((a, b) => {
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
        
        // Create teams table with pagination
        const table = UI.createPaginatedTable(
            ['Name', 'Description', 'Slack Channel', 'Actions'],
            sortedTeams,
            team => team.teamUID,
            team => {
                // Handle row click
                console.log('Team clicked:', team);
                showTeamDetails(team);
            },
            // Edit handler
            team => {
                console.log('Edit team from actions:', team);
                showEditTeamModal(team);
            },
            // Delete handler
            team => {
                console.log('Delete team from actions:', team);
                
                // Create confirmation modal
                const confirmContent = document.createElement('div');
                confirmContent.innerHTML = `
                    <p>Are you sure you want to delete the team "${team.name}"?</p>
                    <p>This action cannot be undone.</p>
                `;
                
                const deleteButton = UI.createButton('Delete', async () => {
                    try {
                        await deleteTeam(team.teamUID);
                        UI.showToast('Team deleted successfully', 'success');
                        const modalElement = document.querySelector('.modal-overlay');
                        if (modalElement) {
                            UI.hideModal(modalElement);
                        }
                        renderView(document.getElementById('view-container'));
                    } catch (error) {
                        console.error('Error deleting team:', error);
                        UI.showToast('Error deleting team', 'error');
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
        const createTeamBtn = document.getElementById('create-team-btn');
        if (createTeamBtn) {
            createTeamBtn.addEventListener('click', () => {
                showCreateTeamModal();
            });
        }
    };
    
    /**
     * Show the create team modal
     */
    const showCreateTeamModal = () => {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <form id="create-team-form">
                <div class="form-group">
                    <label for="team-name" class="form-label">Team Name *</label>
                    <input type="text" id="team-name" name="name" class="form-control" required>
                </div>
                <div class="form-group">
                    <label for="team-description" class="form-label">Description</label>
                    <textarea id="team-description" name="description" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="team-email" class="form-label">Team Email</label>
                    <input type="email" id="team-email" name="email" class="form-control">
                </div>
                <div class="form-group">
                    <label for="team-slack" class="form-label">Slack Channel</label>
                    <input type="text" id="team-slack" name="slackChannel" class="form-control" placeholder="e.g., #team-channel">
                </div>
            </form>
        `;
        
        const saveButton = UI.createButton('Save', async () => {
            const form = document.getElementById('create-team-form');
            if (form.checkValidity()) {
                const formData = new FormData(form);
                
                const teamData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    email: formData.get('email'),
                    slackChannel: formData.get('slackChannel')
                };
                
                try {
                    await createTeam(teamData);
                    UI.showToast('Team created successfully', 'success');
                    const modalElement = document.querySelector('.modal-overlay');
                    if (modalElement) {
                        UI.hideModal(modalElement);
                    }
                    renderView(document.getElementById('view-container'));
                } catch (error) {
                    console.error('Error creating team:', error);
                    UI.showToast('Error creating team', 'error');
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
        
        const modal = UI.createModal('Create Team', modalContent, [cancelButton, saveButton]);
        
        // Adding a class to ensure the modal header's text is clean for test
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.setAttribute('data-testid', 'close-button');
            closeBtn.textContent = ''; // Remove text content
            closeBtn.innerHTML = '&times;'; // Set it as HTML
        }
        
        UI.showModal(modal);
    };
    
    /**
     * Show team details
     * @param {Object} team - Team object
     */
    const showTeamDetails = (team) => {
        // Skip showing the details if we're cancelling from edit
        if (window._skipShowingDetails) {
            window._skipShowingDetails = false;
            return;
        }
    
        console.log('Showing details for team:', team);
        
        const detailsContent = document.createElement('div');
        detailsContent.classList.add('details-view');
        
        detailsContent.innerHTML = `
            <div class="details-section">
                <h3>Team Details</h3>
                <div class="details-grid">
                    <div class="details-label">Name:</div>
                    <div class="details-value">${team.name || 'N/A'}</div>
                    
                    <div class="details-label">Description:</div>
                    <div class="details-value">${team.description || 'N/A'}</div>
                    
                    <div class="details-label">Email:</div>
                    <div class="details-value">${team.email || 'N/A'}</div>
                    
                    <div class="details-label">Slack Channel:</div>
                    <div class="details-value">${team.slackChannel || 'N/A'}</div>
                    
                    <div class="details-label">Created:</div>
                    <div class="details-value">${new Date(team.createdAt).toLocaleString() || 'N/A'}</div>
                </div>
            </div>
        `;
        
        const editButton = UI.createButton('Edit Team', () => {
            // Set flag to prevent showing details after edit modal is closed
            window._skipShowingDetails = true;
            
            // Close this modal properly
            const modalElement = document.querySelector('.modal-overlay');
            if (modalElement) {
                UI.hideModal(modalElement);
                
                // Show edit modal after a slight delay to allow close animation
                setTimeout(() => {
                    showEditTeamModal(team);
                }, 350);
            }
        }, 'primary');
        
        const closeButton = UI.createButton('Close', () => {
            const modalElement = document.querySelector('.modal-overlay');
            if (modalElement) {
                UI.hideModal(modalElement);
            }
        }, 'secondary');
        
        const modal = UI.createModal(`Team: ${team.name}`, detailsContent, [closeButton, editButton]);
        UI.showModal(modal);
    };
    
    /**
     * Show the edit team modal
     * @param {Object} team - Team to edit
     */
    const showEditTeamModal = async (team) => {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <form id="edit-team-form">
                <div class="form-group">
                    <label for="team-name" class="form-label">Team Name *</label>
                    <input type="text" id="team-name" name="name" class="form-control" value="${team.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="team-description" class="form-label">Description</label>
                    <textarea id="team-description" name="description" class="form-control" rows="3">${team.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="team-email" class="form-label">Email</label>
                    <input type="email" id="team-email" name="email" class="form-control" value="${team.email || ''}">
                </div>
                <div class="form-group">
                    <label for="team-slack" class="form-label">Slack Channel</label>
                    <input type="text" id="team-slack" name="slackChannel" class="form-control" value="${team.slackChannel || ''}">
                </div>
            </form>
        `;
        
        const saveButton = UI.createButton('Save Changes', async () => {
            const form = document.getElementById('edit-team-form');
            if (form.checkValidity()) {
                const formData = new FormData(form);
                
                const updatedTeam = {
                    ...team,
                    name: formData.get('name'),
                    description: formData.get('description'),
                    email: formData.get('email'),
                    slackChannel: formData.get('slackChannel'),
                    updatedAt: new Date().toISOString()
                };
                
                try {
                    await updateTeam(updatedTeam);
                    UI.showToast('Team updated successfully', 'success');
                    const modalElement = document.querySelector('.modal-overlay');
                    if (modalElement) {
                        UI.hideModal(modalElement);
                    }
                    renderView(document.getElementById('view-container'));
                } catch (error) {
                    console.error('Error updating team:', error);
                    UI.showToast('Error updating team', 'error');
                }
            } else {
                form.reportValidity();
            }
        }, 'primary');
        
        const cancelButton = UI.createButton('Cancel', () => {
            // Set flag to skip showing details when cancelling edits
            window._skipShowingDetails = true;
            // Close the modal properly
            const modalElement = document.querySelector('.modal-overlay');
            if (modalElement) {
                UI.hideModal(modalElement);
            }
        }, 'secondary');
        
        const modal = UI.createModal(`Edit Team: ${team.name}`, modalContent, [cancelButton, saveButton]);
        UI.showModal(modal);
    };
    
    // Public API
    return {
        init,
        getAllTeams,
        getTeam,
        createTeam,
        updateTeam,
        deleteTeam,
        renderView
    };
})();

console.log('Teams module loaded, module object:', window.teamsModule); 