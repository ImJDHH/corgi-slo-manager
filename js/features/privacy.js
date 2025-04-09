/**
 * Privacy Feature Module for Corgi SLO Manager
 */

console.log('Privacy module loading...');

// Make sure to expose privacyModule in the global scope
window.privacyModule = (function() {
    /**
     * Initialize the privacy module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Privacy module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        renderView(container);
        return true;
    };
    
    /**
     * Render the privacy view
     * @param {HTMLElement} container - Container element
     */
    const renderView = (container) => {
        console.log('Rendering Privacy view');
        container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.classList.add('section-header');
        header.innerHTML = `<h2>Privacy Policy</h2>`;
        container.appendChild(header);
        
        // Create content
        const content = document.createElement('div');
        content.classList.add('content-section');
        content.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Privacy Policy for Corgi SLO Manager</h3>
                </div>
                <div class="card-body">
                    <p>Last updated: ${new Date().toLocaleDateString()}</p>
                    
                    <h4>1. Introduction</h4>
                    <p>This Privacy Policy explains how Corgi SLO Manager collects, uses, and protects information that you provide when using our application.</p>
                    
                    <h4>2. Data Collection</h4>
                    <p>We collect the following information:</p>
                    <ul>
                        <li>User authentication information for access control</li>
                        <li>Service Level Indicators (SLIs) and Objectives (SLOs) you create</li>
                        <li>Team and service information you add to the system</li>
                        <li>Usage metrics to improve the application</li>
                    </ul>
                    
                    <h4>3. Data Storage</h4>
                    <p>All data is stored locally in your browser's IndexedDB. No data is transmitted to external servers unless explicitly exported by the user.</p>
                    
                    <h4>4. Cookies</h4>
                    <p>This application uses browser storage mechanisms like localStorage and IndexedDB to maintain your session and store application data. No tracking cookies are used.</p>
                    
                    <h4>5. Data Sharing</h4>
                    <p>We do not share your data with any third parties. All data remains on your local device.</p>
                    
                    <h4>6. Your Rights</h4>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your data through the application interface</li>
                        <li>Export your data using the built-in export tools</li>
                        <li>Delete your data by clearing browser storage</li>
                    </ul>
                    
                    <h4>7. Changes to This Policy</h4>
                    <p>We may update this policy periodically. You should check this page occasionally to ensure you are happy with any changes.</p>
                    
                    <h4>8. Contact</h4>
                    <p>For questions about this privacy policy, please contact the development team through the help section.</p>
                </div>
            </div>
        `;
        container.appendChild(content);
    };
    
    // Public API
    return {
        init,
        renderView
    };
})();

console.log('Privacy module loaded, module object:', window.privacyModule);