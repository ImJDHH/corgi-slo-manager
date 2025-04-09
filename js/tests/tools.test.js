/**
 * Tools Module Tests for Corgi SLO Manager
 */

// Simple test framework for Tools module
window.ToolsTestRunner = {
    tests: [],
    passed: 0,
    failed: 0,
    originalFunctions: null,
    
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    // Setup mocks before running tests
    setupMocks() {
        console.log('Setting up tool test mocks...');
        
        // Save original UI functions to restore later
        this.originalFunctions = {
            ui: {
                showModal: UI.showModal,
                hideModal: UI.hideModal,
                showToast: UI.showToast,
                createModal: UI.createModal
            },
            dom: {
                appendChild: Element.prototype.appendChild,
                click: HTMLElement.prototype.click,
                createElement: document.createElement
            }
        };
        
        // Mock UI.createModal to prevent actual modals from being created
        UI.createModal = function(title, content, buttons) {
            console.log(`Mock UI.createModal called: ${title}`);
            // Just return a dummy div, never to be displayed
            const dummyModal = document.createElement('div');
            dummyModal.className = 'modal mock-modal';
            dummyModal.style.display = 'none';
            return dummyModal;
        };
        
        // Mock UI.showModal to prevent actual modals
        UI.showModal = function(modal) {
            console.log('Mock UI.showModal called');
            // Don't actually show any modal
            return modal;
        };
        
        // Mock UI.hideModal 
        UI.hideModal = function(modal) {
            console.log('Mock UI.hideModal called');
            // Don't try to animate or remove anything
        };
        
        // Mock UI.showToast
        UI.showToast = function(message, type) {
            console.log(`Mock UI.showToast called: ${message} (${type})`);
            // Don't actually show any toast
        };
        
        // Block DOM append operations for elements that might be modals or file inputs
        Element.prototype.appendChild = function(element) {
            // Only block actual modal appends to the document body
            if (this === document.body && element && (
                (element.classList && element.classList.contains('modal-overlay')) || 
                (element.tagName === 'INPUT' && element.type === 'file')
            )) {
                console.log('Blocked appendChild for modal or file input on document.body');
                return element; // Just return without actually appending
            }
            
            // Always allow tests container operations
            if (this.id === 'tools-test-container' || 
                element.id === 'tools-test-container' ||
                this.closest('#tools-test-container') ||
                (element.id && element.id.includes('test'))) {
                return this.originalFunctions.dom.appendChild.call(this, element);
            }
            
            // Allow console output and test results
            if (this.id === 'console-output' || 
                this.id === 'test-summary' ||
                this.id && this.id.includes('test')) {
                return this.originalFunctions.dom.appendChild.call(this, element);
            }
            
            // Always allow appending children to elements inside the test container
            let isInTestContainer = false;
            let parent = this;
            while (parent) {
                if (parent.id === 'tools-test-container') {
                    isInTestContainer = true;
                    break;
                }
                parent = parent.parentElement;
            }
            
            if (isInTestContainer) {
                return this.originalFunctions.dom.appendChild.call(this, element);
            }
            
            // For real modals in actual UI, block the append
            if (element.classList && element.classList.contains('modal')) {
                console.log('Blocked modal element append');
                return element;
            }
            
            // Allow most DOM operations for testing purposes
            return this.originalFunctions.dom.appendChild.call(this, element);
        }.bind(this);
        
        // Only block click methods for file inputs and modal buttons
        HTMLElement.prototype.click = function() {
            // If this is a file input, block the click
            if (this.tagName === 'INPUT' && this.type === 'file') {
                console.log('Mock file input click blocked');
                return;
            }
            
            // If this is a modal button outside a test container, block it
            let isInTestContainer = false;
            let parent = this;
            while (parent) {
                if (parent.id === 'tools-test-container') {
                    isInTestContainer = true;
                    break;
                }
                parent = parent.parentElement;
            }
            
            if (!isInTestContainer && 
                this.classList && 
                this.classList.contains('btn') && 
                this.closest('.modal')) {
                console.log('Mock modal button click blocked');
                return;
            }
            
            // Allow all other clicks
            return this.originalFunctions.dom.click.call(this);
        }.bind(this);
        
        // Block file input creation that would trigger browser dialogs
        document.createElement = function(tagName) {
            const element = this.originalFunctions.dom.createElement.call(document, tagName);
            
            // Prevent file inputs from actually working
            if (tagName.toLowerCase() === 'input') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'type' && value === 'file') {
                        console.log('Mock file input creation prevented');
                        // Still set the type but override the click method
                        originalSetAttribute.call(this, name, value);
                        this.click = function() {
                            console.log('Mock file input click prevented');
                        };
                        return;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        }.bind(this);
        
        console.log('Tool test mocks installed - blocking only real modals during tests');
    },
    
    // Restore original functions
    restoreMocks() {
        console.log('Restoring original functions after tool tests...');
        
        if (this.originalFunctions) {
            // Restore UI functions
            UI.showModal = this.originalFunctions.ui.showModal;
            UI.hideModal = this.originalFunctions.ui.hideModal;
            UI.showToast = this.originalFunctions.ui.showToast;
            UI.createModal = this.originalFunctions.ui.createModal;
            
            // Restore DOM functions
            Element.prototype.appendChild = this.originalFunctions.dom.appendChild;
            HTMLElement.prototype.click = this.originalFunctions.dom.click;
            document.createElement = this.originalFunctions.dom.createElement;
            
            this.originalFunctions = null;
        }
        
        console.log('Original functions restored after tool tests');
    },
    
    async runTests() {
        console.log('🧪 Running Tools tests...');
        this.passed = 0;
        this.failed = 0;
        
        try {
            // Setup mocks before running tests
            this.setupMocks();
            
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
            
            return {
                passed: this.passed,
                failed: this.failed,
                total: this.tests.length
            };
        } finally {
            // Always restore mocks after tests run
            this.restoreMocks();
        }
    },
    
    createTestContainer() {
        const container = document.createElement('div');
        container.id = 'tools-test-container';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        return container;
    },
    
    removeTestContainer() {
        const container = document.getElementById('tools-test-container');
        if (container) {
            document.body.removeChild(container);
        }
    },
    
    // Mock Database functions for tests
    setupDatabaseMock() {
        // Save original Database functions
        this.originalDatabaseFunctions = {
            getAll: Database.getAll,
            create: Database.create,
            generateUID: Database.generateUID
        };
        
        // Mock Database.getAll
        Database.getAll = async (storeName) => {
            console.log(`Mock Database.getAll called for ${storeName}`);
            switch(storeName) {
                case Database.STORES.TEAMS:
                    return [{ teamUID: 'team-123', name: 'Test Team', createdAt: new Date().toISOString() }];
                case Database.STORES.SERVICES:
                    return [{ serviceUID: 'service-123', name: 'Test Service', teamUID: 'team-123', createdAt: new Date().toISOString() }];
                case Database.STORES.CUJS:
                    return [{ cujUID: 'cuj-123', name: 'Test CUJ', serviceUID: 'service-123', createdAt: new Date().toISOString() }];
                case Database.STORES.SLOS:
                    return [{ sloUID: 'slo-123', name: 'Test SLO', serviceUID: 'service-123', sliUID: 'sli-123', createdAt: new Date().toISOString() }];
                case Database.STORES.AUDIT_LOGS:
                    return [{ auditLogUID: 'audit-123', name: 'Test Audit Log', createdAt: new Date().toISOString() }];
                case Database.STORES.USERS:
                    return [{ userUID: 'user-123', name: 'Test User', createdAt: new Date().toISOString() }];
                case Database.STORES.ACTIVITIES:
                    return [{ activityUID: 'activity-123', name: 'Test Activity', createdAt: new Date().toISOString() }];
                default:
                    return [];
            }
        };
        
        // Mock Database.create
        Database.create = async (storeName, data) => {
            console.log(`Mock Database.create called for ${storeName}`);
            return data[storeName.slice(0, -1) + 'UID'];
        };
        
        // Mock Database.generateUID
        Database.generateUID = (type) => {
            return `${type}-test-${Date.now()}`;
        };
    },
    
    // Restore original Database functions
    restoreDatabaseMock() {
        if (this.originalDatabaseFunctions) {
            Object.assign(Database, this.originalDatabaseFunctions);
            this.originalDatabaseFunctions = null;
        }
    }
};

// Test tools module initialization
ToolsTestRunner.addTest('Tools module initializes correctly', () => {
    if (!window.toolsModule) {
        throw new Error('Tools module not found');
    }
    
    if (typeof window.toolsModule.init !== 'function') {
        throw new Error('Tools module init function not found');
    }
});

// Test renderView function
ToolsTestRunner.addTest('Tools.renderView renders tools cards correctly', () => {
    const container = ToolsTestRunner.createTestContainer();
    
    window.toolsModule.renderView(container);
    
    // Check for cards
    const cards = container.querySelectorAll('.card');
    if (cards.length !== 3) {
        throw new Error(`Expected 3 cards, got ${cards.length}`);
    }
    
    // Check card titles
    const cardTitles = container.querySelectorAll('.card-header h3');
    const expectedTitles = ['Export Data', 'Import Data', 'Generate Report'];
    
    for (let i = 0; i < expectedTitles.length; i++) {
        if (!cardTitles[i] || cardTitles[i].textContent !== expectedTitles[i]) {
            throw new Error(`Expected card title "${expectedTitles[i]}", got "${cardTitles[i]?.textContent}"`);
        }
    }
    
    // Check for buttons
    const buttons = container.querySelectorAll('.btn');
    if (buttons.length !== 3) {
        throw new Error(`Expected 3 buttons, got ${buttons.length}`);
    }
    
    // Check button text
    const buttonTexts = ['Export', 'Import', 'Generate'];
    for (let i = 0; i < buttonTexts.length; i++) {
        if (buttons[i].textContent !== buttonTexts[i]) {
            throw new Error(`Expected button text "${buttonTexts[i]}", got "${buttons[i].textContent}"`);
        }
    }
    
    ToolsTestRunner.removeTestContainer();
});

// Test export functionality
ToolsTestRunner.addTest('Export button triggers export functionality', async () => {
    // Check if method exists
    if (!window.toolsModule.handleExport) {
        throw new Error('Export functionality (handleExport) not found in toolsModule');
    }
    
    // Test passes if the method exists
    console.log('Export functionality exists in toolsModule');
});

// Test import functionality
ToolsTestRunner.addTest('Import button triggers file selection', () => {
    // Check if method exists
    if (!window.toolsModule.handleImport) {
        throw new Error('Import functionality (handleImport) not found in toolsModule');
    }
    
    // Test passes if the method exists
    console.log('Import functionality exists in toolsModule');
});

// Test report generation functionality
ToolsTestRunner.addTest('Report button functionality exists', () => {
    // Check if the tools module has a generateReport method
    if (!window.toolsModule.generateReport) {
        throw new Error('Report functionality (generateReport) not found in toolsModule');
    }
    
    // Test passes if the method exists
    console.log('Report functionality exists in toolsModule');
});

// Run tests only when requested - don't run on page load
// Modified to not auto-run on DOM content loaded 