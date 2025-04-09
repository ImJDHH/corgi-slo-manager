/**
 * Debug Feature Module for Corgi SLO Manager
 * Simple implementation with database tools for diagnostic purposes
 */

window.debugModule = (function() {
    /**
     * Initialize the debug module
     * @param {HTMLElement} container - The container element
     */
    const init = (container) => {
        console.log('Debug module initialized with container:', container);
        
        if (!container) {
            console.error('Container element is null');
            return false;
        }
        
        renderView(container);
        return true;
    };
    
    /**
     * Render the debug view
     * @param {HTMLElement} container - The container element
     */
    const renderView = (container) => {
        container.innerHTML = `
            <h2>Debug Tools</h2>
            <div class="debug-section">
                <h3>Database</h3>
                <div class="button-group">
                    <button id="clear-reload-db-btn" class="btn btn-danger">Clear and Reload Database</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('clear-reload-db-btn').addEventListener('click', clearAndReloadDatabase);
    };
    
    /**
     * Clear the database and reload sample data
     */
    const clearAndReloadDatabase = async () => {
        if (!window.confirm('Are you sure you want to clear the database and reload sample data? This will delete all current data.')) {
            return;
        }
        
        try {
            // Clear all stores
            const stores = Object.values(Database.STORES);
            for (const store of stores) {
                await Database.clearStore(store);
            }
            
            // Load sample data
            await State.handleLoadSampleData();
            
            UI.showToast('Database cleared and sample data loaded successfully', 'success');
            
            // Reload the page
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error clearing database and loading sample data:', error);
            UI.showToast('Error clearing database and loading sample data', 'error');
        }
    };
    
    // Public API
    return {
        init
    };
})(); 