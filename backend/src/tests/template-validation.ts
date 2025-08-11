/**
 * Template validation script to ensure all template variables are properly replaced
 */
import { TemplateLoader } from '../services/email/TemplateLoader';

interface TemplateTestCase {
	templateName: string;
	variables: Record<string, any>;
	expectedVariables: string[];
}

const testCases: TemplateTestCase[] = [
	{
		templateName: 'alert-email.html',
		variables: {
			sensorType: 'Temperature Sensor',
			value: '32.5°C',
			threshold: '30°C',
			timestamp: new Date().toLocaleString(),
			currentYear: '2025'
		},
		expectedVariables: ['sensorType', 'value', 'threshold', 'timestamp', 'currentYear']
	},
	{
		templateName: 'batch-alert-email.html',
		variables: {
			alertItemsHtml: '<div class=\'alert-item\'>Test Alert</div>',
			alertCount: '3',
			frequencyMinutes: '60',
			timeRange: '2025-01-01 10:00 - 2025-01-01 11:00',
			criticalCount: '1',
			highCount: '1',
			mediumCount: '1',
			lowCount: '0',
			dashboardUrl: 'http://localhost:3000',
			generatedAt: new Date().toLocaleString(),
			nextSummaryTime: '60'
		},
		expectedVariables: ['alertItemsHtml', 'alertCount', 'frequencyMinutes', 'timeRange', 'criticalCount', 'highCount', 'mediumCount', 'lowCount', 'dashboardUrl', 'generatedAt', 'nextSummaryTime']
	},
	{
		templateName: 'password-reset-email.html',
		variables: {
			resetUrl: 'http://localhost:3000/reset-password?token=test123',
			timestamp: new Date().toLocaleString()
		},
		expectedVariables: ['resetUrl', 'timestamp']
	},
	{
		templateName: 'test-email.html',
		variables: {
			testMessage: 'This is a test email',
			timestamp: new Date().toLocaleString(),
			currentYear: '2025'
		},
		expectedVariables: ['testMessage', 'timestamp', 'currentYear']
	}
];

async function validateTemplates() {
	console.log('🔍 Validating email templates...\n');

	const templateLoader = new TemplateLoader();
	let allValid = true;

	for (const testCase of testCases) {
		console.log(`📄 Testing ${testCase.templateName}...`);

		try {
			// Load the template
			const template = await templateLoader.loadTemplate(testCase.templateName);

			// Find all template variables in the template
			const variableMatches = template.match(/{{(\w+)}}/g);
			const templateVariables = variableMatches ? variableMatches.map(match => match.replace(/[{}]/g, '')) : [];

			console.log(`   Found variables: ${templateVariables.join(', ')}`);

			// Check if all expected variables are provided
			const missingVariables = templateVariables.filter(variable => !Object.prototype.hasOwnProperty.call(testCase.variables, variable));
			const extraVariables = Object.keys(testCase.variables).filter(variable => !templateVariables.includes(variable)); if (missingVariables.length > 0) {
				console.log(`   ❌ Missing variables: ${missingVariables.join(', ')}`);
				allValid = false;
			}

			if (extraVariables.length > 0) {
				console.log(`   ⚠️  Extra variables (not used): ${extraVariables.join(', ')}`);
			}

			// Process the template with provided variables
			const processedTemplate = templateLoader.processTemplate(template, testCase.variables);

			// Check if any variables remain unreplaced
			const unreplacedMatches = processedTemplate.match(/{{(\w+)}}/g);
			if (unreplacedMatches) {
				console.log(`   ❌ Unreplaced variables: ${unreplacedMatches.join(', ')}`);
				allValid = false;
			} else {
				console.log('✅ All variables replaced successfully');
			}

			console.log('');

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			console.log(`   ❌ Error processing template: ${errorMessage}\n`);
			allValid = false;
		}
	}

	if (allValid) {
		console.log('🎉 All templates validated successfully!');
	} else {
		console.log('❌ Some templates have issues that need to be addressed.');
		process.exit(1);
	}
}

// Run validation if this file is executed directly
if (require.main === module) {
	validateTemplates().catch(console.error);
}

export { validateTemplates };