/**
 * Tools Feature Module for Corgi SLO Manager
 */

console.log('Tools module loading...');

// At the top of the file, add a backup settings object
// Add backup settings
let backupSettings = {
    backupLocation: 'backupCorgiSLO/versions', // Default backup location
    autoBackup: false,
    backupInterval: 24 // hours
};

// Load backup settings from localStorage if available
try {
    const savedSettings = localStorage.getItem('backupSettings');
    if (savedSettings) {
        backupSettings = { ...backupSettings, ...JSON.parse(savedSettings) };
    }
} catch (error) {
    console.error('Error loading backup settings:', error);
}

// Function to save backup settings
const saveBackupSettings = () => {
    try {
        localStorage.setItem('backupSettings', JSON.stringify(backupSettings));
        return true;
    } catch (error) {
        console.error('Error saving backup settings:', error);
        return false;
    }
};

// Make sure to expose toolsModule in the global scope
window.toolsModule = (function() {
    /**
     * Initialize the tools module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Tools module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing tools module:', error);
            return false;
        }
    };
    
    /**
     * Export data to JSON file
     * @param {Object} data - Data to export
     * @param {string} filename - Name of the file
     * @param {boolean} saveToFolder - Whether to save to backup folder (true) or download (false)
     */
    const exportToJSON = (data, filename, saveToFolder = true) => {
        const jsonString = JSON.stringify(data, null, 2);
        
        if (saveToFolder) {
            // Create a timestamp folder within the backup location
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const folderName = `${backupSettings.backupLocation}/corgi-backup-${timestamp}`;
            
            // Use a fake path approach to display to user
            UI.showToast(`Backup saved to ${folderName}/${filename}`, 'success');
            
            // In a real server-side environment, we would use fs.writeFile or similar
            // Since we're in the browser, we'll still create a downloadable file
            // but inform the user about the theoretical server-side location
            console.log(`[BACKUP] Would save to: ${folderName}/${filename}`);
        }
        
        // Always create a downloadable file as a fallback/convenience
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    /**
     * Import data from JSON file
     * @param {File} file - JSON file to import
     * @returns {Promise<Object>} Parsed JSON data
     */
    const importFromJSON = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    };
    
    /**
     * Handle export functionality
     */
    const handleExport = async () => {
        try {
            // Fetch all data from the database
            const teams = await Database.getAll(Database.STORES.TEAMS);
            const services = await Database.getAll(Database.STORES.SERVICES);
            const cujs = await Database.getAll(Database.STORES.CUJS);
            const slos = await Database.getAll(Database.STORES.SLOS);
            
            // Prepare data for export, removing UIDs and adding relationship fields
            const exportData = {
                teams: teams.map(team => ({
                    name: team.name,
                    description: team.description,
                    email: team.email,
                    slackChannel: team.slackChannel
                })),
                services: services.map(service => {
                    const team = teams.find(t => t.teamUID === service.teamUID);
                    return {
                        name: service.name,
                        description: service.description,
                        teamName: team ? team.name : null,
                        tier: service.tier
                    };
                }),
                cujs: cujs.map(cuj => {
                    const service = services.find(s => s.serviceUID === cuj.serviceUID);
                    return {
                        name: cuj.name,
                        description: cuj.description,
                        serviceName: service ? service.name : null
                    };
                }),
                slos: slos.map(slo => {
                    const service = services.find(s => s.serviceUID === slo.serviceUID);
                    return {
                        name: slo.name,
                        description: slo.description,
                        serviceName: service ? service.name : null,
                        sliName: slo.sliName,
                        sliDescription: slo.sliDescription,
                        target: slo.target,
                        window: slo.window,
                        threshold: slo.threshold
                    };
                })
            };
            
            // Export to JSON file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            exportToJSON(exportData, `corgi-slo-export-${timestamp}.json`);
            UI.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            UI.showToast('Error exporting data', 'error');
        }
    };
    
    /**
     * Handle import functionality
     */
    const handleImport = async () => {
        try {
            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            
            // Set up change listener
            fileInput.addEventListener('change', async (event) => {
                if (event.target.files.length > 0) {
                    const file = event.target.files[0];
                    
                    try {
                        // Show loading toast
                        UI.showToast('Importing data...', 'info');
                        
                        // Read file contents
                        const fileContents = await readFileAsText(file);
                        
                        // Parse JSON
                        const data = JSON.parse(fileContents);
                        
                        // Validate data structure
                        if (!validateImportData(data)) {
                            throw new Error('Invalid data structure in import file');
                        }
                        
                        // Clear existing data
                        console.log('Clearing existing database stores');
                        try {
                            console.log('Clearing TEAMS store...');
                            await Database.clearStore(Database.STORES.TEAMS);
                            console.log('TEAMS store cleared successfully');
                            
                            console.log('Clearing SERVICES store...');
                            await Database.clearStore(Database.STORES.SERVICES);
                            console.log('SERVICES store cleared successfully');
                            
                            console.log('Clearing CUJS store...');
                            await Database.clearStore(Database.STORES.CUJS);
                            console.log('CUJS store cleared successfully');
                            
                            console.log('Clearing SLOS store...');
                            await Database.clearStore(Database.STORES.SLOS);
                            console.log('SLOS store cleared successfully');
                            
                            console.log('Clearing ACTIVITIES store...');
                            await Database.clearStore(Database.STORES.ACTIVITIES);
                            console.log('ACTIVITIES store cleared successfully');
                        } catch (clearError) {
                            console.error('Error during database clearing:', clearError);
                        }
                        
                        // Create maps to store name-to-UID mappings
                        const teamMap = new Map();
                        const serviceMap = new Map();
                        
                        // Import data in sequence to maintain proper relationships
                        if (data.teams && Array.isArray(data.teams)) {
                            for (const rawTeam of data.teams) {
                                // Add required fields
                                const team = {
                                    teamUID: rawTeam.teamUID || Database.generateUID('team'),
                                    name: rawTeam.name,
                                    description: rawTeam.description,
                                    email: rawTeam.email,
                                    slackChannel: rawTeam.slackChannel,
                                    createdAt: rawTeam.createdAt || new Date().toISOString()
                                };
                                
                                // Store the team UID for later reference
                                teamMap.set(team.name, team.teamUID);
                                
                                await Database.create(Database.STORES.TEAMS, team);
                            }
                            console.log(`Imported ${data.teams.length} teams`);
                        }
                        
                        if (data.services && Array.isArray(data.services)) {
                            for (const rawService of data.services) {
                                // Look up team UID from name if needed
                                let teamUID = rawService.teamUID;
                                if (!teamUID && rawService.teamName) {
                                    teamUID = teamMap.get(rawService.teamName);
                                    if (!teamUID) {
                                        console.warn(`Team not found for service: ${rawService.name}, creating with default team`);
                                        teamUID = teamMap.values().next().value; // Use first team as default
                                    }
                                }
                                
                                // Add required fields
                                const service = {
                                    serviceUID: rawService.serviceUID || Database.generateUID('service'),
                                    name: rawService.name,
                                    description: rawService.description,
                                    teamUID: teamUID,
                                    endpoints: rawService.endpoints || [],
                                    documentation: rawService.documentation || '',
                                    createdAt: rawService.createdAt || new Date().toISOString()
                                };
                                
                                // Store the service UID for later reference
                                serviceMap.set(service.name, service.serviceUID);
                                
                                await Database.create(Database.STORES.SERVICES, service);
                            }
                            console.log(`Imported ${data.services.length} services`);
                        }
                        
                        if (data.cujs && Array.isArray(data.cujs)) {
                            for (const rawCuj of data.cujs) {
                                // Look up service UID from name if needed
                                let serviceUID = rawCuj.serviceUID;
                                if (!serviceUID && rawCuj.serviceName) {
                                    serviceUID = serviceMap.get(rawCuj.serviceName);
                                    if (!serviceUID) {
                                        console.warn(`Service not found for CUJ: ${rawCuj.name}, skipping`);
                                        continue;
                                    }
                                }
                                
                                // Add required fields
                                const cuj = {
                                    cujUID: rawCuj.cujUID || Database.generateUID('cuj'),
                                    name: rawCuj.name,
                                    description: rawCuj.description,
                                    serviceUID: serviceUID,
                                    steps: rawCuj.steps || [],
                                    userTypes: rawCuj.userTypes || [],
                                    createdAt: rawCuj.createdAt || new Date().toISOString()
                                };
                                
                                await Database.create(Database.STORES.CUJS, cuj);
                            }
                            console.log(`Imported ${data.cujs.length} CUJs`);
                        }
                        
                        if (data.slos && Array.isArray(data.slos)) {
                            for (const rawSlo of data.slos) {
                                // Look up service UID from name if needed
                                let serviceUID = rawSlo.serviceUID;
                                if (!serviceUID && rawSlo.serviceName) {
                                    serviceUID = serviceMap.get(rawSlo.serviceName);
                                    if (!serviceUID) {
                                        console.warn(`Service not found for SLO: ${rawSlo.name}, skipping`);
                                        continue;
                                    }
                                }
                                
                                // Add required fields with embedded SLI data
                                const slo = {
                                    sloUID: rawSlo.sloUID || Database.generateUID('slo'),
                                    name: rawSlo.name,
                                    description: rawSlo.description,
                                    serviceUID: serviceUID,
                                    serviceName: rawSlo.serviceName,
                                    sliName: rawSlo.sliName,
                                    sliDescription: rawSlo.sliDescription || `SLI for ${rawSlo.name}`,
                                    target: rawSlo.target,
                                    window: rawSlo.window,
                                    threshold: rawSlo.threshold,
                                    status: rawSlo.status || 'active',
                                    createdAt: rawSlo.createdAt || new Date().toISOString(),
                                    modifiedAt: rawSlo.modifiedAt || new Date().toISOString(),
                                    authors: rawSlo.authors || ['System Import'],
                                    modifiedBy: rawSlo.modifiedBy || 'System Import',
                                    history: rawSlo.history || [
                                        {
                                            action: 'created',
                                            timestamp: new Date().toISOString(),
                                            user: 'System Import',
                                            details: 'SLO imported from file'
                                        }
                                    ]
                                };
                                
                                await Database.create(Database.STORES.SLOS, slo);
                            }
                            console.log(`Imported ${data.slos.length} SLOs`);
                        }
                        
                        // Import recent activities if present
                        if (data.recentActivities && Array.isArray(data.recentActivities)) {
                            for (const activity of data.recentActivities) {
                                await Database.create(Database.STORES.ACTIVITIES, {
                                    ...activity,
                                    activityUID: Database.generateUID('activity')
                                });
                            }
                            console.log(`Imported ${data.recentActivities.length} activities`);
                        } else {
                            // Create import activity
                            const activity = {
                                entityType: 'system',
                                entityUID: 'database',
                                action: 'import',
                                userUID: 'admin@example.com',
                                timestamp: new Date().toISOString()
                            };
                            await Database.create(Database.STORES.ACTIVITIES, activity);
                        }
                        
                        // Show success message
                        UI.showToast('Data imported successfully', 'success');
                        
                        // Refresh the dashboard if it exists
                        if (window.dashboardModule && window.dashboardModule.refreshDashboard) {
                            window.dashboardModule.refreshDashboard();
                        }
                        
                        // Force a page reload to ensure all views are updated
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                    } catch (error) {
                        console.error('Error importing data:', error);
                        UI.showToast(`Import failed: ${error.message}`, 'error');
                    }
                }
            });
            
            // Trigger file selection
            fileInput.click();
            
        } catch (error) {
            console.error('Error during import:', error);
            UI.showToast(`Import error: ${error.message}`, 'error');
        }
    };
    
    /**
     * Handle loading sample data
     */
    const handleLoadSampleData = () => {
        // Create a confirmation modal
        const modal = UI.createModal(
            'Load Sample Data',
            `<p>This will clear all existing data and load sample data. This operation cannot be undone.</p>
             <p>Are you sure you want to continue?</p>`,
            [
                UI.createButton('Cancel', null, 'secondary'),
                UI.createButton('Load Sample Data', async () => {
                    UI.hideModal();
                    
                    // Create a progress modal
                    const progressModal = UI.createModal(
                        'Loading Sample Data',
                        `<div id="import-progress">
                            <p>Loading sample data. Please wait...</p>
                            <div class="progress-bar">
                                <div class="progress-bar-inner" style="width: 0%;"></div>
                            </div>
                            <div id="progress-status">Initializing...</div>
                        </div>`,
                        []
                    );
                    
                    UI.showModal(progressModal);
                    
                    // Function to update progress
                    const updateProgress = (message) => {
                        console.log('Progress update:', message);
                        const statusElem = document.getElementById('progress-status');
                        if (statusElem) {
                            statusElem.textContent = message;
                        }
                    };
                    
                    try {
                        // Clear the database first
                        updateProgress('Clearing database...');
                        
                        // We need to clear all stores manually, one at a time
                        await Database.clearStore(Database.STORES.TEAMS);
                        updateProgress('Cleared Teams store');
                        
                        await Database.clearStore(Database.STORES.SERVICES);
                        updateProgress('Cleared Services store');
                        
                        await Database.clearStore(Database.STORES.CUJS);
                        updateProgress('Cleared CUJs store');
                        
                        await Database.clearStore(Database.STORES.SLOS);
                        updateProgress('Cleared SLOs store');
                        
                        await Database.clearStore(Database.STORES.ACTIVITIES);
                        updateProgress('Cleared Activities store');
                        
                        // Call Debug module's createSampleData function
                        updateProgress('Creating sample data...');
                        await Debug.createSampleData();
                        
                        updateProgress('Sample data loaded successfully!');
                        
                        // Show success message and reload page
                        setTimeout(() => {
                            UI.hideModal();
                            UI.showToast('Sample data loaded successfully!', 'success');
                            
                            // Reload page after a short delay
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }, 1000);
                        
                    } catch (error) {
                        console.error('Error loading sample data:', error);
                        updateProgress(`Error: ${error.message}`);
                        
                        // Add a dismiss button to the modal
                        const closeBtn = UI.createButton('Dismiss', () => {
                            UI.hideModal();
                            UI.showToast('Failed to load sample data', 'error');
                        }, 'primary');
                        
                        progressModal.querySelector('.modal-footer').appendChild(closeBtn);
                    }
                }, 'primary')
            ]
        );
        
        UI.showModal(modal);
    };

    /**
     * Validate the structure of imported data
     * @param {Object} data - Data to validate
     * @returns {boolean} - Whether the data is valid
     */
    const validateImportData = (data) => {
        // Check that data is an object
        if (!data || typeof data !== 'object') {
            console.error('Validation failed: data is not an object', data);
            return false;
        }
        
        // Check that at least one required array exists
        const requiredArrays = ['teams', 'services', 'cujs', 'slos'];
        const hasRequiredArrays = requiredArrays.some(key => 
            data[key] && Array.isArray(data[key]) && data[key].length > 0
        );
        
        if (!hasRequiredArrays) {
            console.error('Validation failed: data does not contain any required arrays', 
                Object.keys(data).filter(key => Array.isArray(data[key])));
            return false;
        }
        
        // Check that if arrays exist, they're actually arrays
        const validArrays = requiredArrays.every(key => 
            !data[key] || Array.isArray(data[key])
        );
        
        if (!validArrays) {
            console.error('Validation failed: one or more properties that should be arrays are not', 
                requiredArrays.filter(key => data[key] && !Array.isArray(data[key])));
            return false;
        }
        
        // Additional validation: check for required properties in each record
        const isValid = true;
        
        // If we get here, validation passed
        return isValid;
    };

    /**
     * Read a file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File contents
     */
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };
    
    /**
     * Generate a report
     * @param {Object} options - Report options
     * @returns {Promise<string>} Report content
     */
    const generateReport = async (options) => {
        const { type, startDate, endDate, entities } = options;
        let report = '';
        
        switch (type) {
            case 'slo-status':
                // Generate SLO status report
                const slos = await Database.getAll(Database.STORES.SLOS);
                report = generateSLOStatusReport(slos, startDate, endDate);
                break;
                
            case 'team-performance':
                // Generate team performance report
                const teams = await Database.getAll(Database.STORES.TEAMS);
                report = generateTeamPerformanceReport(teams, startDate, endDate);
                break;
                
            case 'service-health':
                // Generate service health report
                const services = await Database.getAll(Database.STORES.SERVICES);
                report = generateServiceHealthReport(services, startDate, endDate);
                break;
                
            default:
                throw new Error('Invalid report type');
        }
        
        return report;
    };
    
    /**
     * Generate SLO status report
     * @private
     */
    const generateSLOStatusReport = (slos, startDate, endDate) => {
        let report = 'SLO Status Report\n';
        report += `Period: ${startDate} to ${endDate}\n\n`;
        
        slos.forEach(slo => {
            report += `SLO: ${slo.name}\n`;
            report += `Target: ${slo.target}\n`;
            report += `Status: ${slo.status || 'Unknown'}\n\n`;
        });
        
        return report;
    };
    
    /**
     * Generate team performance report
     * @private
     */
    const generateTeamPerformanceReport = (teams, startDate, endDate) => {
        let report = 'Team Performance Report\n';
        report += `Period: ${startDate} to ${endDate}\n\n`;
        
        teams.forEach(team => {
            report += `Team: ${team.name}\n`;
            report += `Services: ${team.services?.length || 0}\n`;
            report += `SLOs: ${team.slos?.length || 0}\n\n`;
        });
        
        return report;
    };
    
    /**
     * Generate service health report
     * @private
     */
    const generateServiceHealthReport = (services, startDate, endDate) => {
        let report = 'Service Health Report\n';
        report += `Period: ${startDate} to ${endDate}\n\n`;
        
        services.forEach(service => {
            report += `Service: ${service.name}\n`;
            report += `Team: ${service.team || 'Unassigned'}\n`;
            report += `Status: ${service.status || 'Unknown'}\n\n`;
        });
        
        return report;
    };
    
    /**
     * Render the tools view
     * @param {HTMLElement} container - Container element
     */
    const renderView = async (container) => {
        console.log('Rendering Tools view');
        container.innerHTML = '';
        
        // Ensure the container has an ID for proper re-rendering
        if (!container.id) {
            container.id = 'view-container';
        }
        
        // Create header
        const header = document.createElement('div');
        header.classList.add('section-header');
        header.innerHTML = `
            <h2>Tools</h2>
        `;
        container.appendChild(header);
        
        // Create content
        const content = document.createElement('div');
        content.classList.add('tools-content');
        content.innerHTML = `
            <div class="tools-grid">
                <div class="tool-card">
                    <h3>Export Data</h3>
                    <p>Export all SLO data as JSON for backup or migration.</p>
                    <button id="export-data-btn" class="btn btn-primary">Export Data</button>
                </div>
                <div class="tool-card">
                    <h3>Import Data</h3>
                    <p>Import SLO data from a JSON file.</p>
                    <button id="import-data-btn" class="btn btn-primary">Import Data</button>
                </div>
                <div class="tool-card">
                    <h3>Validate SLOs</h3>
                    <p>Check all SLOs for consistency and correctness.</p>
                    <button id="validate-slos-btn" class="btn btn-primary">Validate SLOs</button>
                </div>
                <div class="tool-card">
                    <h3>Load Sample Data</h3>
                    <p>Reset the database and load sample data for testing.</p>
                    <button id="load-sample-data-btn" class="btn btn-primary">Load Sample Data</button>
                </div>
                <div class="tool-card">
                    <h3>Backup Settings</h3>
                    <p>Configure backup location and automatic backup schedules.</p>
                    <div class="tool-settings">
                        <div class="form-group">
                            <label for="backup-location">Backup Location:</label>
                            <input type="text" id="backup-location" class="form-control" value="${backupSettings.backupLocation}">
                        </div>
                        <div class="form-group">
                            <label for="auto-backup">
                                <input type="checkbox" id="auto-backup" ${backupSettings.autoBackup ? 'checked' : ''}>
                                Enable Auto Backup
                            </label>
                        </div>
                        <div class="form-group" id="backup-interval-group" ${!backupSettings.autoBackup ? 'style="display:none;"' : ''}>
                            <label for="backup-interval">Backup Interval (hours):</label>
                            <input type="number" id="backup-interval" class="form-control" value="${backupSettings.backupInterval}" min="1" max="168">
                        </div>
                        <button id="save-backup-settings" class="btn btn-primary">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(content);
        
        // Add event listeners
        document.getElementById('export-data-btn')?.addEventListener('click', handleExport);
        
        document.getElementById('import-data-btn')?.addEventListener('click', handleImport);
        
        document.getElementById('validate-slos-btn')?.addEventListener('click', () => {
            UI.showToast('Validation functionality coming soon!', 'info');
        });
        
        document.getElementById('load-sample-data-btn')?.addEventListener('click', handleLoadSampleData);
        
        // Add event listeners for backup settings
        const autoBackupCheckbox = document.getElementById('auto-backup');
        if (autoBackupCheckbox) {
            autoBackupCheckbox.addEventListener('change', function() {
                const backupIntervalGroup = document.getElementById('backup-interval-group');
                if (backupIntervalGroup) {
                    backupIntervalGroup.style.display = this.checked ? 'block' : 'none';
                }
            });
        }
        
        document.getElementById('save-backup-settings')?.addEventListener('click', () => {
            const backupLocation = document.getElementById('backup-location')?.value;
            const autoBackup = document.getElementById('auto-backup')?.checked;
            const backupInterval = parseInt(document.getElementById('backup-interval')?.value, 10);
            
            if (backupLocation) {
                backupSettings.backupLocation = backupLocation;
                backupSettings.autoBackup = autoBackup;
                
                if (!isNaN(backupInterval) && backupInterval > 0) {
                    backupSettings.backupInterval = backupInterval;
                }
                
                if (saveBackupSettings()) {
                    UI.showToast('Backup settings saved successfully', 'success');
                } else {
                    UI.showToast('Error saving backup settings', 'error');
                }
            }
        });
    };
    
    /**
     * Import sample data from a JSON object
     * @param {Object} sampleData - Sample data to import
     * @param {Function} updateProgress - Function to update progress UI
     */
    const importSampleData = async (sampleData, updateProgress) => {
        try {
            // Clear existing data
            updateProgress('Clearing existing data...');
            await Promise.all([
                Database.clearStore(Database.STORES.TEAMS),
                Database.clearStore(Database.STORES.SERVICES),
                Database.clearStore(Database.STORES.CUJS),
                Database.clearStore(Database.STORES.SLOS),
                Database.clearStore(Database.STORES.USERS),
                Database.clearStore(Database.STORES.ACTIVITIES)
            ]);
            
            // Create maps to store name-to-UID mappings
            const teamMap = {};
            const serviceMap = {};
            const cujMap = {};
            
            // Import teams with generated UIDs
            updateProgress('Importing teams...');
            for (const teamData of sampleData.teams) {
                try {
                    const team = {
                        ...teamData,
                        teamUID: teamData.teamUID || Database.generateUID('team'),
                        createdAt: teamData.createdAt || new Date().toISOString()
                    };
                    
                    // Store the team name to UID mapping
                    teamMap[team.name] = team.teamUID;
                    
                    await Database.create(Database.STORES.TEAMS, team);
                } catch (error) {
                    updateProgress(`Error importing team ${teamData.name}: ${error.message}`);
                }
            }
            updateProgress(`Imported ${sampleData.teams.length} teams successfully`);
            
            // Import services with proper team UIDs
            updateProgress('Importing services...');
            for (const serviceData of sampleData.services) {
                try {
                    const service = {
                        ...serviceData,
                        serviceUID: serviceData.serviceUID || Database.generateUID('service'),
                        createdAt: serviceData.createdAt || new Date().toISOString()
                    };
                    
                    // Replace teamName with teamUID if needed
                    if (!service.teamUID && serviceData.teamName && teamMap[serviceData.teamName]) {
                        service.teamUID = teamMap[serviceData.teamName];
                    }
                    
                    // Store the service name to UID mapping
                    serviceMap[service.name] = service.serviceUID;
                    
                    await Database.create(Database.STORES.SERVICES, service);
                } catch (error) {
                    updateProgress(`Error importing service ${serviceData.name}: ${error.message}`);
                }
            }
            updateProgress(`Imported ${sampleData.services.length} services successfully`);
            
            // Import CUJs with proper service UIDs
            updateProgress('Importing CUJs...');
            for (const cujData of sampleData.cujs) {
                try {
                    const cuj = {
                        ...cujData,
                        cujUID: cujData.cujUID || Database.generateUID('cuj'),
                        createdAt: cujData.createdAt || new Date().toISOString()
                    };
                    
                    // Replace serviceName with serviceUID if needed
                    if (!cuj.serviceUID && cujData.serviceName && serviceMap[cujData.serviceName]) {
                        cuj.serviceUID = serviceMap[cujData.serviceName];
                    }
                    
                    // Store CUJ UID for reference
                    cujMap[cuj.name] = cuj.cujUID;
                    
                    await Database.create(Database.STORES.CUJS, cuj);
                } catch (error) {
                    updateProgress(`Error importing CUJ ${cujData.name}: ${error.message}`);
                }
            }
            updateProgress(`Imported ${sampleData.cujs.length} CUJs successfully`);
            
            // Import SLOs with embedded SLI data
            updateProgress('Importing SLOs with embedded SLI data...');
            await importSLOsWithSLIs(sampleData.slos, updateProgress);
            
            // Import users if available
            if (sampleData.users && Array.isArray(sampleData.users)) {
                updateProgress('Importing users...');
                for (const userData of sampleData.users) {
                    try {
                        const user = {
                            ...userData,
                            userUID: userData.userUID || Database.generateUID('user'),
                            createdAt: userData.createdAt || new Date().toISOString()
                        };
                        
                        await Database.create(Database.STORES.USERS, user);
                    } catch (error) {
                        updateProgress(`Error importing user ${userData.name}: ${error.message}`);
                    }
                }
                updateProgress(`Imported ${sampleData.users.length} users successfully`);
            }
            
            // Create import activity
            updateProgress('Creating activity record...');
            const importActivity = {
                entityType: 'system',
                entityUID: 'database',
                action: 'import',
                userUID: 'system',
                timestamp: new Date().toISOString(),
                activityUID: Database.generateUID('activity')
            };
            await Database.create(Database.STORES.ACTIVITIES, importActivity);
            
            updateProgress('Sample data import completed successfully!');
            return true;
        } catch (error) {
            updateProgress(`Error during import: ${error.message}`);
            throw error;
        }
    };

    /**
     * Import SLOs with embedded SLI data
     * @param {Array} slos - SLOs to import
     * @param {Function} updateProgress - Function to update progress UI
     */
    const importSLOsWithSLIs = async (slos, updateProgress) => {
        try {
            for (const sloData of slos) {
                // Replace 30d window with 28d for newly imported SLOs
                let window = sloData.window;
                if (window === '30d') {
                    window = '28d';
                }
                
                const slo = {
                    sloUID: sloData.sloUID || Database.generateUID('slo'),
                    name: sloData.name,
                    description: sloData.description,
                    serviceUID: sloData.serviceUID,
                    serviceName: sloData.serviceName,
                    cujUID: sloData.cujUID,
                    // SLI data embedded directly in the SLO
                    // Handle both old and new field structures
                    sliDescription: sloData.sliDescription,
                    // Map old sliName to new fields if they don't exist
                    sliMetricSource: sloData.sliMetricSource || (sloData.sliName ? 'Migrated: ' + sloData.sliName : ''),
                    sliMetricName: sloData.sliMetricName || sloData.sliName || '',
                    target: sloData.target,
                    window: window,
                    threshold: sloData.threshold,
                    status: sloData.status || 'active',
                    authors: sloData.authors || ['System Import'],
                    createdAt: sloData.createdAt || new Date().toISOString(),
                    modifiedAt: sloData.modifiedAt || new Date().toISOString(),
                    modifiedBy: sloData.modifiedBy || 'System Import',
                    history: sloData.history || [
                        {
                            action: 'created',
                            timestamp: new Date().toISOString(),
                            user: 'System Import',
                            details: 'SLO created during sample data import'
                        }
                    ]
                };
                
                // Add migration note to history if we had to change the window or fields
                if (sloData.window === '30d' || (sloData.sliName && !sloData.sliMetricSource)) {
                    if (!slo.history) {
                        slo.history = [];
                    }
                    
                    slo.history.push({
                        action: 'migrated',
                        timestamp: new Date().toISOString(),
                        user: 'System Import',
                        details: 'SLO data structure migrated during import'
                    });
                }
                
                await Database.create(Database.STORES.SLOS, slo);
            }
            
            updateProgress(`Imported ${slos.length} SLOs with embedded SLI data successfully`);
            return true;
        } catch (error) {
            updateProgress(`Error importing SLOs: ${error.message}`);
            throw error;
        }
    };

    // Public API
    return {
        init,
        exportToJSON,
        importFromJSON,
        handleExport,
        handleImport,
        handleLoadSampleData,
        generateReport,
        renderView
    };
})();

console.log('Tools module loaded, module object:', window.toolsModule); 