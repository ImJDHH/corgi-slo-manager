/**
 * UI Component Tests for Corgi SLO Manager
 * Run these tests in the browser console after loading the application.
 */

// Simple UI test framework
window.UITestRunner = {
    tests: [],
    passed: 0,
    failed: 0,
    
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    async runTests() {
        console.log('🧪 Running UI tests...');
        this.passed = 0;
        this.failed = 0;
        
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
    },
    
    // Helper to create a temporary test container
    createTestContainer() {
        const container = document.createElement('div');
        container.id = 'ui-test-container';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        return container;
    },
    
    // Helper to remove the test container
    removeTestContainer() {
        const container = document.getElementById('ui-test-container');
        if (container) {
            document.body.removeChild(container);
        }
    }
};

// Test UI.createButton
UITestRunner.addTest('UI.createButton creates a button with correct attributes', () => {
    const container = UITestRunner.createTestContainer();
    
    // Create primary button
    const primaryButton = UI.createButton('Test Button', () => {}, 'primary');
    container.appendChild(primaryButton);
    
    // Verify button properties
    if (primaryButton.tagName !== 'BUTTON') {
        throw new Error(`Expected button element, got ${primaryButton.tagName}`);
    }
    
    if (primaryButton.textContent !== 'Test Button') {
        throw new Error(`Expected button text "Test Button", got "${primaryButton.textContent}"`);
    }
    
    if (!primaryButton.classList.contains('btn') || !primaryButton.classList.contains('btn-primary')) {
        throw new Error('Button does not have correct CSS classes');
    }
    
    // Create secondary button
    const secondaryButton = UI.createButton('Secondary', () => {}, 'secondary');
    container.appendChild(secondaryButton);
    
    if (!secondaryButton.classList.contains('btn-secondary')) {
        throw new Error('Secondary button does not have correct CSS class');
    }
    
    // Create danger button
    const dangerButton = UI.createButton('Danger', () => {}, 'danger');
    container.appendChild(dangerButton);
    
    if (!dangerButton.classList.contains('btn-danger')) {
        throw new Error('Danger button does not have correct CSS class');
    }
    
    // Test click handler
    let clickHandlerCalled = false;
    const clickTestButton = UI.createButton('Click Test', () => { clickHandlerCalled = true; });
    container.appendChild(clickTestButton);
    
    // Simulate click
    clickTestButton.click();
    
    if (!clickHandlerCalled) {
        throw new Error('Button click handler was not called');
    }
    
    UITestRunner.removeTestContainer();
});

// Test UI.createInput
UITestRunner.addTest('UI.createInput creates input with correct attributes', () => {
    const container = UITestRunner.createTestContainer();
    
    // Create text input
    const textInput = UI.createInput('text', 'test-input', 'Test Input', 'placeholder text');
    container.appendChild(textInput.container); // Append the container instead of just the input
    
    // Verify input properties
    if (textInput.tagName !== 'INPUT') {
        throw new Error(`Expected input element, got ${textInput.tagName}`);
    }
    
    if (textInput.type !== 'text') {
        throw new Error(`Expected input type "text", got "${textInput.type}"`);
    }
    
    if (textInput.id !== 'test-input') {
        throw new Error(`Expected input id "test-input", got "${textInput.id}"`);
    }
    
    if (textInput.placeholder !== 'placeholder text') {
        throw new Error(`Expected placeholder "placeholder text", got "${textInput.placeholder}"`);
    }
    
    // Check if label was created - look in multiple places (direct child of container and document.body)
    const containerLabel = container.querySelector('label[for="test-input"]');
    const bodyLabel = document.body.querySelector('label[for="test-input"]');
    
    if (!containerLabel && !bodyLabel) {
        throw new Error('Label for input was not created');
    }
    
    // Use the first label found for validation
    const label = containerLabel || bodyLabel;
    
    if (label.textContent !== 'Test Input') {
        throw new Error(`Expected label text "Test Input", got "${label.textContent}"`);
    }
    
    // Test value setting and getting
    textInput.value = 'test value';
    if (textInput.value !== 'test value') {
        throw new Error(`Expected input value "test value", got "${textInput.value}"`);
    }
    
    // Clean up any labels added directly to body
    const bodyLabels = document.body.querySelectorAll('label[for="test-input"]');
    bodyLabels.forEach(label => label.remove());
    
    UITestRunner.removeTestContainer();
});

// Test UI.createCard
UITestRunner.addTest('UI.createCard creates a card with correct structure', () => {
    const container = UITestRunner.createTestContainer();
    
    // Create card
    const card = UI.createCard('Test Card', 'Card content here');
    container.appendChild(card);
    
    // Verify card structure
    if (!card.classList.contains('card')) {
        throw new Error('Card does not have correct CSS class');
    }
    
    const cardHeader = card.querySelector('.card-header');
    if (!cardHeader) {
        throw new Error('Card header not found');
    }
    
    if (cardHeader.textContent !== 'Test Card') {
        throw new Error(`Expected card header text "Test Card", got "${cardHeader.textContent}"`);
    }
    
    const cardBody = card.querySelector('.card-body');
    if (!cardBody) {
        throw new Error('Card body not found');
    }
    
    if (cardBody.textContent !== 'Card content here') {
        throw new Error(`Expected card body text "Card content here", got "${cardBody.textContent}"`);
    }
    
    UITestRunner.removeTestContainer();
});

// Test UI.createTable
UITestRunner.addTest('UI.createTable creates a table with correct structure', () => {
    const container = UITestRunner.createTestContainer();
    
    // Define columns and data
    const columns = ['ID', 'Name', 'Role'];
    const data = [
        { id: 1, name: 'Alice', role: 'Developer' },
        { id: 2, name: 'Bob', role: 'Designer' }
    ];
    
    // Create table
    const table = UI.createTable(columns, data, (row) => row.id);
    container.appendChild(table);
    
    // Verify table structure
    if (!table.classList.contains('table')) {
        throw new Error('Table does not have correct CSS class');
    }
    
    // Check header
    const headerCells = table.querySelectorAll('thead th');
    if (headerCells.length !== columns.length) {
        throw new Error(`Expected ${columns.length} header cells, got ${headerCells.length}`);
    }
    
    for (let i = 0; i < columns.length; i++) {
        if (headerCells[i].textContent !== columns[i]) {
            throw new Error(`Expected header cell "${columns[i]}", got "${headerCells[i].textContent}"`);
        }
    }
    
    // Check rows
    const rows = table.querySelectorAll('tbody tr');
    if (rows.length !== data.length) {
        throw new Error(`Expected ${data.length} rows, got ${rows.length}`);
    }
    
    // Check first row
    const firstRowCells = rows[0].querySelectorAll('td');
    if (firstRowCells[0].textContent !== '1') {
        throw new Error(`Expected cell content "1", got "${firstRowCells[0].textContent}"`);
    }
    
    if (firstRowCells[1].textContent !== 'Alice') {
        throw new Error(`Expected cell content "Alice", got "${firstRowCells[1].textContent}"`);
    }
    
    if (firstRowCells[2].textContent !== 'Developer') {
        throw new Error(`Expected cell content "Developer", got "${firstRowCells[2].textContent}"`);
    }
    
    UITestRunner.removeTestContainer();
});

// Test UI.createModal
UITestRunner.addTest('UI.createModal creates a modal with correct structure', () => {
    const container = UITestRunner.createTestContainer();
    
    // Create modal
    const modal = UI.createModal('Test Modal', 'Modal content here');
    container.appendChild(modal);
    
    // Verify modal structure
    if (!modal.classList.contains('modal')) {
        throw new Error('Modal does not have correct CSS class');
    }
    
    const modalHeader = modal.querySelector('.modal-header');
    if (!modalHeader) {
        throw new Error('Modal header not found');
    }
    
    const modalTitle = modal.querySelector('.modal-title');
    if (!modalTitle) {
        throw new Error('Modal title not found');
    }
    
    if (modalTitle.textContent !== 'Test Modal') {
        throw new Error(`Expected modal title "Test Modal", got "${modalTitle.textContent}"`);
    }
    
    const modalBody = modal.querySelector('.modal-body');
    if (!modalBody) {
        throw new Error('Modal body not found');
    }
    
    if (modalBody.textContent !== 'Modal content here') {
        throw new Error(`Expected modal body text "Modal content here", got "${modalBody.textContent}"`);
    }
    
    const closeButton = modal.querySelector('.close');
    if (!closeButton) {
        throw new Error('Modal close button not found');
    }
    
    UITestRunner.removeTestContainer();
});

// Test UI.showToast
UITestRunner.addTest('UI.showToast creates and shows a toast notification', async () => {
    // Create toast
    UI.showToast('Test Toast Message', 'success', 500); // Short duration for testing
    
    // Verify toast was created
    const toast = document.querySelector('.toast');
    if (!toast) {
        throw new Error('Toast notification not found');
    }
    
    if (toast.textContent !== 'Test Toast Message') {
        throw new Error(`Expected toast text "Test Toast Message", got "${toast.textContent}"`);
    }
    
    if (!toast.classList.contains('toast-success')) {
        throw new Error('Toast does not have correct type class');
    }
    
    // Wait for toast to be removed
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const toastAfterTimeout = document.querySelector('.toast');
    if (toastAfterTimeout) {
        throw new Error('Toast notification was not removed after timeout');
    }
});

// Test UI.createTabs
UITestRunner.addTest('UI.createTabs creates tabs with correct structure', () => {
    const container = UITestRunner.createTestContainer();
    
    // Define tabs
    const tabs = [
        { id: 'tab1', label: 'Tab 1', content: 'Content 1' },
        { id: 'tab2', label: 'Tab 2', content: 'Content 2' }
    ];
    
    // Create tabs
    const tabsElement = UI.createTabs(tabs);
    container.appendChild(tabsElement);
    
    // Verify tabs structure
    const tabList = tabsElement.querySelector('.tabs-list');
    if (!tabList) {
        throw new Error('Tabs list not found');
    }
    
    const tabItems = tabList.querySelectorAll('.tab-item');
    if (tabItems.length !== tabs.length) {
        throw new Error(`Expected ${tabs.length} tab items, got ${tabItems.length}`);
    }
    
    if (tabItems[0].textContent !== 'Tab 1') {
        throw new Error(`Expected tab item text "Tab 1", got "${tabItems[0].textContent}"`);
    }
    
    // First tab should be active by default
    if (!tabItems[0].classList.contains('active')) {
        throw new Error('First tab item should be active by default');
    }
    
    // Check tab content
    const tabContents = tabsElement.querySelectorAll('.tab-content');
    if (tabContents.length !== tabs.length) {
        throw new Error(`Expected ${tabs.length} tab contents, got ${tabContents.length}`);
    }
    
    if (tabContents[0].textContent !== 'Content 1') {
        throw new Error(`Expected tab content "Content 1", got "${tabContents[0].textContent}"`);
    }
    
    // First tab content should be visible by default
    if (tabContents[0].style.display === 'none') {
        throw new Error('First tab content should be visible by default');
    }
    
    // Second tab content should be hidden by default
    if (tabContents[1].style.display !== 'none') {
        throw new Error('Second tab content should be hidden by default');
    }
    
    // Test tab switching
    tabItems[1].click();
    
    // After click, second tab should be active
    if (!tabItems[1].classList.contains('active')) {
        throw new Error('Second tab item should be active after click');
    }
    
    // First tab should no longer be active
    if (tabItems[0].classList.contains('active')) {
        throw new Error('First tab item should not be active after clicking second tab');
    }
    
    // Second tab content should be visible
    if (tabContents[1].style.display === 'none') {
        throw new Error('Second tab content should be visible after click');
    }
    
    // First tab content should be hidden
    if (tabContents[0].style.display !== 'none') {
        throw new Error('First tab content should be hidden after clicking second tab');
    }
    
    UITestRunner.removeTestContainer();
});

// Run all tests
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the application to initialize first
    setTimeout(() => {
        console.log('Starting UI tests...');
        UITestRunner.runTests()
            .then(results => {
                console.log(`UI Tests completed. ${results.passed}/${results.total} passed.`);
            })
            .catch(error => {
                console.error('Error running tests:', error);
            });
    }, 1000);
});

console.log('UI tests loaded, UITestRunner attached to window scope:', !!window.UITestRunner); 