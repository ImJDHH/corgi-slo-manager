/**
 * Settings Feature Module for Corgi SLO Manager
 */

console.log('Settings module loading...');

// Make sure to expose settingsModule in the global scope
window.settingsModule = (function() {
    /**
     * Initialize the settings module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Settings module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing settings module:', error);
            return false;
        }
    };
    
    /**
     * User settings object (example)
     */
    const userSettings = {
        displayName: 'User',
        email: '',
        theme: 'light',
        notifications: true,
        dashboardLayout: 'default',
        timezone: 'UTC'
    };
    
    /**
     * Render the settings view
     * @param {HTMLElement} container - Container element
     */
    const renderView = async (container) => {
        console.log('Rendering Settings view');
        container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.classList.add('section-header');
        header.innerHTML = `
            <h2>Settings</h2>
        `;
        container.appendChild(header);
        
        // Create content
        const content = document.createElement('div');
        content.classList.add('settings-content');
        content.innerHTML = `
            <div class="tool-card">
                <h3>User Preferences</h3>
                <p>Customize your experience.</p>
                <div class="form-group">
                    <label for="theme-selector" class="form-label">Theme</label>
                    <select id="theme-selector" class="form-control">
                        <option value="light" ${userSettings.theme === 'light' ? 'selected' : ''}>Light</option>
                        <option value="dark" ${userSettings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                        <option value="system" ${userSettings.theme === 'system' ? 'selected' : ''}>System Default</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="timezone-selector" class="form-label">Timezone</label>
                    <select id="timezone-selector" class="form-control">
                        <option value="UTC" ${userSettings.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                        <option value="local" ${userSettings.timezone === 'local' ? 'selected' : ''}>Local</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-checkbox">
                        <input type="checkbox" id="notifications-toggle" ${userSettings.notifications ? 'checked' : ''}>
                        Enable Notifications
                    </label>
                </div>
                <button id="save-settings-btn" class="btn btn-primary">Save Settings</button>
            </div>
            
            <div class="tool-card">
                <h3>Account Settings</h3>
                <p>Manage your account information.</p>
                <div class="form-group">
                    <label for="display-name" class="form-label">Display Name</label>
                    <input type="text" id="display-name" class="form-control" value="${userSettings.displayName}">
                </div>
                <div class="form-group">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" id="email" class="form-control" value="${userSettings.email}">
                </div>
                <button id="update-account-btn" class="btn btn-primary">Update Account</button>
            </div>
        `;
        container.appendChild(content);
        
        // Add event listeners
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            // Get settings from form
            const theme = document.getElementById('theme-selector')?.value || 'light';
            const timezone = document.getElementById('timezone-selector')?.value || 'UTC';
            const notifications = document.getElementById('notifications-toggle')?.checked || false;
            
            // Update settings
            userSettings.theme = theme;
            userSettings.timezone = timezone;
            userSettings.notifications = notifications;
            
            // Save settings (placeholder)
            UI.showToast('Settings saved successfully!', 'success');
        });
        
        document.getElementById('update-account-btn')?.addEventListener('click', () => {
            // Get account info from form
            const displayName = document.getElementById('display-name')?.value || 'User';
            const email = document.getElementById('email')?.value || '';
            
            // Update settings
            userSettings.displayName = displayName;
            userSettings.email = email;
            
            // Save settings (placeholder)
            UI.showToast('Account information updated!', 'success');
        });
    };
    
    // Public API
    return {
        init,
        renderView,
        getUserSettings: () => ({ ...userSettings })
    };
})();

console.log('Settings module loaded, module object:', window.settingsModule);