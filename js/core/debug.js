/**
 * Debug Module for Corgi SLO Manager
 * Provides debugging tools and utilities
 */

console.log('Debug module loading...');

// Global Debug object
window.Debug = (function() {
    /**
     * Initialize the debug module
     * @param {HTMLElement} container - Container element
     * @param {Object} params - Route parameters
     */
    const init = async (container, params) => {
        console.log('Debug module init called', container);
        
        if (!container) {
            console.error('View container is null or undefined');
            return false;
        }
        
        try {
            await renderView(container);
            return true;
        } catch (error) {
            console.error('Error initializing debug module:', error);
            return false;
        }
    };
    
    /**
     * Reset the database to initial state
     */
    const resetDatabase = async () => {
        try {
            // Show a confirmation dialog
            const modal = UI.createModal(
                'Reset Database',
                '<p>This will clear all data in the database. This operation cannot be undone.</p>',
                [
                    UI.createButton('Cancel', null, 'secondary'),
                    UI.createButton('Reset Database', async () => {
                        UI.hideModal();
                        
                        try {
                            // Clear all stores
                            UI.showToast('Clearing database...', 'info');
                            
                            await Database.clearStore(Database.STORES.TEAMS);
                            await Database.clearStore(Database.STORES.SERVICES);
                            await Database.clearStore(Database.STORES.CUJS);
                            await Database.clearStore(Database.STORES.SLOS);
                            await Database.clearStore(Database.STORES.ACTIVITIES);
                            
                            // Load sample data
                            UI.showToast('Loading sample data...', 'info');
                            
                            // Create default data
                            await createSampleData();
                            
                            UI.showToast('Database reset successfully!', 'success');
                            
                            // Force page reload to reflect changes
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                            
                        } catch (error) {
                            console.error('Error resetting database:', error);
                            UI.showToast(`Database reset failed: ${error.message}`, 'error');
                        }
                    }, 'primary')
                ]
            );
            
            UI.showModal(modal);
            
        } catch (error) {
            console.error('Error during database reset:', error);
            UI.showToast(`Database reset error: ${error.message}`, 'error');
        }
    };
    
    /**
     * Create sample data for the application
     */
    const createSampleData = async () => {
        try {
            console.log('Starting sample data creation');
            
            // Check if database is empty first
            const existingTeams = await Database.getAll(Database.STORES.TEAMS);
            if (existingTeams && existingTeams.length > 0) {
                console.log('Database already has teams, clearing all stores first');
                
                // Clear all stores in sequence to ensure they're empty
                await Database.clearStore(Database.STORES.SLOS);
                console.log('Cleared SLOs store');
                
                await Database.clearStore(Database.STORES.CUJS);
                console.log('Cleared CUJs store');
                
                await Database.clearStore(Database.STORES.SERVICES);
                console.log('Cleared Services store');
                
                await Database.clearStore(Database.STORES.TEAMS);
                console.log('Cleared Teams store');
                
                await Database.clearStore(Database.STORES.ACTIVITIES);
                console.log('Cleared Activities store');
            }
            
            // Use timestamp in IDs to ensure uniqueness
            const timestamp = Date.now();
            
            // Create teams with guaranteed unique IDs
            console.log('Creating teams');
            const teams = [
                {
                    teamUID: `team-${timestamp}-001`,
                    name: 'Frontend Team',
                    description: 'Responsible for user interfaces and client-side code',
                    email: 'frontend@example.com',
                    slackChannel: '#frontend',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-002`,
                    name: 'Backend Team',
                    description: 'Responsible for APIs and server-side logic',
                    email: 'backend@example.com',
                    slackChannel: '#backend',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-003`,
                    name: 'Infrastructure Team',
                    description: 'Responsible for infrastructure and deployments',
                    email: 'infra@example.com',
                    slackChannel: '#infra',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-004`,
                    name: 'Data Engineering Team',
                    description: 'Responsible for data pipelines and analytics',
                    email: 'data@example.com',
                    slackChannel: '#data-eng',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-005`,
                    name: 'Security Team',
                    description: 'Responsible for security and compliance',
                    email: 'security@example.com',
                    slackChannel: '#security',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-006`,
                    name: 'Mobile Team',
                    description: 'Responsible for mobile applications',
                    email: 'mobile@example.com',
                    slackChannel: '#mobile',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-007`,
                    name: 'DevOps Team',
                    description: 'Responsible for CI/CD and automation',
                    email: 'devops@example.com',
                    slackChannel: '#devops',
                    createdAt: new Date().toISOString()
                },
                {
                    teamUID: `team-${timestamp}-008`,
                    name: 'Product Team',
                    description: 'Responsible for product management',
                    email: 'product@example.com',
                    slackChannel: '#product',
                    createdAt: new Date().toISOString()
                }
            ];
            
            // Create teams one by one
            for (let i = 0; i < teams.length; i++) {
                await Database.create(Database.STORES.TEAMS, teams[i]);
                console.log(`Created team ${i+1}: ${teams[i].name}`);
            }
            
            // Create services with guaranteed unique IDs
            console.log('Creating services');
            const services = [
                {
                    serviceUID: `service-${timestamp}-001`,
                    name: 'User Interface',
                    description: 'Main user interface components',
                    teamUID: teams[0].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-002`,
                    name: 'Authentication API',
                    description: 'Authentication and authorization service',
                    teamUID: teams[1].teamUID,
                    tier: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-003`,
                    name: 'User API',
                    description: 'User management service',
                    teamUID: teams[1].teamUID,
                    tier: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-004`,
                    name: 'Cloud Infrastructure',
                    description: 'Cloud infrastructure service',
                    teamUID: teams[2].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-005`,
                    name: 'Data Pipeline',
                    description: 'ETL and data processing',
                    teamUID: teams[3].teamUID,
                    tier: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-006`,
                    name: 'Analytics Dashboard',
                    description: 'Business intelligence dashboards',
                    teamUID: teams[3].teamUID,
                    tier: 3,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-007`,
                    name: 'Identity Management',
                    description: 'User identity and access management',
                    teamUID: teams[4].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-008`,
                    name: 'Mobile API Gateway',
                    description: 'API gateway for mobile clients',
                    teamUID: teams[5].teamUID,
                    tier: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-009`,
                    name: 'iOS App',
                    description: 'Native iOS application',
                    teamUID: teams[5].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-010`,
                    name: 'Android App',
                    description: 'Native Android application',
                    teamUID: teams[5].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-011`,
                    name: 'CI/CD Pipeline',
                    description: 'Continuous integration and deployment',
                    teamUID: teams[6].teamUID,
                    tier: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-012`,
                    name: 'Monitoring System',
                    description: 'Application and infrastructure monitoring',
                    teamUID: teams[6].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-013`,
                    name: 'Feature Flags Service',
                    description: 'Feature flag management',
                    teamUID: teams[7].teamUID,
                    tier: 3,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-014`,
                    name: 'Product Analytics',
                    description: 'Product usage analytics',
                    teamUID: teams[7].teamUID,
                    tier: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    serviceUID: `service-${timestamp}-015`,
                    name: 'Customer Database',
                    description: 'Main customer database',
                    teamUID: teams[1].teamUID,
                    tier: 1,
                    createdAt: new Date().toISOString()
                }
            ];
            
            // Create services one by one
            for (let i = 0; i < services.length; i++) {
                await Database.create(Database.STORES.SERVICES, services[i]);
                console.log(`Created service ${i+1}: ${services[i].name}`);
            }
            
            // Create CUJs with guaranteed unique IDs
            console.log('Creating CUJs');
            const cujs = [
                {
                    cujUID: `cuj-${timestamp}-001`,
                    name: 'User Login',
                    description: 'User logs into the application',
                    serviceUID: services[1].serviceUID,
                    status: 'approved',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-002`,
                    name: 'User Registration',
                    description: 'New user registers for an account',
                    serviceUID: services[1].serviceUID,
                    status: 'ready-for-review',
                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
                    readyForReviewBy: 'alice.walker@example.com'
                },
                {
                    cujUID: `cuj-${timestamp}-003`,
                    name: 'Profile Update',
                    description: 'User updates their profile information',
                    serviceUID: services[2].serviceUID,
                    status: 'draft',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-004`,
                    name: 'Dashboard View',
                    description: 'User views the main dashboard',
                    serviceUID: services[0].serviceUID,
                    status: 'approved',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-005`,
                    name: 'Run Data Pipeline',
                    description: 'Data engineer runs ETL pipeline',
                    serviceUID: services[4].serviceUID,
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                    readyForReviewBy: 'data.engineer@example.com'
                },
                {
                    cujUID: `cuj-${timestamp}-006`,
                    name: 'View Analytics Report',
                    description: 'Business user views analytics dashboard',
                    serviceUID: services[5].serviceUID,
                    status: 'approved',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-007`,
                    name: 'Mobile App Login',
                    description: 'User logs into mobile application',
                    serviceUID: services[7].serviceUID,
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                    readyForReviewBy: 'mobile.dev@example.com'
                },
                {
                    cujUID: `cuj-${timestamp}-008`,
                    name: 'iOS App Startup',
                    description: 'iOS app cold start process',
                    serviceUID: services[8].serviceUID,
                    status: 'draft',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-009`,
                    name: 'Android App Startup',
                    description: 'Android app cold start process',
                    serviceUID: services[9].serviceUID,
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), // 9 days ago
                    readyForReviewBy: 'android.dev@example.com'
                },
                {
                    cujUID: `cuj-${timestamp}-010`,
                    name: 'Deploy Application',
                    description: 'DevOps deploys new application version',
                    serviceUID: services[10].serviceUID,
                    status: 'approved',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-011`,
                    name: 'View System Health',
                    description: 'SRE checks system health',
                    serviceUID: services[11].serviceUID,
                    status: 'experimental',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-012`,
                    name: 'Toggle Feature Flag',
                    description: 'Product manager toggles feature flag',
                    serviceUID: services[12].serviceUID,
                    status: 'draft',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-013`,
                    name: 'Export Analytics Report',
                    description: 'Analyst exports analytics report',
                    serviceUID: services[13].serviceUID,
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
                    readyForReviewBy: 'data.analyst@example.com'
                },
                {
                    cujUID: `cuj-${timestamp}-014`,
                    name: 'Customer Data Query',
                    description: 'Support queries customer information',
                    serviceUID: services[14].serviceUID,
                    status: 'approved',
                    createdAt: new Date().toISOString()
                },
                {
                    cujUID: `cuj-${timestamp}-015`,
                    name: 'Password Reset',
                    description: 'User resets their password',
                    serviceUID: services[1].serviceUID,
                    status: 'draft',
                    createdAt: new Date().toISOString()
                }
            ];
            
            // Create CUJs one by one
            for (let i = 0; i < cujs.length; i++) {
                await Database.create(Database.STORES.CUJS, cujs[i]);
                console.log(`Created CUJ ${i+1}: ${cujs[i].name}`);
            }
            
            // Create SLOs with guaranteed unique IDs
            console.log('Creating SLOs');
            const slos = [
                {
                    sloUID: `slo-${timestamp}-001`,
                    name: 'Auth Response Time',
                    description: 'Authentication API response time',
                    serviceUID: services[1].serviceUID,
                    sliName: 'API Latency',
                    sliDescription: 'P99 request latency',
                    target: '99%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[0].cujUID,
                    metricSource: 'Prometheus',
                    metricName: 'auth_request_duration_seconds',
                    sliMetricSource: 'Prometheus',
                    sliMetricName: 'auth_request_duration_seconds'
                },
                {
                    sloUID: `slo-${timestamp}-002`,
                    name: 'Auth Availability',
                    description: 'Authentication API availability',
                    serviceUID: services[1].serviceUID,
                    sliName: 'API Availability',
                    sliDescription: 'Percentage of successful requests',
                    target: '99.9%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[0].cujUID,
                    metricSource: 'Prometheus',
                    metricName: 'auth_success_rate',
                    sliMetricSource: 'Prometheus',
                    sliMetricName: 'auth_success_rate'
                },
                {
                    sloUID: `slo-${timestamp}-003`,
                    name: 'UI Load Time',
                    description: 'User interface load time',
                    serviceUID: services[0].serviceUID,
                    sliName: 'Page Load',
                    sliDescription: 'P95 page load time',
                    target: '98%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[2].cujUID,
                    metricSource: 'Google Analytics',
                    metricName: 'page_load_time',
                    sliMetricSource: 'Google Analytics',
                    sliMetricName: 'page_load_time'
                },
                {
                    sloUID: `slo-${timestamp}-004`,
                    name: 'Cloud Uptime',
                    description: 'Cloud infrastructure uptime',
                    serviceUID: services[3].serviceUID,
                    sliName: 'Uptime',
                    sliDescription: 'Service availability',
                    target: '99.95%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[11].cujUID,
                    metricSource: 'AWS CloudWatch',
                    metricName: 'instance_uptime',
                    sliMetricSource: 'AWS CloudWatch',
                    sliMetricName: 'instance_uptime'
                },
                {
                    sloUID: `slo-${timestamp}-005`,
                    name: 'Pipeline Execution Time',
                    description: 'Data pipeline execution time',
                    serviceUID: services[4].serviceUID,
                    sliName: 'Execution Duration',
                    sliDescription: 'Full pipeline execution time',
                    target: '95%',
                    window: '28d',
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[13].cujUID,
                    metricSource: 'Prometheus',
                    metricName: 'pipeline_duration_seconds',
                    sliMetricSource: 'Prometheus',
                    sliMetricName: 'pipeline_duration_seconds'
                },
                {
                    sloUID: `slo-${timestamp}-006`,
                    name: 'Analytics Dashboard Performance',
                    description: 'Analytics dashboard load time',
                    serviceUID: services[5].serviceUID,
                    sliName: 'Dashboard Load',
                    sliDescription: 'Dashboard load and render time',
                    status: 'ready-for-review',
                    target: '97%',
                    window: '28d',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                    readyForReviewBy: 'data.analyst@example.com',
                    cujUID: cujs[5].cujUID,
                    metricSource: 'Datadog',
                    metricName: 'dashboard_render_time',
                    sliMetricSource: 'Datadog',
                    sliMetricName: 'dashboard_render_time'
                },
                {
                    sloUID: `slo-${timestamp}-007`,
                    name: 'Identity Management Uptime',
                    description: 'Identity management service uptime',
                    serviceUID: services[6].serviceUID,
                    sliName: 'Service Uptime',
                    sliDescription: 'Service availability percentage',
                    target: '99.5%',
                    window: '28d',
                    status: 'inactive',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[0].cujUID,
                    metricSource: 'Uptime Robot',
                    metricName: 'service_uptime_percentage',
                    sliMetricSource: 'Uptime Robot',
                    sliMetricName: 'service_uptime_percentage'
                },
                {
                    sloUID: `slo-${timestamp}-008`,
                    name: 'Mobile API Response Time',
                    description: 'Mobile API response time',
                    serviceUID: services[7].serviceUID,
                    sliName: 'API Latency',
                    sliDescription: 'P95 API response time',
                    target: '99.9%',
                    window: '28d',
                    status: 'experimental',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[1].cujUID,
                    metricSource: 'New Relic',
                    metricName: 'mobile_api_response_time',
                    sliMetricSource: 'New Relic',
                    sliMetricName: 'mobile_api_response_time'
                },
                {
                    sloUID: `slo-${timestamp}-009`,
                    name: 'iOS Login Success Rate',
                    description: 'iOS login success rate',
                    serviceUID: services[8].serviceUID,
                    sliName: 'Login Success',
                    sliDescription: 'Percentage of successful logins',
                    target: '99.5%',
                    window: '14d',
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[0].cujUID,
                    metricSource: 'Firebase',
                    metricName: 'ios_login_success_rate',
                    sliMetricSource: 'Firebase',
                    sliMetricName: 'ios_login_success_rate'
                },
                {
                    sloUID: `slo-${timestamp}-010`,
                    name: 'Android Login Success Rate',
                    description: 'Android login success rate',
                    serviceUID: services[9].serviceUID,
                    sliName: 'Login Success',
                    sliDescription: 'Percentage of successful logins',
                    status: 'ready-for-review',
                    target: '99.5%',
                    window: '14d',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(), // 9 days ago
                    readyForReviewBy: 'mobile.lead@example.com',
                    cujUID: cujs[0].cujUID,
                    metricSource: 'Firebase',
                    metricName: 'android_login_success_rate',
                    sliMetricSource: 'Firebase',
                    sliMetricName: 'android_login_success_rate'
                },
                {
                    sloUID: `slo-${timestamp}-011`,
                    name: 'CI/CD Pipeline Speed',
                    description: 'CI/CD pipeline execution time',
                    serviceUID: services[10].serviceUID,
                    sliName: 'Build Time',
                    sliDescription: 'End-to-end build and deploy time',
                    target: '95%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[11].cujUID,
                    metricSource: 'Jenkins',
                    metricName: 'pipeline_duration',
                    sliMetricSource: 'Jenkins',
                    sliMetricName: 'pipeline_duration'
                },
                {
                    sloUID: `slo-${timestamp}-012`,
                    name: 'Monitoring System Availability',
                    description: 'Monitoring system uptime',
                    serviceUID: services[11].serviceUID,
                    sliName: 'Uptime',
                    sliDescription: 'Service availability',
                    target: '99.99%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[11].cujUID,
                    metricSource: 'Pingdom',
                    metricName: 'monitoring_uptime',
                    sliMetricSource: 'Pingdom',
                    sliMetricName: 'monitoring_uptime'
                },
                {
                    sloUID: `slo-${timestamp}-013`,
                    name: 'Feature Flag Service Latency',
                    description: 'Feature flag service response time',
                    serviceUID: services[12].serviceUID,
                    sliName: 'API Latency',
                    sliDescription: 'P99 request latency',
                    target: '99%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[12].cujUID,
                    metricSource: 'LaunchDarkly',
                    metricName: 'flag_request_latency',
                    sliMetricSource: 'LaunchDarkly',
                    sliMetricName: 'flag_request_latency'
                },
                {
                    sloUID: `slo-${timestamp}-014`,
                    name: 'Analytics Query Performance',
                    description: 'Product analytics query speed',
                    serviceUID: services[13].serviceUID,
                    sliName: 'Query Time',
                    sliDescription: 'P95 query execution time',
                    target: '97%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[13].cujUID,
                    metricSource: 'BigQuery',
                    metricName: 'query_execution_time',
                    sliMetricSource: 'BigQuery',
                    sliMetricName: 'query_execution_time'
                },
                {
                    sloUID: `slo-${timestamp}-015`,
                    name: 'Customer DB Availability',
                    description: 'Customer database availability',
                    serviceUID: services[14].serviceUID,
                    sliName: 'Uptime',
                    sliDescription: 'Database availability',
                    target: '99.99%',
                    window: '28d',
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
                    readyForReviewBy: 'db.admin@example.com',
                    cujUID: cujs[14].cujUID,
                    metricSource: 'DataDog',
                    metricName: 'database_uptime',
                    sliMetricSource: 'DataDog',
                    sliMetricName: 'database_uptime'
                },
                {
                    sloUID: `slo-${timestamp}-016`,
                    name: 'Customer DB Read Latency',
                    description: 'Customer database read performance',
                    serviceUID: services[14].serviceUID,
                    sliName: 'Read Latency',
                    sliDescription: 'P99 read query time',
                    target: '99.5%',
                    window: '28d',
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
                    readyForReviewBy: 'db.engineer@example.com',
                    cujUID: cujs[14].cujUID,
                    metricSource: 'Prometheus',
                    metricName: 'db_read_latency_seconds',
                    sliMetricSource: 'Prometheus',
                    sliMetricName: 'db_read_latency_seconds'
                },
                {
                    sloUID: `slo-${timestamp}-017`,
                    name: 'User API Error Rate',
                    description: 'User API error rate',
                    serviceUID: services[2].serviceUID,
                    sliName: 'Error Rate',
                    sliDescription: 'Percentage of successful responses',
                    target: '99.9%',
                    window: '28d',
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
                    readyForReviewBy: 'api.engineer@example.com',
                    cujUID: cujs[3].cujUID,
                    metricSource: 'Prometheus',
                    metricName: 'api_error_rate',
                    sliMetricSource: 'Prometheus',
                    sliMetricName: 'api_error_rate'
                },
                {
                    sloUID: `slo-${timestamp}-018`,
                    name: 'User API Latency',
                    description: 'User API response time',
                    serviceUID: services[2].serviceUID,
                    sliName: 'API Latency',
                    sliDescription: 'P95 request latency',
                    target: '99%',
                    window: '28d',
                    status: 'approved',
                    createdAt: new Date().toISOString(),
                    cujUID: cujs[3].cujUID,
                    metricSource: 'Datadog',
                    metricName: 'api_request_latency',
                    sliMetricSource: 'Datadog',
                    sliMetricName: 'api_request_latency'
                },
                {
                    sloUID: `slo-${timestamp}-019`,
                    name: 'Frontend Load Time',
                    description: 'Frontend application load time',
                    serviceUID: services[0].serviceUID,
                    sliName: 'Page Load',
                    sliDescription: 'Time to fully interactive',
                    target: '98%',
                    window: '28d',
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
                    readyForReviewBy: 'frontend.dev@example.com',
                    cujUID: cujs[4].cujUID,
                    metricSource: 'Google Analytics',
                    metricName: 'time_to_interactive',
                    sliMetricSource: 'Google Analytics',
                    sliMetricName: 'time_to_interactive'
                },
                {
                    sloUID: `slo-${timestamp}-020`,
                    name: 'API Gateway Throughput',
                    description: 'API Gateway request handling capacity',
                    serviceUID: services[7].serviceUID,
                    sliName: 'Requests Per Second',
                    sliDescription: 'Throughput capacity',
                    target: '99.5%',
                    window: '28d',
                    status: 'ready-for-review',
                    createdAt: new Date().toISOString(),
                    readyForReviewAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
                    readyForReviewBy: 'platform.engineer@example.com',
                    cujUID: cujs[7].cujUID,
                    metricSource: 'CloudWatch',
                    metricName: 'gateway_requests_per_second',
                    sliMetricSource: 'CloudWatch',
                    sliMetricName: 'gateway_requests_per_second'
                }
            ];
            
            // Create SLOs one by one
            for (let i = 0; i < slos.length; i++) {
                await Database.create(Database.STORES.SLOS, slos[i]);
                console.log(`Created SLO ${i+1}: ${slos[i].name}`);
            }
            
            // Create activity record for the import
            const activity = {
                activityUID: `activity-${timestamp}-001`,
                entityType: 'system',
                entityUID: 'database',
                action: 'import-sample-data',
                userUID: 'system',
                timestamp: new Date().toISOString(),
                details: 'Sample data loaded'
            };
            
            await Database.create(Database.STORES.ACTIVITIES, activity);
            console.log('Created activity record');
            
            console.log('Sample data creation completed successfully');
            return true;
        } catch (error) {
            console.error('Error creating sample data:', error);
            throw error;
        }
    };
    
    /**
     * Render the debug view
     * @param {HTMLElement} container - Container element
     */
    const renderView = async (container) => {
        console.log('Rendering Debug view');
        container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.classList.add('section-header');
        header.innerHTML = `
            <h2>Debug Tools</h2>
        `;
        container.appendChild(header);
        
        // Create content
        const content = document.createElement('div');
        content.classList.add('tools-grid');
        content.innerHTML = `
            <div class="tool-card">
                <h3>Database Controls</h3>
                <p>Reset and reload the database with sample data.</p>
                <button id="reset-db-btn" class="btn btn-primary">Clear and Reload Database</button>
            </div>
            <div class="tool-card">
                <h3>Application State</h3>
                <p>View current application state</p>
                <button id="view-state-btn" class="btn btn-primary">View State</button>
            </div>
            <div class="tool-card">
                <h3>Console Logging</h3>
                <p>Toggle verbose console logging</p>
                <button id="toggle-logging-btn" class="btn btn-primary">Enable Verbose Logging</button>
            </div>
        `;
        container.appendChild(content);
        
        // Add event listeners
        document.getElementById('reset-db-btn')?.addEventListener('click', resetDatabase);
        
        document.getElementById('view-state-btn')?.addEventListener('click', () => {
            console.log('Application State:');
            console.log('Router:', window.Router ? (Router.getCurrentRoute ? Router.getCurrentRoute() : 'getCurrentRoute not available') : 'Not available');
            console.log('State:', window.State ? State.getAll() : 'Not available');
            UI.showToast('Application state logged to console', 'info');
        });
        
        const loggingBtn = document.getElementById('toggle-logging-btn');
        if (loggingBtn) {
            let verboseLogging = false;
            
            loggingBtn.addEventListener('click', () => {
                verboseLogging = !verboseLogging;
                
                if (window.Logger) {
                    Logger.setDebugMode(verboseLogging);
                }
                
                loggingBtn.textContent = verboseLogging ? 'Disable Verbose Logging' : 'Enable Verbose Logging';
                UI.showToast(`Verbose logging ${verboseLogging ? 'enabled' : 'disabled'}`, 'info');
            });
        }
    };
    
    // Public API
    return {
        init,
        resetDatabase,
        createSampleData,
        renderView
    };
})();

console.log('Debug module loaded'); 