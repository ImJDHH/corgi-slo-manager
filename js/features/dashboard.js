/**
 * Dashboard Feature Module for Corgi SLO Manager
 */

console.log('Dashboard module loading...');

// Make sure to expose dashboardModule in the global scope
window.dashboardModule = (function() {
    console.log('Initializing dashboard module');
    
    // Cache for dashboard data
    let dashboardData = null;
    let allTeams = [];
    let currentTimeRange = 'Last 30 days';
    let currentTeamFilter = 'all'; // Default to show all teams
    
    /**
     * Initialize the dashboard module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Dashboard module init called', params);
        
        // FORCE ADD STYLES TO HEAD
        const urgentStyles = document.createElement('style');
        urgentStyles.id = 'urgent-attention-styles';
        urgentStyles.innerHTML = `
            tr.urgent, 
            tr.urgent td, 
            .urgent,
            table tr.urgent,
            tbody tr.urgent,
            .urgent td {
                background-color: rgba(239, 71, 111, 0.25) !important;
            }
            
            tr.attention, 
            tr.attention td, 
            .attention,
            table tr.attention,
            tbody tr.attention,
            .attention td {
                background-color: rgba(255, 209, 102, 0.25) !important;
            }
        `;
        document.head.appendChild(urgentStyles);
        
        // Check if container exists
        if (!container) {
            console.error('Dashboard container is missing');
            return false;
        }
        
        try {
            console.log('Dashboard: Starting initialization process');
            
            // Force reset dashboard data to ensure fresh load
            dashboardData = null;
            
            // First render the dashboard template
            renderDashboardTemplate(container);
            console.log('Dashboard: Template rendered');
            
            // Then fetch and update the dashboard data
            try {
                await fetchDashboardData();
                console.log('Dashboard: Data fetched successfully');
            } catch (dataError) {
                console.error('Dashboard: Error fetching data:', dataError);
                // Continue even if data fetch fails - we'll show empty states
            }
            
            // Update the dashboard with the fetched data
            updateDashboard();
            console.log('Dashboard: UI updated with data');
            
            // Set up event listeners
            setupEventListeners();
            console.log('Dashboard: Event listeners set up');
            
            console.log('Dashboard initialization complete!');
            return true;
        } catch (error) {
            console.error('ERROR initializing dashboard module:', error);
            console.error('Error stack:', error.stack);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">error_outline</span>
                        <h2>Dashboard Error</h2>
                        <p>There was an error loading the dashboard: ${error.message}</p>
                        <button class="btn btn-primary" id="retry-dashboard">Retry</button>
                    </div>
                </div>
            `;
            
            // Add retry button handler
            const retryBtn = container.querySelector('#retry-dashboard');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    console.log('Retrying dashboard initialization...');
                    init(container, params);
                });
            }
            
            return false;
        }
    };
    
    /**
     * Render the dashboard template
     * @param {HTMLElement} container - Container element
     */
    const renderDashboardTemplate = (container) => {
        // Get dashboard template
        const template = document.getElementById('dashboard-template');
        
        if (template) {
            container.innerHTML = '';
            container.appendChild(document.importNode(template.content, true));
        } else {
            // Fallback if template not found
            container.innerHTML = `
                <section class="dashboard-view">
                    <header class="section-header">
                        <h2>Dashboard</h2>
                        <div class="controls">
                            <div class="team-filter">
                                <label for="teamFilter">Team:</label>
                                <select id="teamFilter">
                                    <option value="all" selected>All Teams</option>
                                    <!-- Team options will be populated dynamically -->
                                </select>
                            </div>
                            <div class="date-filter">
                                <label for="timeRange">Time Range:</label>
                                <select id="timeRange">
                                    <option>Last 7 days</option>
                                    <option selected>Last 30 days</option>
                                    <option>Last 90 days</option>
                                    <option>All time</option>
                                </select>
                            </div>
                        </div>
                    </header>

                    <div class="dashboard-grid">
                        <!-- Row 1: Primary KPIs -->
                        <div class="stats-card">
                            <h3>Total SLOs</h3>
                            <div class="stat-value" id="active-slos-value">-</div>
                            <div class="trend neutral" id="active-slos-trend">Loading...</div>
                        </div>
                        <div class="stats-card">
                            <h3>Total CUJs</h3>
                            <div class="stat-value" id="total-cujs-value">-</div>
                            <div class="trend neutral" id="total-cujs-trend">Loading...</div>
                        </div>
                        <div class="stats-card">
                            <h3>Teams with SLOs</h3>
                            <div class="stat-value" id="teams-with-slos-value">-</div>
                            <div class="trend neutral" id="teams-with-slos-trend">Loading...</div>
                        </div>
                    </div>
                    
                    <div class="dashboard-grid">
                        <!-- Row 2: Secondary KPIs -->
                        <div class="stats-card">
                            <h3>SLO Coverage</h3>
                            <div class="stat-value" id="slo-coverage-value">-</div>
                            <div class="trend neutral" id="slo-coverage-trend">Loading...</div>
                        </div>
                        <div class="stats-card">
                            <h3>CUJs per Team</h3>
                            <div class="stat-value" id="cujs-per-team-value">-</div>
                            <div class="trend neutral" id="cujs-per-team-trend">Loading...</div>
                        </div>
                        <div class="stats-card">
                            <h3>SLOs per Service</h3>
                            <div class="stat-value" id="slos-per-service-value">-</div>
                            <div class="trend neutral" id="slos-per-service-trend">Loading...</div>
                        </div>
                    </div>

                    <div class="team-performance-section">
                        <h3>Team SLO Adoption</h3>
                        <div id="team-performance-container">
                            <div class="empty-state">
                                <div class="empty-state-content">
                                    <span class="material-icons">insights</span>
                                    <p>Loading team data...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pending-reviews-section">
                        <h3>Pending Reviews</h3>
                        <div id="pending-reviews-container" class="activity-list empty-state">
                            <div class="empty-state-content">
                                <span class="material-icons">task_alt</span>
                                <p>Loading pending reviews...</p>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }
        
        // Add team filter if it doesn't exist in the template
        if (!document.getElementById('teamFilter')) {
            const controlsDiv = document.querySelector('.section-header .controls');
            if (controlsDiv) {
                const timeRangeDiv = controlsDiv.querySelector('.date-filter');
                
                const teamFilterDiv = document.createElement('div');
                teamFilterDiv.className = 'team-filter';
                teamFilterDiv.innerHTML = `
                    <label for="teamFilter">Team:</label>
                    <select id="teamFilter">
                        <option value="all" selected>All Teams</option>
                        <!-- Team options will be populated dynamically -->
                    </select>
                `;
                
                // Insert before time range filter
                if (timeRangeDiv) {
                    controlsDiv.insertBefore(teamFilterDiv, timeRangeDiv);
                } else {
                    controlsDiv.appendChild(teamFilterDiv);
                }
            }
        }
    };
    
    /**
     * Set up event listeners for the dashboard
     */
    const setupEventListeners = () => {
        // Set up time range filter
        const timeRange = document.getElementById('timeRange');
        if (timeRange) {
            // Set the initial value
            timeRange.value = currentTimeRange;
            
            timeRange.addEventListener('change', async () => {
                console.log('Time range changed:', timeRange.value);
                currentTimeRange = timeRange.value;
                
                // Update dashboard with new time range
                await fetchDashboardData();
                updateDashboard();
            });
        }
        
        // Set up team filter
        const teamFilter = document.getElementById('teamFilter');
        if (teamFilter) {
            // Populate team dropdown with available teams
            populateTeamFilter(teamFilter);
            
            // Set initial value
            teamFilter.value = currentTeamFilter;
            
            teamFilter.addEventListener('change', async () => {
                console.log('Team filter changed:', teamFilter.value);
                currentTeamFilter = teamFilter.value;
                
                // Add active class to show filter is applied
                const header = document.querySelector('.section-header');
                if (currentTeamFilter !== 'all' && header) {
                    header.classList.add('filtered');
                } else if (header) {
                    header.classList.remove('filtered');
                }
                
                // Update dashboard with new team filter
                await fetchDashboardData();
                updateDashboard();
            });
        }
        
        // Add refresh button
        const controlsDiv = document.querySelector('.section-header .controls');
        if (controlsDiv) {
            const refreshButton = document.createElement('button');
            refreshButton.classList.add('btn-icon', 'btn-secondary');
            refreshButton.setAttribute('aria-label', 'Refresh dashboard');
            refreshButton.innerHTML = '<span class="material-icons">refresh</span>';
            refreshButton.addEventListener('click', async () => {
                refreshButton.classList.add('rotating');
                await fetchDashboardData();
                updateDashboard();
                setTimeout(() => {
                    refreshButton.classList.remove('rotating');
                }, 1000);
            });
            
            controlsDiv.appendChild(refreshButton);
        }
    };
    
    /**
     * Populate the team filter dropdown with available teams
     */
    const populateTeamFilter = async (filterElement) => {
        // Clear existing options except "All Teams"
        while (filterElement.options.length > 1) {
            filterElement.remove(1);
        }
        
        try {
            // If we don't have teams data yet, fetch it
            if (allTeams.length === 0) {
                allTeams = await Database.getAll(Database.STORES.TEAMS);
            }
            
            // Sort teams alphabetically
            allTeams.sort((a, b) => a.name.localeCompare(b.name));
            
            // Add team options
            allTeams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.teamUID;
                option.textContent = team.name;
                filterElement.appendChild(option);
            });
            
            // If no teams were added, add a disabled option
            if (allTeams.length === 0) {
                const option = document.createElement('option');
                option.disabled = true;
                option.textContent = 'No teams available';
                filterElement.appendChild(option);
            }
            
        } catch (error) {
            console.error('Error populating team filter:', error);
            
            // Add a fallback option
            const option = document.createElement('option');
            option.disabled = true;
            option.textContent = 'Error loading teams';
            filterElement.appendChild(option);
        }
    };
    
    /**
     * Fetch all dashboard data from the database
     */
    const fetchDashboardData = async () => {
        console.log('Fetching fresh dashboard data from database...');
        try {
            // Get raw data from database
            const teams = await Database.getAll(Database.STORES.TEAMS);
            const services = await Database.getAll(Database.STORES.SERVICES);
            const cujs = await Database.getAll(Database.STORES.CUJS);
            const slos = await Database.getAll(Database.STORES.SLOS);
            const auditLogs = await Database.getAll(Database.STORES.AUDIT_LOGS);
            
            // Get activities from the ACTIVITIES store
            let activities = [];
            try {
                activities = await Database.getAll(Database.STORES.ACTIVITIES);
                console.log('Activities loaded:', activities.length);
            } catch (error) {
                console.warn('Failed to load activities:', error);
                // Continue with empty activities
            }
            
            // Store all teams for filter dropdown
            allTeams = teams;
            
            console.log('Raw data fetched:', { 
                teams: teams.length, 
                services: services.length, 
                cujs: cujs.length, 
                slos: slos.length, 
                logs: auditLogs.length,
                activities: activities.length
            });
            
            // If no data exists, create sample data for visualization
            if (teams.length === 0 && services.length === 0) {
                console.log('No data found, creating sample data for visualization');
                dashboardData = createSampleData();
                return dashboardData;
            }
            
            // Ensure data has team information
            // We'll add it here as a fallback in case it wasn't added when the entities were created
            const teamsByService = {};
            services.forEach(service => {
                if (service.teamUID) {
                    teamsByService[service.serviceUID] = {
                        teamUID: service.teamUID,
                        teamName: teams.find(t => t.teamUID === service.teamUID)?.name || 'Unknown Team'
                    };
                }
            });
            
            // Ensure CUJs have team information
            cujs.forEach(cuj => {
                if (!cuj.teamUID && cuj.serviceUID && teamsByService[cuj.serviceUID]) {
                    cuj.teamUID = teamsByService[cuj.serviceUID].teamUID;
                    cuj.teamName = teamsByService[cuj.serviceUID].teamName;
                }
            });
            
            // Ensure SLOs have team information
            slos.forEach(slo => {
                if (!slo.teamUID && slo.serviceUID && teamsByService[slo.serviceUID]) {
                    slo.teamUID = teamsByService[slo.serviceUID].teamUID;
                    slo.teamName = teamsByService[slo.serviceUID].teamName;
                }
            });
            
            // Filter data by time range if needed
            const timeFilteredData = filterDataByTimeRange({
                teams, services, cujs, slos, auditLogs, activities
            }, currentTimeRange);
            
            // Apply team filter if not "all"
            const filteredData = filterDataByTeam(timeFilteredData, currentTeamFilter);
            
            // Get pending reviews (items with status "ready-for-review" or "pending")
            const pendingReviews = [
                ...filteredData.slos
                    .filter(slo => slo.status === 'ready-for-review' || slo.status === 'pending')
                    .map(slo => ({
                        type: 'SLO',
                        uid: slo.sloUID,
                        name: slo.name,
                        teamUID: slo.teamUID,
                        teamName: slo.teamName,
                        readyForReviewAt: slo.readyForReviewAt || slo.modifiedAt,
                        readyForReviewBy: slo.readyForReviewBy || slo.modifiedBy,
                        timestamp: slo.modifiedAt || slo.createdAt
                    })),
                ...filteredData.cujs
                    .filter(cuj => cuj.status === 'ready-for-review' || cuj.status === 'pending')
                    .map(cuj => ({
                        type: 'CUJ',
                        uid: cuj.cujUID,
                        name: cuj.name,
                        teamUID: cuj.teamUID,
                        teamName: cuj.teamName,
                        readyForReviewAt: cuj.readyForReviewAt || cuj.modifiedAt,
                        readyForReviewBy: cuj.readyForReviewBy || cuj.modifiedBy,
                        timestamp: cuj.modifiedAt || cuj.createdAt
                    }))
            ];
            
            // Sort by date (oldest first)
            pendingReviews.sort((a, b) => new Date(a.readyForReviewAt || a.timestamp) - new Date(b.readyForReviewAt || b.timestamp));
            
            // Compute primary stats
            const activeSLOs = filteredData.slos.length;
            const totalCUJs = filteredData.cujs.length;
            
            // Count approved SLOs and CUJs
            const approvedSLOs = filteredData.slos.filter(slo => slo.status === 'approved').length;
            const approvedCUJs = filteredData.cujs.filter(cuj => cuj.status === 'approved').length;
            
            // Teams with SLOs - now more accurate using teamUID from SLOs
            const teamsWithSLOs = new Set();
            filteredData.slos.forEach(slo => {
                if (slo.teamUID) {
                    teamsWithSLOs.add(slo.teamUID);
                } else {
                    // Fallback to service lookup if teamUID not directly on SLO
                    const service = filteredData.services.find(s => s.serviceUID === slo.serviceUID);
                    if (service && service.teamUID) {
                        teamsWithSLOs.add(service.teamUID);
                    }
                }
            });
            const teamsWithSLOsCount = teamsWithSLOs.size;
            const teamsWithSLOsPercentage = filteredData.teams.length > 0 ? 
                Math.round((teamsWithSLOsCount / filteredData.teams.length) * 100) : 0;
            
            // Compute secondary stats
            const totalServices = filteredData.services.length;
            const slosCoverage = totalServices > 0 ? 
                Math.round((filteredData.services.filter(s => 
                    filteredData.slos.some(slo => slo.serviceUID === s.serviceUID)
                ).length / totalServices) * 100) : 0;
            
            const cujsPerTeam = filteredData.teams.length > 0 ? 
                (totalCUJs / filteredData.teams.length).toFixed(1) : 0;
            
            const slosPerService = totalServices > 0 ?
                (activeSLOs / totalServices).toFixed(1) : 0;
            
            // Team performance data - enhanced with status counts
            const teamPerformance = filteredData.teams.map(team => {
                // Get services for this team
                const teamServices = filteredData.services.filter(s => s.teamUID === team.teamUID);
                const teamServiceUIDs = teamServices.map(s => s.serviceUID);
                
                // Get CUJs for this team - either direct match or via service
                const teamCUJs = filteredData.cujs.filter(cuj => 
                    cuj.teamUID === team.teamUID || teamServiceUIDs.includes(cuj.serviceUID));
                
                // Get SLOs for this team - either direct match or via service
                const teamSLOs = filteredData.slos.filter(slo => 
                    slo.teamUID === team.teamUID || teamServiceUIDs.includes(slo.serviceUID));
                
                // Count SLOs in different statuses
                const pendingReviewCount = teamSLOs.filter(slo => 
                    slo.status === 'ready-for-review' || slo.status === 'pending').length;
                
                const approvedCount = teamSLOs.filter(slo => 
                    slo.status === 'approved').length;
                
                return {
                    team,
                    cujCount: teamCUJs.length,
                    sloCount: teamSLOs.length,
                    serviceCount: teamServices.length,
                    pendingReviewCount,
                    approvedCount,
                    cujPerService: teamServices.length > 0 ? 
                        (teamCUJs.length / teamServices.length).toFixed(1) : 0,
                    sloPerService: teamServices.length > 0 ? 
                        (teamSLOs.length / teamServices.length).toFixed(1) : 0
                };
            });
            
            // Sort teams by SLO count (descending)
            teamPerformance.sort((a, b) => b.sloCount - a.sloCount);
            
            // Recent activity - from both audit logs and activities stores
            const combinedActivities = [
                ...auditLogs.map(log => ({
                    entityType: log.entityType,
                    entityUID: log.entityUID,
                    action: log.action,
                    userUID: log.userUID,
                    timestamp: log.timestamp
                })),
                ...activities // Activities from the new ACTIVITIES store
            ];
            
            const recentActivities = combinedActivities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10); // Get only the 10 most recent activities
            
            // Store computed dashboard data
            dashboardData = {
                primaryStats: {
                    activeSLOs,
                    totalCUJs,
                    approvedSLOs,
                    approvedCUJs,
                    teamsWithSLOs: teamsWithSLOsCount,
                    teamsWithSLOsPercentage
                },
                secondaryStats: {
                    slosCoverage,
                    cujsPerTeam,
                    slosPerService
                },
                teamPerformance,
                pendingReviews,
                recentActivities,
                filteredTeamName: currentTeamFilter === 'all' ? null : 
                    filteredData.teams.find(t => t.teamUID === currentTeamFilter)?.name || 'Unknown Team'
            };
            
            console.log('Dashboard data computed:', dashboardData);
            
            return dashboardData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            
            // Return sample data in case of error
            console.log('Using sample data due to error');
            dashboardData = createSampleData();
            return dashboardData;
        }
    };
    
    /**
     * Filter data by team
     * @param {Object} data - The data to filter
     * @param {string} teamUID - The team UID to filter by, or 'all' for all teams
     * @returns {Object} Filtered data
     */
    const filterDataByTeam = (data, teamUID) => {
        if (teamUID === 'all') {
            return data;
        }
        
        console.log(`Filtering data strictly by team: ${teamUID}`);
        
        // Only select the specific team
        const filteredTeams = [data.teams.find(team => team.teamUID === teamUID)].filter(Boolean);
        
        // Only select services owned by this team
        const filteredServices = data.services.filter(service => service.teamUID === teamUID);
        const serviceUIDs = filteredServices.map(service => service.serviceUID);
        
        // Only select CUJs owned by this team
        const filteredCUJs = data.cujs.filter(cuj => cuj.teamUID === teamUID);
        const cujUIDs = filteredCUJs.map(cuj => cuj.cujUID);
        
        // Only select SLOs owned by this team
        const filteredSLOs = data.slos.filter(slo => slo.teamUID === teamUID);
        
        // Filter activities by team or team's entities
        const teamEntityUIDs = [
            teamUID,
            ...serviceUIDs, 
            ...cujUIDs, 
            ...filteredSLOs.map(slo => slo.sloUID)
        ];
        
        const filteredActivities = data.activities.filter(activity => 
            teamEntityUIDs.includes(activity.entityUID) || 
            (activity.entityType === 'team' && activity.entityUID === teamUID));
        
        // Filter audit logs by team or team's entities
        const filteredLogs = data.auditLogs.filter(log => 
            teamEntityUIDs.includes(log.entityUID) || 
            (log.entityType === 'team' && log.entityUID === teamUID));
        
        console.log('Filtered data counts:', {
            teams: filteredTeams.length,
            services: filteredServices.length,
            cujs: filteredCUJs.length,
            slos: filteredSLOs.length
        });
        
        return {
            teams: filteredTeams,
            services: filteredServices,
            cujs: filteredCUJs,
            slos: filteredSLOs,
            auditLogs: filteredLogs,
            activities: filteredActivities
        };
    };
    
    /**
     * Filter data by time range
     */
    const filterDataByTimeRange = (data, timeRange) => {
        // Get the cutoff date based on time range
        const now = new Date();
        let cutoffDate = new Date();
        
        switch (timeRange) {
            case 'Last 7 days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case 'Last 30 days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case 'Last 90 days':
                cutoffDate.setDate(now.getDate() - 90);
                break;
            case 'All time':
                cutoffDate = new Date(0); // Beginning of time
                break;
            default:
                cutoffDate.setDate(now.getDate() - 30); // Default to 30 days
        }
        
        // Filter logs and activities by time - other entities always show current state
        return {
            ...data,
            auditLogs: data.auditLogs.filter(log => 
                new Date(log.timestamp) >= cutoffDate),
            activities: data.activities ? data.activities.filter(activity => 
                new Date(activity.timestamp) >= cutoffDate) : []
        };
    };
    
    /**
     * Update the dashboard UI with the fetched data
     */
    const updateDashboard = () => {
        if (!dashboardData) {
            console.warn('Dashboard data not available, cannot update UI');
            return;
        }
        
        try {
            // Update dashboard title if filtered
            updateDashboardTitle();
            
            // Update primary stats
            updateStatCard('active-slos', dashboardData.primaryStats.activeSLOs, dashboardData.primaryStats.approvedSLOs);
            updateStatCard('total-cujs', dashboardData.primaryStats.totalCUJs, dashboardData.primaryStats.approvedCUJs);
            updateStatCard('teams-with-slos', 
                `${dashboardData.primaryStats.teamsWithSLOs} (${dashboardData.primaryStats.teamsWithSLOsPercentage}%)`);
            
            // Update secondary stats
            updateStatCard('slo-coverage', `${dashboardData.secondaryStats.slosCoverage}%`);
            updateStatCard('cujs-per-team', dashboardData.secondaryStats.cujsPerTeam);
            updateStatCard('slos-per-service', dashboardData.secondaryStats.slosPerService);
            
            // Update team performance
            updateTeamPerformance();
            
            // Update pending reviews
            updatePendingReviews();
            
            console.log('Dashboard UI updated successfully');
        } catch (error) {
            console.error('Error updating dashboard UI:', error);
        }
    };
    
    /**
     * Update the dashboard title to show active filter
     */
    const updateDashboardTitle = () => {
        const dashboardTitle = document.querySelector('.section-header h2');
        if (dashboardTitle) {
            if (dashboardData.filteredTeamName) {
                dashboardTitle.innerHTML = `Dashboard: <span class="filter-tag">${dashboardData.filteredTeamName}</span>`;
            } else {
                dashboardTitle.textContent = 'Dashboard';
            }
        }
    };
    
    /**
     * Update a single stat card in the UI
     */
    const updateStatCard = (id, value, approvedCount = null) => {
        const valueElement = document.getElementById(`${id}-value`);
        const trendElement = document.getElementById(`${id}-trend`);
        
        if (valueElement) {
            if (approvedCount !== null && (id === 'active-slos' || id === 'total-cujs')) {
                valueElement.innerHTML = `${value} <span class="approved-count">(${approvedCount} approved)</span>`;
            } else {
                valueElement.textContent = value;
            }
        }
        
        if (trendElement) {
            // For now, we'll just show the current value
            // In the future, we could compute trend based on previous data
            trendElement.textContent = 'Current';
            trendElement.className = 'trend neutral';
        }
    };
    
    /**
     * Update the team performance section in the UI
     */
    const updateTeamPerformance = () => {
        const container = document.getElementById('team-performance-container');
        
        if (!container) return;
        
        if (dashboardData.teamPerformance.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">groups</span>
                        <p>No team data available. Start by creating teams and services.</p>
                        <a href="#teams" class="btn btn-primary">Go to Teams</a>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create a table for team performance
        const table = document.createElement('table');
        table.classList.add('table');
        
        // Add table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Team</th>
                <th>Services</th>
                <th>CUJs</th>
                <th>SLOs</th>
                <th>Ready for Review</th>
                <th>Approved</th>
                <th>SLO Coverage</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        
        dashboardData.teamPerformance.forEach(teamData => {
            const row = document.createElement('tr');
            
            // Calculate coverage percentage
            const coverage = teamData.serviceCount > 0 ?
                Math.round((teamData.sloCount / teamData.serviceCount) * 100) : 0;
            
            // Determine row class based on coverage
            let rowClass = '';
            if (coverage >= 80) rowClass = 'success';
            else if (coverage >= 50) rowClass = 'warning';
            else if (coverage > 0) rowClass = 'danger';
            
            if (rowClass) {
                row.classList.add(rowClass);
            }
            
            // Add a progress bar for coverage
            const progressBar = `
                <div class="progress-bar">
                    <div class="progress-fill ${rowClass || 'neutral'}" style="width: ${coverage}%"></div>
                    <span>${coverage}%</span>
                </div>
            `;
            
            row.innerHTML = `
                <td><a href="#dashboard?team=${teamData.team.teamUID}">${teamData.team.name}</a></td>
                <td>${teamData.serviceCount}</td>
                <td>${teamData.cujCount}</td>
                <td>${teamData.sloCount}</td>
                <td>${teamData.pendingReviewCount || 0}</td>
                <td>${teamData.approvedCount || 0}</td>
                <td>${progressBar}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        
        // Replace container content with the table
        container.innerHTML = '';
        container.appendChild(table);
        
        // Add a legend for the progress bar colors
        const legend = document.createElement('div');
        legend.className = 'coverage-legend';
        legend.innerHTML = `
            <div class="legend-item">
                <span class="legend-color success"></span>
                <span class="legend-text">High coverage (80%+)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color warning"></span>
                <span class="legend-text">Medium coverage (50-79%)</span>
            </div>
            <div class="legend-item">
                <span class="legend-color danger"></span>
                <span class="legend-text">Low coverage (< 50%)</span>
            </div>
        `;
        container.appendChild(legend);
    };
    
    /**
     * Update the pending reviews section in the UI
     */
    const updatePendingReviews = () => {
        console.log("⚠️ Running updatePendingReviews with NEW direct approach");
        // Find existing container or create a new one
        let container = document.querySelector('.pending-reviews-section');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'pending-reviews-section team-performance-section';
            
            const title = document.createElement('h3');
            title.textContent = 'Pending Reviews';
            container.appendChild(title);
            
            const contentDiv = document.createElement('div');
            contentDiv.id = 'pending-reviews-container';
            container.appendChild(contentDiv);
            
            // Insert before team performance section
            const teamPerformanceSection = document.querySelector('.team-performance-section');
            if (teamPerformanceSection) {
                teamPerformanceSection.parentNode.insertBefore(container, teamPerformanceSection);
            } else {
                document.querySelector('.dashboard-view').appendChild(container);
            }
        }
        
        const reviewsContainer = document.getElementById('pending-reviews-container');
        
        if (!reviewsContainer) return;
        
        // Check if we have pending reviews
        if (!dashboardData.pendingReviews || dashboardData.pendingReviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-content">
                        <span class="material-icons">task_alt</span>
                        <p>No pending reviews at this time.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Clear previous content
        reviewsContainer.innerHTML = '';
        
        // Create a plain HTML table directly
        const tableHtml = `
            <table style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="padding:8px; text-align:left; border-bottom:1px solid #ddd;">Type</th>
                        <th style="padding:8px; text-align:left; border-bottom:1px solid #ddd;">Name</th>
                        <th style="padding:8px; text-align:left; border-bottom:1px solid #ddd;">Team</th>
                        <th style="padding:8px; text-align:left; border-bottom:1px solid #ddd;">Since</th>
                        <th style="padding:8px; text-align:left; border-bottom:1px solid #ddd;">Actions</th>
                    </tr>
                </thead>
                <tbody id="pending-reviews-tbody">
                </tbody>
            </table>
        `;
        
        reviewsContainer.innerHTML = tableHtml;
        
        const tbody = document.getElementById('pending-reviews-tbody');
        
        // Add rows for each pending review
        dashboardData.pendingReviews.forEach(item => {
            // Calculate days since status change
            const daysSince = Math.floor((new Date() - new Date(item.readyForReviewAt || item.timestamp)) / (1000 * 60 * 60 * 24));
            console.log(`Item ${item.name} has been waiting for ${daysSince} days`);
            
            // Format date
            const formattedDate = new Date(item.readyForReviewAt || item.timestamp).toLocaleDateString();
            
            // Determine styling
            let rowStyle = '';
            let cssClass = '';
            
            if (daysSince >= 7) {
                console.log(`🔴 URGENT: ${item.name} - ${daysSince} days`);
                rowStyle = 'background-color: rgba(239, 71, 111, 0.25) !important;';
                cssClass = 'urgent';
            } else if (daysSince >= 3) {
                console.log(`🟡 ATTENTION: ${item.name} - ${daysSince} days`);
                rowStyle = 'background-color: rgba(255, 209, 102, 0.25) !important;';
                cssClass = 'attention';
            }
            
            // Create row HTML
            const rowHtml = `
                <tr class="${cssClass}" style="${rowStyle}">
                    <td style="${rowStyle} padding:8px; border-bottom:1px solid #ddd;">${item.type}</td>
                    <td style="${rowStyle} padding:8px; border-bottom:1px solid #ddd;">${item.name}</td>
                    <td style="${rowStyle} padding:8px; border-bottom:1px solid #ddd;">${item.teamName || 'Unknown'}</td>
                    <td style="${rowStyle} padding:8px; border-bottom:1px solid #ddd;">${formattedDate} (${daysSince} days)</td>
                    <td style="${rowStyle} padding:8px; border-bottom:1px solid #ddd;">
                        <a href="#${item.type.toLowerCase()}s?id=${item.uid}" style="color:#4285F4; text-decoration:none;">
                            <span class="material-icons" style="vertical-align:middle;">visibility</span>
                        </a>
                    </td>
                </tr>
            `;
            
            // Add to table
            tbody.innerHTML += rowHtml;
        });
        
        // Add legend for urgency levels
        const legend = document.createElement('div');
        legend.style.cssText = 'display:flex; gap:20px; margin-top:15px; font-size:13px; color:#666;';
        
        // Add legend items
        const urgentLegend = document.createElement('div');
        urgentLegend.style.cssText = 'display:flex; align-items:center; gap:6px;';
        urgentLegend.innerHTML = `
            <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background-color:rgba(239, 71, 111, 0.5);"></span>
            <span>Waiting 7+ days</span>
        `;
        
        const attentionLegend = document.createElement('div');
        attentionLegend.style.cssText = 'display:flex; align-items:center; gap:6px;';
        attentionLegend.innerHTML = `
            <span style="display:inline-block; width:12px; height:12px; border-radius:3px; background-color:rgba(255, 209, 102, 0.5);"></span>
            <span>Waiting 3-6 days</span>
        `;
        
        legend.appendChild(urgentLegend);
        legend.appendChild(attentionLegend);
        reviewsContainer.appendChild(legend);
    };
    
    /**
     * Create sample data for visualization when no real data exists
     * This helps users understand what the dashboard will look like with data
     */
    const createSampleData = () => {
        // Generate sample data with pending reviews
        return {
            primaryStats: {
                activeSLOs: 18,
                totalCUJs: 32,
                approvedSLOs: 12,
                approvedCUJs: 18,
                teamsWithSLOs: 6,
                teamsWithSLOsPercentage: 85
            },
            secondaryStats: {
                slosCoverage: 75,
                cujsPerTeam: 5.3,
                slosPerService: 2.8
            },
            teamPerformance: [
                {
                    team: { name: 'Customer Experience', teamUID: 'sample-team-1' },
                    serviceCount: 3,
                    cujCount: 8,
                    sloCount: 6,
                    pendingReviewCount: 3,
                    approvedCount: 3,
                    cujPerService: 2.7,
                    sloPerService: 2.0
                },
                {
                    team: { name: 'Platform Engineering', teamUID: 'sample-team-2' },
                    serviceCount: 4,
                    cujCount: 10,
                    sloCount: 7,
                    pendingReviewCount: 2,
                    approvedCount: 5,
                    cujPerService: 2.5,
                    sloPerService: 1.75
                },
                {
                    team: { name: 'Data Science', teamUID: 'sample-team-3' },
                    serviceCount: 3,
                    cujCount: 6,
                    sloCount: 4,
                    pendingReviewCount: 2,
                    approvedCount: 2,
                    cujPerService: 2.0,
                    sloPerService: 1.33
                },
                {
                    team: { name: 'Security', teamUID: 'sample-team-4' },
                    serviceCount: 2,
                    cujCount: 4,
                    sloCount: 3,
                    pendingReviewCount: 1,
                    approvedCount: 2,
                    cujPerService: 2.0,
                    sloPerService: 1.5
                },
                {
                    team: { name: 'Mobile Apps', teamUID: 'sample-team-5' },
                    serviceCount: 2,
                    cujCount: 4,
                    sloCount: 2,
                    pendingReviewCount: 1,
                    approvedCount: 1,
                    cujPerService: 2.0,
                    sloPerService: 1.0
                },
                {
                    team: { name: 'DevOps', teamUID: 'sample-team-6' },
                    serviceCount: 3,
                    cujCount: 5,
                    sloCount: 4,
                    pendingReviewCount: 1,
                    approvedCount: 3,
                    cujPerService: 1.67,
                    sloPerService: 1.33
                },
                {
                    team: { name: 'Product Management', teamUID: 'sample-team-7' },
                    serviceCount: 2,
                    cujCount: 3,
                    sloCount: 0,
                    pendingReviewCount: 0,
                    approvedCount: 0,
                    cujPerService: 1.5,
                    sloPerService: 0.0
                }
            ],
            pendingReviews: [
                {
                    type: 'SLO',
                    uid: 'sample-slo-1',
                    name: 'API Response Time',
                    teamUID: 'sample-team-1',
                    teamName: 'Customer Experience',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), // 9 days ago
                    readyForReviewBy: 'john.doe@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
                    cuj: 'User Login',
                    metricSource: 'Prometheus',
                    metricName: 'http_request_duration_seconds'
                },
                {
                    type: 'SLO',
                    uid: 'sample-slo-2',
                    name: 'Checkout Completion Rate',
                    teamUID: 'sample-team-1',
                    teamName: 'Customer Experience',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
                    readyForReviewBy: 'jane.smith@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
                    cuj: 'Purchase Checkout',
                    metricSource: 'Custom Analytics',
                    metricName: 'checkout_success_rate'
                },
                {
                    type: 'SLO',
                    uid: 'sample-slo-3',
                    name: 'Payment Processing Time',
                    teamUID: 'sample-team-1',
                    teamName: 'Customer Experience',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                    readyForReviewBy: 'sarah.parker@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
                    cuj: 'Payment Processing',
                    metricSource: 'Datadog',
                    metricName: 'payment_processing_duration'
                },
                {
                    type: 'CUJ',
                    uid: 'sample-cuj-1',
                    name: 'User Registration',
                    teamUID: 'sample-team-2',
                    teamName: 'Platform Engineering',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
                    readyForReviewBy: 'alice.walker@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
                },
                {
                    type: 'CUJ',
                    uid: 'sample-cuj-2',
                    name: 'API Authentication',
                    teamUID: 'sample-team-2',
                    teamName: 'Platform Engineering',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
                    readyForReviewBy: 'bob.johnson@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
                },
                {
                    type: 'SLO',
                    uid: 'sample-slo-4',
                    name: 'Database Query Performance',
                    teamUID: 'sample-team-3',
                    teamName: 'Data Science',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
                    readyForReviewBy: 'robert.johnson@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
                    cuj: 'Data Analytics Dashboard',
                    metricSource: 'CloudWatch',
                    metricName: 'database_query_duration'
                },
                {
                    type: 'SLO',
                    uid: 'sample-slo-5',
                    name: 'ML Model Training Time',
                    teamUID: 'sample-team-3',
                    teamName: 'Data Science',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                    readyForReviewBy: 'emily.chen@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
                    cuj: 'ML Model Training',
                    metricSource: 'MLflow',
                    metricName: 'model_training_duration'
                },
                {
                    type: 'CUJ',
                    uid: 'sample-cuj-3',
                    name: 'Security Scan Workflow',
                    teamUID: 'sample-team-4',
                    teamName: 'Security',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
                    readyForReviewBy: 'michael.nguyen@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
                },
                {
                    type: 'CUJ',
                    uid: 'sample-cuj-4',
                    name: 'Mobile App Onboarding',
                    teamUID: 'sample-team-5',
                    teamName: 'Mobile Apps',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                    readyForReviewBy: 'jessica.wang@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
                },
                {
                    type: 'SLO',
                    uid: 'sample-slo-6',
                    name: 'CI/CD Pipeline Duration',
                    teamUID: 'sample-team-6',
                    teamName: 'DevOps',
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                    readyForReviewBy: 'sam.wilson@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
                    cuj: 'Code Deployment',
                    metricSource: 'Jenkins',
                    metricName: 'pipeline_duration_seconds'
                }
            ],
            recentActivities: [
                {
                    entityType: 'slos',
                    entityUID: 'sample-slo-1',
                    action: 'create',
                    userUID: 'john.doe@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
                },
                {
                    entityType: 'services',
                    entityUID: 'sample-service-2',
                    action: 'update',
                    userUID: 'jane.smith@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutes ago
                },
                {
                    entityType: 'cujs',
                    entityUID: 'sample-cuj-1',
                    action: 'update',
                    userUID: 'alice.walker@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
                },
                {
                    entityType: 'teams',
                    entityUID: 'sample-team-1',
                    action: 'create',
                    userUID: 'robert.johnson@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
                },
                {
                    entityType: 'system',
                    entityUID: 'database',
                    action: 'import',
                    userUID: 'admin@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
                },
                {
                    entityType: 'slos',
                    entityUID: 'sample-slo-3',
                    action: 'approve',
                    userUID: 'manager@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
                },
                {
                    entityType: 'slos',
                    entityUID: 'sample-slo-2',
                    action: 'delete',
                    userUID: 'developer@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
                },
                {
                    entityType: 'system',
                    entityUID: 'database',
                    action: 'export',
                    userUID: 'admin@example.com',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString() // 28 hours ago
                }
            ],
            filteredTeamName: null
        };
    };
    
    /**
     * Clear dashboard data cache and fully refresh from database
     */
    const refreshDashboardData = async () => {
        try {
            // Clear cached dashboard data before fetching
            dashboardData = {
                primaryStats: {
                    activeSLOs: 0,
                    totalCUJs: 0,
                    approvedSLOs: 0,
                    approvedCUJs: 0,
                    teamsWithSLOs: 0,
                    teamsWithSLOsPercentage: 0
                },
                secondaryStats: {
                    slosCoverage: 0,
                    cujsPerTeam: 0,
                    slosPerService: 0
                },
                teamPerformance: [],
                pendingReviews: [],
                recentActivity: []
            };
            
            // First clear UI
            updateDashboard();
            
            // Now fetch fresh data
            await fetchDashboardData();
            
            // Then update UI with fresh data
            updateDashboard();
            
            // Force a refresh of the urgent/attention styles
            const styleEl = document.getElementById('urgent-attention-styles');
            if (styleEl) {
                // Force a style refresh by removing and re-adding
                document.head.removeChild(styleEl);
                document.head.appendChild(styleEl);
            }
            
            // Log the completion of the refresh
            console.log('Dashboard data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    };
    
    // Public API
    return {
        init,
        refreshDashboard: refreshDashboardData
    };
})();

console.log('Dashboard module loaded, module object:', window.dashboardModule); 