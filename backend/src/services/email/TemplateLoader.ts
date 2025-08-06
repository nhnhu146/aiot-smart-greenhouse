import fs from 'fs';
import path from 'path';
import { inline } from '@css-inline/css-inline';
export class TemplateLoader {
	private templateCache = new Map<string, string>();
	async loadTemplate(templateName: string): Promise<string> {
		// Check cache first
		if (this.templateCache.has(templateName)) {
			return this.templateCache.get(templateName)!;
		}

		try {
			// Try multiple paths for template loading (development vs production)
			const possiblePaths = [
				path.join(__dirname, '..', '..', 'templates', templateName),
				path.join(__dirname, '..', 'templates', templateName),
				path.join(process.cwd(), 'dist', 'templates', templateName),
				path.join(process.cwd(), 'src', 'templates', templateName),
				path.join(process.cwd(), 'templates', templateName)
			];
			let template = '';
			let templateFound = false;
			for (const templatePath of possiblePaths) {
				try {
					if (fs.existsSync(templatePath)) {
						template = fs.readFileSync(templatePath, 'utf8');
						templateFound = true;
						console.log(`📄 Template loaded from: ${templatePath}`);
						break;
					}
				} catch (error) {
					// Continue to next path
					continue;
				}
			}

			if (!templateFound) {
				throw new Error(`Template ${templateName} not found in any of the expected paths`);
			}

			// Cache the template
			this.templateCache.set(templateName, template);
			return template;
		} catch (error) {
			console.error(`❌ Failed to load template ${templateName}:`, error);
			throw error;
		}
	}

	processTemplate(template: string, variables: Record<string, any> = { /* TODO: Implement */ }): string {
		let processedTemplate = template;
		// Replace variables using Map-based approach for better performance
		const variableMap = new Map(Object.entries(variables));
		variableMap.forEach((value, key) => {
			const placeholder = `{{${key}}}`;
			processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), String(value));
		});
		return processedTemplate;
	}

	async processTemplateWithCSS(template: string, variables: Record<string, any> = { /* TODO: Implement */ }): Promise<string> {
		const processedTemplate = this.processTemplate(template, variables);
		try {
			// Inline CSS for better email compatibility
			const inlinedTemplate = inline(processedTemplate);
			return inlinedTemplate;
		} catch (error) {
			console.warn('⚠️ CSS inlining failed, using original template:', error);
			return processedTemplate;
		}
	}

	clearCache(): void {
		this.templateCache.clear();
		console.log('🗑️ Template cache cleared');
	}
}
