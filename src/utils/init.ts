import prompts from 'prompts';
import { DevShedConfig } from '../types/index.js';
import { ConfigManager } from './config.js';

export class InitManager {
  private configManager: ConfigManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  async initializeConfig(): Promise<DevShedConfig> {
    console.log('🚀 Welcome to DevShed TUI!');
    console.log('Let\'s set up your configuration...\n');

    const questions = [
      {
        type: 'text' as const,
        name: 'apiUrl',
        message: 'DevShed API URL:',
        initial: 'https://api.devshed.dev',
        validate: (value: string) => {
          try {
            new URL(value);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'text' as const,
        name: 'apiKey',
        message: 'API Key:',
        validate: (value: string) => value.length > 0 || 'API Key is required'
      },
      {
        type: 'text' as const,
        name: 'userId',
        message: 'User ID:',
        validate: (value: string) => value.length > 0 || 'User ID is required'
      },
      {
        type: 'text' as const,
        name: 'defaultOrganizationId',
        message: 'Default Organization ID:',
        validate: (value: string) => value.length > 0 || 'Default Organization ID is required'
      },
      {
        type: 'text' as const,
        name: 'currentProjectId',
        message: 'Current Project ID (optional):',
        initial: ''
      }
    ];

    const response = await prompts(questions, {
      onCancel: () => {
        console.log('\n❌ Setup cancelled. Configuration is required to use DevShed TUI.');
        process.exit(1);
      }
    });

    const config: DevShedConfig = {
      apiUrl: response.apiUrl,
      apiKey: response.apiKey,
      userId: response.userId,
      defaultOrganizationId: response.defaultOrganizationId,
      currentProjectId: response.currentProjectId || undefined,
      preferences: {
        autoSaveContext: true,
        showContextInPrompt: true,
        contextPersistence: 'session_and_config',
        defaultTaskView: 'compact'
      }
    };

    await this.configManager.saveConfig(config);
    
    console.log(`\n✅ Configuration saved to ${this.configManager.getConfigPath()}`);
    console.log('You can now use DevShed TUI!\n');

    return config;
  }

  async ensureConfigExists(): Promise<DevShedConfig> {
    const configExists = await this.configManager.configExists();
    
    if (!configExists) {
      return await this.initializeConfig();
    }

    const config = await this.configManager.loadConfig();
    if (!config) {
      console.log('⚠️  Config file exists but is invalid. Re-initializing...\n');
      return await this.initializeConfig();
    }

    return config;
  }
}