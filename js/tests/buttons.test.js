/**
 * Button Tests for Corgi SLO Manager
 * Tests the functionality of Create buttons across different modules
 */

// Simple test framework for buttons
window.ButtonTestRunner = {
    tests: [],
    passed: 0,
    failed: 0,
    
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    async runTests() {
        console.log('🧪 Running Button tests...');
        this.passed = 0;
        this.failed = 0;
        
        // Add a UI test container that we can reference in our tests
        const testContainer = document.createElement('div');
        testContainer.id = 'ui-test-container';
        document.body.appendChild(testContainer);
        
        // Override UI.showModal for all tests to ensure modals work properly
        const originalShowModal = UI.showModal;
        UI.showModal = function(modal) {
            console.log('Test UI.showModal called with modal:', modal);
            document.body.appendChild(modal);
            modal.classList.add('visible');
            modal.style.display = 'block';
        };
        
        for (const test of this.tests) {
            try {
                console.log(`Running test: ${test.name}`);
                await test.testFn();
                console.log(`✅ Passed: ${test.name}`);
                this.passed++;
            } catch (error) {
                console.error(`❌ Failed: ${test.name}`);
                console.error(error);
                this.failed++;
            }
        }
        
        console.log(`📊 Test results: ${this.passed} passed, ${this.failed} failed`);
        
        // Restore original showModal
        UI.showModal = originalShowModal;
        
        // Clean up test container
        if (testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
        
        return {
            passed: this.passed,
            failed: this.failed,
            total: this.tests.length
        };
    },
    
    // Helper to create a temporary test container
    createTestContainer() {
        const container = document.createElement('div');
        container.id = 'button-test-container';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        return container;
    },
    
    // Helper to remove the test container
    removeTestContainer() {
        const container = document.getElementById('button-test-container');
        if (container) {
            document.body.removeChild(container);
        }
    }
};

// Test CUJ Create Button
ButtonTestRunner.addTest('CUJ Create Button - shows modal when clicked', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Mock UI.showModal
    const originalShowModal = UI.showModal;
    let modalShown = false;
    let modalTitle = '';
    let modalElement = null;
    
    UI.showModal = (modal) => {
        console.log('Mock showModal called with', modal);
        modalShown = true;
        modalElement = modal;
        
        // Extract title from modal
        const titleElement = modal.querySelector('.modal-title');
        if (titleElement) {
            modalTitle = titleElement.textContent.trim();
        } else {
            const headerText = modal.querySelector('.modal-header')?.textContent.trim() || '';
            // Extract title without the close button character
            modalTitle = headerText.replace('×', '').trim();
        }
        
        // Add modal to container to simulate showing it
        container.appendChild(modal);
        modal.style.display = 'block';
    };
    
    try {
        // Initialize CUJ module
        await window.cujsModule.init(container, {});
        
        // Find the Create CUJ button
        const createButton = container.querySelector('#create-cuj-btn');
        if (!createButton) {
            throw new Error('Create CUJ button not found');
        }
        
        // Verify button text
        if (createButton.textContent.trim() !== 'Create CUJ') {
            throw new Error(`Unexpected button text: ${createButton.textContent.trim()}`);
        }
        
        // Click the button
        createButton.click();
        
        // Short delay to allow async code to run
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify modal was shown
        if (!modalShown) {
            throw new Error('Create CUJ modal was not shown');
        }
        
        // Verify modal title
        if (!modalTitle.includes('Create Critical User Journey')) {
            throw new Error(`Unexpected modal title: "${modalTitle}"`);
        }
    } finally {
        // Restore original function
        UI.showModal = originalShowModal;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        ButtonTestRunner.removeTestContainer();
    }
});

// Test SLI Create Button
ButtonTestRunner.addTest('SLI Create Button - shows modal when clicked', async () => {
    // Test skipped - SLIs have been merged into SLOs and slisModule no longer exists
    console.log('SLI Create Button test skipped - SLIs now integrated into SLOs');
    return true; // Return success
});

// Test SLO Create Button
ButtonTestRunner.addTest('SLO Create Button - shows modal when clicked', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Mock UI.showModal
    const originalShowModal = UI.showModal;
    let modalShown = false;
    let modalTitle = '';
    let modalElement = null;
    
    UI.showModal = (modal) => {
        console.log('Mock showModal called with', modal);
        modalShown = true;
        modalElement = modal;
        
        // Extract title from modal
        const titleElement = modal.querySelector('.modal-title');
        if (titleElement) {
            modalTitle = titleElement.textContent.trim();
        } else {
            const headerText = modal.querySelector('.modal-header')?.textContent.trim() || '';
            // Extract title without the close button character
            modalTitle = headerText.replace('×', '').trim();
        }
        
        // Add modal to container to simulate showing it
        container.appendChild(modal);
        modal.style.display = 'block';
    };
    
    try {
        // Initialize SLO module
        await window.slosModule.init(container, {});
        
        // Find the Create SLO button
        const createButton = container.querySelector('#create-slo-btn');
        if (!createButton) {
            throw new Error('Create SLO button not found');
        }
        
        // Verify button text
        if (createButton.textContent.trim() !== 'Create SLO') {
            throw new Error(`Unexpected button text: ${createButton.textContent.trim()}`);
        }
        
        // Click the button
        createButton.click();
        
        // Short delay to allow async code to run
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify modal was shown
        if (!modalShown) {
            throw new Error('Create SLO modal was not shown');
        }
        
        // Verify modal title
        if (!modalTitle.includes('Create Service Level Objective')) {
            throw new Error(`Unexpected modal title: "${modalTitle}"`);
        }
    } finally {
        // Restore original function
        UI.showModal = originalShowModal;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        ButtonTestRunner.removeTestContainer();
    }
});

// Test Service Create Button
ButtonTestRunner.addTest('Service Create Button - shows modal when clicked', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Mock UI.showModal
    const originalShowModal = UI.showModal;
    let modalShown = false;
    let modalTitle = '';
    let modalElement = null;
    
    UI.showModal = (modal) => {
        console.log('Mock showModal called with', modal);
        modalShown = true;
        modalElement = modal;
        
        // Extract title from modal
        const titleElement = modal.querySelector('.modal-title');
        if (titleElement) {
            modalTitle = titleElement.textContent.trim();
        } else {
            const headerText = modal.querySelector('.modal-header')?.textContent.trim() || '';
            // Extract title without the close button character
            modalTitle = headerText.replace('×', '').trim();
        }
        
        // Add modal to container to simulate showing it
        container.appendChild(modal);
        modal.style.display = 'block';
    };
    
    try {
        // Initialize Services module
        await window.servicesModule.init(container, {});
        
        // Find the Create Service button
        const createButton = container.querySelector('#create-service-btn');
        if (!createButton) {
            throw new Error('Create Service button not found');
        }
        
        // Verify button text
        if (createButton.textContent.trim() !== 'Create Service') {
            throw new Error(`Unexpected button text: ${createButton.textContent.trim()}`);
        }
        
        // Click the button
        createButton.click();
        
        // Short delay to allow async code to run
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify modal was shown
        if (!modalShown) {
            throw new Error('Create Service modal was not shown');
        }
        
        // Verify modal title
        if (!modalTitle.includes('Create Service')) {
            throw new Error(`Unexpected modal title: "${modalTitle}"`);
        }
    } finally {
        // Restore original function
        UI.showModal = originalShowModal;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        ButtonTestRunner.removeTestContainer();
    }
});

// Test Team Create Button
ButtonTestRunner.addTest('Team Create Button - shows modal when clicked', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Mock UI.showModal
    const originalShowModal = UI.showModal;
    let modalShown = false;
    let modalTitle = '';
    let modalElement = null;
    
    UI.showModal = (modal) => {
        console.log('Mock showModal called with', modal);
        modalShown = true;
        modalElement = modal;
        
        // Extract title from modal
        const titleElement = modal.querySelector('.modal-title');
        if (titleElement) {
            modalTitle = titleElement.textContent.trim();
        } else {
            const headerText = modal.querySelector('.modal-header')?.textContent.trim() || '';
            // Extract title without the close button character
            modalTitle = headerText.replace('×', '').trim();
        }
        
        // Add modal to container to simulate showing it
        container.appendChild(modal);
        modal.style.display = 'block';
    };
    
    try {
        // Initialize Teams module
        await window.teamsModule.init(container, {});
        
        // Find the Create Team button
        const createButton = container.querySelector('#create-team-btn');
        if (!createButton) {
            throw new Error('Create Team button not found');
        }
        
        // Verify button text
        if (createButton.textContent.trim() !== 'Create Team') {
            throw new Error(`Unexpected button text: ${createButton.textContent.trim()}`);
        }
        
        // Click the button
        createButton.click();
        
        // Short delay to allow async code to run
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify modal was shown
        if (!modalShown) {
            throw new Error('Create Team modal was not shown');
        }
        
        // Verify modal title
        if (!modalTitle.includes('Create Team')) {
            throw new Error(`Unexpected modal title: "${modalTitle}"`);
        }
    } finally {
        // Restore original function
        UI.showModal = originalShowModal;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        ButtonTestRunner.removeTestContainer();
    }
});

// Test form validation in modal
ButtonTestRunner.addTest('Modal form validation works correctly', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Mock UI.showModal
    const originalShowModal = UI.showModal;
    let modalElement = null;
    
    UI.showModal = (modal) => {
        console.log('Mock showModal called with', modal);
        // Add modal to container to simulate showing it
        container.appendChild(modal);
        // Make it visible
        modal.style.display = 'block';
        modalElement = modal;
    };
    
    // Mock form validity reporting
    let formValidityCalled = false;
    const originalReportValidity = HTMLFormElement.prototype.reportValidity;
    HTMLFormElement.prototype.reportValidity = function() {
        formValidityCalled = true;
        return false; // Simulate invalid form
    };
    
    // Mock Database operations
    const originalCreateTeam = window.teamsModule.createTeam;
    let createTeamCalled = false;
    window.teamsModule.createTeam = async () => {
        createTeamCalled = true;
        return 'test-team-123';
    };
    
    // Mock UI.showToast
    let toastShown = false;
    const originalShowToast = UI.showToast;
    UI.showToast = () => {
        toastShown = true;
    };
    
    try {
        // Initialize module and show modal
        await window.teamsModule.init(container, {});
        const createButton = container.querySelector('#create-team-btn');
        if (!createButton) {
            throw new Error('Create Team button not found');
        }
        
        // Click the button to show the modal
        createButton.click();
        
        // Short delay to allow modal to be created
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Find the form in the modal
        const form = container.querySelector('#create-team-form');
        if (!form) {
            throw new Error('Team creation form not found');
        }
        
        // Find the Save button in the modal
        const saveButton = container.querySelector('.modal-footer .btn-primary');
        if (!saveButton) {
            throw new Error('Save button not found in modal');
        }
        
        // Click the save button (should trigger validation)
        saveButton.click();
        
        // Verify form validation was called
        if (!formValidityCalled) {
            throw new Error('Form validation was not triggered');
        }
        
        // Verify createTeam was not called (since form is invalid)
        if (createTeamCalled) {
            throw new Error('createTeam was called despite invalid form');
        }
    } finally {
        // Restore original functions
        HTMLFormElement.prototype.reportValidity = originalReportValidity;
        window.teamsModule.createTeam = originalCreateTeam;
        UI.showToast = originalShowToast;
        UI.showModal = originalShowModal;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        ButtonTestRunner.removeTestContainer();
    }
});

// Test successful form submission
ButtonTestRunner.addTest('Form submission creates new entity when form is valid', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Create vars to store original methods for proper restoration later
    const originalCreateSLO = window.slosModule.createSLO;
    const originalShowModal = UI.showModal;
    const originalShowToast = UI.showToast;
    const originalCheckValidity = HTMLFormElement.prototype.checkValidity;
    const originalFormData = window.FormData;
    
    let createSLOCalled = false;
    let successToastShown = false;
    let createdSLOData = null;
    let modalElement = null;
    
    // Mock SLO methods
    window.slosModule.createSLO = async (data) => {
        console.log('Calling createSLO with data:', data);
        createSLOCalled = true;
        createdSLOData = data;
        return 'test-slo-123';
    };
    
    // Mock UI methods
    UI.showModal = (modal) => {
        console.log('Mock showModal called with modal');
        document.body.appendChild(modal);
        modal.style.display = 'block';
        modalElement = modal;
    };
    
    UI.showToast = (message, type) => {
        console.log('Mock showToast called with', message, type);
        if (message.includes('created successfully') && type === 'success') {
            successToastShown = true;
        }
    };
    
    try {
        console.log('SLOs module init called', container);
        await window.slosModule.init(container, {});
        
        console.log('Rendering SLOs view');
        // Direct test of create SLO form submission
        console.log('Calling showCreateSLOModal directly');
        const modal = await window.slosModule.showCreateSLOModal();
        console.log('Creating SLO modal');
        
        // Override form validity and FormData
        HTMLFormElement.prototype.checkValidity = function() {
            console.log('Mock checkValidity called');
            return true; // Form is always valid for this test
        };
        
        window.FormData = function(formElement) {
            console.log('Mock FormData constructor called');
            this.get = function(field) {
                const values = {
                    'name': 'Test SLO',
                    'description': 'Test description',
                    'serviceUID': 'service-123',
                    'sliUID': 'sli-123',
                    'target': '99.9',
                    'window': 'month'
                };
                console.log(`FormData.get('${field}') returning:`, values[field] || '');
                return values[field] || '';
            };
            return this;
        };
        
        // Find the Save button in the modal
        console.log('Finding save button');
        const saveButton = modalElement.querySelector('.modal-footer button.btn-primary');
        if (!saveButton) {
            throw new Error('Save button not found in modal');
        }
        
        console.log('Clicking save button');
        // Click the save button to submit the form
        saveButton.click();
        
        // Add a longer delay to allow async code to run
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify create function was called with correct data
        if (!createSLOCalled) {
            throw new Error('createSLO was not called');
        }
        
        console.log('Create SLO was called with data:', createdSLOData);
        
        // Verify data was correctly passed
        if (createdSLOData.name !== 'Test SLO') {
            throw new Error(`Incorrect SLO name: ${createdSLOData.name}`);
        }
        
        if (createdSLOData.serviceUID !== 'service-123') {
            throw new Error(`Incorrect serviceUID: ${createdSLOData.serviceUID}`);
        }
        
        if (parseFloat(createdSLOData.target) !== 99.9) {
            throw new Error(`Incorrect target value: ${createdSLOData.target}`);
        }
        
        // Verify success toast was shown
        if (!successToastShown) {
            throw new Error('Success toast was not shown');
        }
    } finally {
        // Restore original functions
        window.slosModule.createSLO = originalCreateSLO;
        UI.showModal = originalShowModal;
        UI.showToast = originalShowToast;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        // Restore original form methods
        HTMLFormElement.prototype.checkValidity = originalCheckValidity;
        window.FormData = originalFormData;
        
        ButtonTestRunner.removeTestContainer();
    }
});

// Test modal cancel button
ButtonTestRunner.addTest('Modal cancel button closes modal without saving', async () => {
    const container = ButtonTestRunner.createTestContainer();
    
    // Mock UI functions
    const originalShowModal = UI.showModal;
    const originalHideModal = UI.hideModal;
    let modalClosed = false;
    let modalElement = null;
    
    UI.showModal = (modal) => {
        console.log('Mock showModal called with', modal);
        // Add modal to container to simulate showing it
        container.appendChild(modal);
        // Make it visible
        modal.style.display = 'block';
        modalElement = modal;
    };
    
    UI.hideModal = (modal) => {
        modalClosed = true;
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    };
    
    // Mock Database operations
    const originalCreateService = window.servicesModule.createService;
    let createServiceCalled = false;
    window.servicesModule.createService = async () => {
        createServiceCalled = true;
        return 'test-service-123';
    };
    
    try {
        // Initialize Service module and show create modal
        await window.servicesModule.init(container, {});
        const createButton = container.querySelector('#create-service-btn');
        if (!createButton) {
            throw new Error('Create Service button not found');
        }
        
        // Click the button to show the modal
        createButton.click();
        
        // Short delay to allow modal to be created
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Find the cancel button in the modal
        const cancelButton = container.querySelector('.modal-footer .btn-secondary');
        if (!cancelButton) {
            throw new Error('Cancel button not found in modal');
        }
        
        // Simulate clicking the cancel button
        cancelButton.click();
        
        // Short delay to allow click handler to execute
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Verify modal was removed from DOM or properly hidden
        if (modalElement.style.display !== 'none' && modalElement.parentNode) {
            throw new Error('Modal was not removed from DOM after cancel button click');
        }
        
        // Verify create function was not called
        if (createServiceCalled) {
            throw new Error('createService was called despite cancel button click');
        }
    } finally {
        // Restore original functions
        window.servicesModule.createService = originalCreateService;
        UI.showModal = originalShowModal;
        UI.hideModal = originalHideModal;
        
        // Clean up modal if it exists
        if (modalElement && modalElement.parentNode) {
            modalElement.parentNode.removeChild(modalElement);
        }
        
        ButtonTestRunner.removeTestContainer();
    }
});

console.log('Button tests loaded, ButtonTestRunner attached to window scope:', !!window.ButtonTestRunner); 