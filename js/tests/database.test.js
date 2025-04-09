/**
 * Database Module Tests for Corgi SLO Manager
 * Run these tests in the browser console after loading the application.
 */

// Simple test framework
window.TestRunner = {
    tests: [],
    passed: 0,
    failed: 0,
    
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    },
    
    async runTests() {
        console.log('🧪 Running Database tests...');
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
    }
};

// Database initialization test
TestRunner.addTest('Database initializes correctly', async () => {
    if (!Database) {
        throw new Error('Database module not found');
    }
    
    await Database.init();
    
    // Check that database is initialized
    if (!window.indexedDB) {
        throw new Error('IndexedDB not supported in this browser');
    }
});

// UID generation test
TestRunner.addTest('UID generation works correctly', () => {
    const teamUID = Database.generateUID('team');
    const serviceUID = Database.generateUID('service');
    const cujUID = Database.generateUID('cuj');
    const sliUID = Database.generateUID('sli');
    const sloUID = Database.generateUID('slo');
    
    if (!teamUID.startsWith('team-')) {
        throw new Error(`TeamUID not properly formatted: ${teamUID}`);
    }
    
    if (!serviceUID.startsWith('service-')) {
        throw new Error(`ServiceUID not properly formatted: ${serviceUID}`);
    }
    
    if (!cujUID.startsWith('cuj-')) {
        throw new Error(`CujUID not properly formatted: ${cujUID}`);
    }
    
    if (!sliUID.startsWith('sli-')) {
        throw new Error(`SliUID not properly formatted: ${sliUID}`);
    }
    
    if (!sloUID.startsWith('slo-')) {
        throw new Error(`SloUID not properly formatted: ${sloUID}`);
    }
    
    // Ensure UIDs are unique
    const uids = [teamUID, serviceUID, cujUID, sliUID, sloUID];
    const uniqueUids = [...new Set(uids)];
    
    if (uids.length !== uniqueUids.length) {
        throw new Error('Generated UIDs are not unique');
    }
});

// CRUD operations test
TestRunner.addTest('CRUD operations work correctly', async () => {
    await Database.init();
    
    // Create a test team
    const testTeam = {
        teamUID: Database.generateUID('team'),
        name: 'Test Team',
        description: 'A team for testing',
        createdAt: new Date().toISOString()
    };
    
    // Create
    const createdUID = await Database.create(Database.STORES.TEAMS, testTeam);
    if (createdUID !== testTeam.teamUID) {
        throw new Error(`Create operation failed. Expected ${testTeam.teamUID}, got ${createdUID}`);
    }
    
    // Read
    const readTeam = await Database.get(Database.STORES.TEAMS, testTeam.teamUID);
    if (readTeam.name !== testTeam.name) {
        throw new Error(`Read operation failed. Expected ${testTeam.name}, got ${readTeam.name}`);
    }
    
    // Update
    const updatedTeam = { ...readTeam, name: 'Updated Test Team' };
    await Database.update(Database.STORES.TEAMS, updatedTeam);
    
    // Read again to verify update
    const updatedReadTeam = await Database.get(Database.STORES.TEAMS, testTeam.teamUID);
    if (updatedReadTeam.name !== 'Updated Test Team') {
        throw new Error(`Update operation failed. Expected "Updated Test Team", got ${updatedReadTeam.name}`);
    }
    
    // Delete
    await Database.remove(Database.STORES.TEAMS, testTeam.teamUID);
    
    // Try to read deleted team (should throw)
    try {
        await Database.get(Database.STORES.TEAMS, testTeam.teamUID);
        throw new Error('Delete operation failed. Team still exists.');
    } catch (error) {
        // Expected error - team should be deleted
        if (!error.message.includes('not found')) {
            throw error; // Unexpected error
        }
    }
});

// Query operation test
TestRunner.addTest('Query operations work correctly', async () => {
    await Database.init();
    
    // Clean up any existing test teams first
    const allTeams = await Database.getAll(Database.STORES.TEAMS);
    for (const team of allTeams) {
        if (team.name === 'Alpha Team' || team.name === 'Beta Team') {
            await Database.remove(Database.STORES.TEAMS, team.teamUID);
        }
    }
    
    // Create multiple test teams
    const testTeams = [
        {
            teamUID: Database.generateUID('team'),
            name: 'Alpha Team',
            createdAt: new Date().toISOString()
        },
        {
            teamUID: Database.generateUID('team'),
            name: 'Beta Team',
            createdAt: new Date().toISOString()
        }
    ];
    
    // Add teams
    for (const team of testTeams) {
        await Database.create(Database.STORES.TEAMS, team);
    }
    
    // Test querying by name
    const alphaTeam = await Database.query(Database.STORES.TEAMS, 'name', 'Alpha Team');
    if (alphaTeam.length !== 1) {
        throw new Error(`Query operation failed. Expected 1 team with name 'Alpha Team', got ${alphaTeam.length}`);
    }
    
    if (alphaTeam[0].name !== 'Alpha Team') {
        throw new Error(`Query returned wrong team. Expected 'Alpha Team', got '${alphaTeam[0].name}'`);
    }
    
    // Get all
    const allTeamsAfter = await Database.getAll(Database.STORES.TEAMS);
    if (allTeamsAfter.length < 2) {
        throw new Error(`GetAll operation failed. Expected at least 2 teams, got ${allTeamsAfter.length}`);
    }
    
    // Clean up
    for (const team of testTeams) {
        await Database.remove(Database.STORES.TEAMS, team.teamUID);
    }
});

// Audit logging test
TestRunner.addTest('Audit logging works correctly', async () => {
    await Database.init();
    
    // Create a test log entry
    const entityUID = 'test-entity-123';
    
    await Database.logAudit(
        'test',
        entityUID,
        'create',
        'test-user',
        { testDetail: 'test value' }
    );
    
    // Get audit logs for the entity
    const logs = await Database.getAuditLogs(entityUID);
    
    if (logs.length !== 1) {
        throw new Error(`Expected 1 audit log, got ${logs.length}`);
    }
    
    const log = logs[0];
    
    if (log.entityType !== 'test') {
        throw new Error(`Expected entityType 'test', got '${log.entityType}'`);
    }
    
    if (log.action !== 'create') {
        throw new Error(`Expected action 'create', got '${log.action}'`);
    }
    
    if (log.userUID !== 'test-user') {
        throw new Error(`Expected userUID 'test-user', got '${log.userUID}'`);
    }
    
    if (log.details.testDetail !== 'test value') {
        throw new Error(`Expected details.testDetail 'test value', got '${log.details.testDetail}'`);
    }
    
    // Clean up - delete the log entry
    await Database.remove(Database.STORES.AUDIT_LOGS, log.logUID);
});

// Export/Import test
TestRunner.addTest('Export/Import works correctly', async () => {
    await Database.init();
    
    // Create a test team
    const testTeam = {
        teamUID: Database.generateUID('team'),
        name: 'Export Test Team',
        description: 'A team for testing export/import',
        createdAt: new Date().toISOString()
    };
    
    await Database.create(Database.STORES.TEAMS, testTeam);
    
    // Export the database
    const exportData = await Database.exportDatabase();
    
    // Make sure the exported data contains our test team
    const exportedTeams = exportData.data[Database.STORES.TEAMS];
    const exportedTeam = exportedTeams.find(t => t.teamUID === testTeam.teamUID);
    
    if (!exportedTeam) {
        throw new Error('Export operation failed. Test team not found in exported data.');
    }
    
    // Delete the test team
    await Database.remove(Database.STORES.TEAMS, testTeam.teamUID);
    
    // Verify it's gone
    try {
        await Database.get(Database.STORES.TEAMS, testTeam.teamUID);
        throw new Error('Team deletion failed before import test.');
    } catch (error) {
        // Expected error - team should be deleted
        if (!error.message.includes('not found')) {
            throw error; // Unexpected error
        }
    }
    
    // Import the data back
    await Database.importDatabase(exportData);
    
    // Verify the team is back
    const importedTeam = await Database.get(Database.STORES.TEAMS, testTeam.teamUID);
    
    if (importedTeam.name !== testTeam.name) {
        throw new Error(`Import operation failed. Expected team name ${testTeam.name}, got ${importedTeam.name}`);
    }
    
    // Clean up
    await Database.remove(Database.STORES.TEAMS, testTeam.teamUID);
});

// Run all tests
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the application to initialize first
    setTimeout(() => {
        console.log('Starting database tests...');
        TestRunner.runTests()
            .then(results => {
                console.log(`Database Tests completed. ${results.passed}/${results.total} passed.`);
            })
            .catch(error => {
                console.error('Error running tests:', error);
            });
    }, 1000);
});

console.log('Database tests loaded, TestRunner attached to window scope:', !!window.TestRunner); 