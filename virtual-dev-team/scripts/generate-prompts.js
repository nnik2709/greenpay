#!/usr/bin/env node

/**
 * Generate customized prompts from templates
 * Replaces placeholders in prompt templates with project-specific values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEAM_DIR = path.resolve(__dirname, '..');
const CONFIG_FILE = path.join(TEAM_DIR, 'config', 'project-config.json');
const PROMPTS_DIR = path.join(TEAM_DIR, 'prompts');
const OUTPUT_DIR = path.join(TEAM_DIR, 'prompts-generated');

// Default values if config doesn't exist
const defaults = {
  projectName: 'Your Project',
  frontend: {
    framework: 'React',
    version: '18',
    buildTool: 'Vite',
    styling: 'TailwindCSS',
    uiLibrary: 'Radix UI',
    stateManagement: 'React Context',
    routing: 'React Router'
  },
  backend: {
    framework: 'Node.js',
    runtime: 'Express',
    database: 'PostgreSQL',
    orm: 'pg'
  },
  testing: {
    e2e: 'Playwright',
    unit: 'Jest',
    integration: 'Jest'
  },
  deployment: {
    processManager: 'PM2',
    webServer: 'Nginx',
    hosting: 'VPS'
  },
  directories: {
    backend: 'backend',
    frontend: 'src',
    tests: 'tests',
    docs: 'docs',
    scripts: 'scripts'
  },
  patterns: {
    componentNaming: 'PascalCase',
    fileNaming: 'kebab-case',
    apiStyle: 'RESTful'
  }
};

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.warn(`Config file not found: ${CONFIG_FILE}`);
    console.warn('Using default values. Please create a config file.');
    return defaults;
  }

  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configContent);
    return { ...defaults, ...config };
  } catch (error) {
    console.error(`Error reading config: ${error.message}`);
    return defaults;
  }
}

function getValue(config, path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config) || `{{${path}}}`;
}

function replacePlaceholders(template, config) {
  let result = template;
  
  // Replace simple placeholders
  result = result.replace(/\{\{PROJECT_NAME\}\}/g, config.projectName || defaults.projectName);
  result = result.replace(/\{\{PROJECT_DESCRIPTION\}\}/g, config.description || '');
  
  // Replace nested placeholders
  result = result.replace(/\{\{FRONTEND_FRAMEWORK\}\}/g, getValue(config, 'frontend.framework'));
  result = result.replace(/\{\{FRONTEND_VERSION\}\}/g, getValue(config, 'frontend.version'));
  result = result.replace(/\{\{BUILD_TOOL\}\}/g, getValue(config, 'frontend.buildTool'));
  result = result.replace(/\{\{STYLING\}\}/g, getValue(config, 'frontend.styling'));
  result = result.replace(/\{\{UI_LIBRARY\}\}/g, getValue(config, 'frontend.uiLibrary'));
  result = result.replace(/\{\{STATE_MANAGEMENT\}\}/g, getValue(config, 'frontend.stateManagement'));
  result = result.replace(/\{\{ROUTING\}\}/g, getValue(config, 'frontend.routing'));
  
  result = result.replace(/\{\{BACKEND_FRAMEWORK\}\}/g, getValue(config, 'backend.framework'));
  result = result.replace(/\{\{BACKEND_RUNTIME\}\}/g, getValue(config, 'backend.runtime'));
  result = result.replace(/\{\{DATABASE\}\}/g, getValue(config, 'backend.database'));
  result = result.replace(/\{\{ORM\}\}/g, getValue(config, 'backend.orm'));
  
  result = result.replace(/\{\{E2E_TESTING\}\}/g, getValue(config, 'testing.e2e'));
  result = result.replace(/\{\{UNIT_TESTING\}\}/g, getValue(config, 'testing.unit'));
  result = result.replace(/\{\{INTEGRATION_TESTING\}\}/g, getValue(config, 'testing.integration'));
  
  result = result.replace(/\{\{PROCESS_MANAGER\}\}/g, getValue(config, 'deployment.processManager'));
  result = result.replace(/\{\{WEB_SERVER\}\}/g, getValue(config, 'deployment.webServer'));
  result = result.replace(/\{\{HOSTING\}\}/g, getValue(config, 'deployment.hosting'));
  
  result = result.replace(/\{\{BACKEND_DIR\}\}/g, getValue(config, 'directories.backend'));
  result = result.replace(/\{\{FRONTEND_DIR\}\}/g, getValue(config, 'directories.frontend'));
  result = result.replace(/\{\{TESTS_DIR\}\}/g, getValue(config, 'directories.tests'));
  result = result.replace(/\{\{DOCS_DIR\}\}/g, getValue(config, 'directories.docs'));
  result = result.replace(/\{\{SCRIPTS_DIR\}\}/g, getValue(config, 'directories.scripts'));
  
  result = result.replace(/\{\{COMPONENT_NAMING\}\}/g, getValue(config, 'patterns.componentNaming'));
  result = result.replace(/\{\{FILE_NAMING\}\}/g, getValue(config, 'patterns.fileNaming'));
  result = result.replace(/\{\{API_STYLE\}\}/g, getValue(config, 'patterns.apiStyle'));
  
  // Additional common replacements
  result = result.replace(/\{\{AUTH_METHOD\}\}/g, config.auth?.method || 'JWT');
  result = result.replace(/\{\{BACKEND_PORT\}\}/g, config.backend?.port || '3001');
  result = result.replace(/\{\{DEPLOYMENT_BACKEND_PATH\}\}/g, config.deployment?.backendPath || '{{BACKEND_DIR}}');
  result = result.replace(/\{\{DEPLOYMENT_FRONTEND_PATH\}\}/g, config.deployment?.frontendPath || 'dist');
  result = result.replace(/\{\{TEST_DATA_DIR\}\}/g, config.directories?.testData || 'test-files');
  result = result.replace(/\{\{COMPONENT_PATTERN\}\}/g, config.patterns?.componentPattern || 'functional components with hooks');
  result = result.replace(/\{\{STYLING_PATTERN\}\}/g, config.patterns?.stylingPattern || 'utility classes');
  
  return result;
}

function generatePrompts(config) {
  if (!fs.existsSync(PROMPTS_DIR)) {
    console.error(`Prompts directory not found: ${PROMPTS_DIR}`);
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const promptFiles = fs.readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.txt'));
  
  console.log('Generating customized prompts...');
  console.log(`Project: ${config.projectName}`);
  console.log('');

  promptFiles.forEach(file => {
    const templatePath = path.join(PROMPTS_DIR, file);
    const template = fs.readFileSync(templatePath, 'utf8');
    const customized = replacePlaceholders(template, config);
    
    const outputPath = path.join(OUTPUT_DIR, file);
    fs.writeFileSync(outputPath, customized, 'utf8');
    
    console.log(`✓ Generated: ${file}`);
  });

  console.log('');
  console.log(`Prompts generated in: ${OUTPUT_DIR}`);
  console.log('');
  console.log('You can now use these prompts with your AI tool.');
}

// Main execution
const config = loadConfig();
generatePrompts(config);

