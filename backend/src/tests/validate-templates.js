/**
 * Quick template validation script
 */
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, '..', 'templates');

// Template variable definitions
const templateConfigs = {
    'alert-email.html': ['sensorType', 'value', 'threshold', 'timestamp', 'currentYear'],
    'batch-alert-email.html': ['alertItemsHtml', 'alertCount', 'frequencyMinutes', 'timeRange', 'criticalCount', 'highCount', 'mediumCount', 'lowCount', 'dashboardUrl', 'generatedAt', 'nextSummaryTime'],
    'password-reset-email.html': ['resetUrl', 'timestamp'],
    'test-email.html': ['testMessage', 'timestamp', 'currentYear']
};

async function validateTemplates() {
    console.log('🔍 Validating email templates...\n');
    
    let allValid = true;
    
    for (const [templateName, expectedVars] of Object.entries(templateConfigs)) {
        console.log(`📄 Testing ${templateName}...`);
        
        try {
            const templatePath = path.join(templatesDir, templateName);
            const template = fs.readFileSync(templatePath, 'utf8');
            
            // Find all template variables
            const variableMatches = template.match(/{{(\w+)}}/g);
            const templateVariables = variableMatches ? variableMatches.map(match => match.replace(/[{}]/g, '')) : [];
            
            console.log(`   Found variables: ${templateVariables.join(', ')}`);
            console.log(`   Expected variables: ${expectedVars.join(', ')}`);
            
            // Check for missing variables
            const missingVariables = templateVariables.filter(variable => !expectedVars.includes(variable));
            const extraExpected = expectedVars.filter(variable => !templateVariables.includes(variable));
            
            if (missingVariables.length > 0) {
                console.log(`   ❌ Template has unreplaced variables: ${missingVariables.join(', ')}`);
                allValid = false;
            }
            
            if (extraExpected.length > 0) {
                console.log(`   ⚠️  Expected variables not found in template: ${extraExpected.join(', ')}`);
            }
            
            if (missingVariables.length === 0) {
                console.log(`   ✅ All template variables are covered`);
            }
            
            console.log('');
            
        } catch (error) {
            console.log(`   ❌ Error reading template: ${error.message}\n`);
            allValid = false;
        }
    }
    
    if (allValid) {
        console.log('🎉 All templates have proper variable coverage!');
    } else {
        console.log('❌ Some templates need attention.');
    }
}

validateTemplates().catch(console.error);