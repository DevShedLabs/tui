import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DevShedConfig } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.devshed');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  private static instance: ConfigManager;
  private config: DevShedConfig | null = null;

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create config directory: ${error}`);
    }
  }

  async configExists(): Promise<boolean> {
    try {
      await fs.access(CONFIG_FILE);
      return true;
    } catch {
      return false;
    }
  }

  async loadConfig(): Promise<DevShedConfig | null> {
    if (this.config) {
      return this.config;
    }

    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf8');
      this.config = JSON.parse(configData) as DevShedConfig;
      return this.config;
    } catch (error) {
      return null;
    }
  }

  async saveConfig(config: DevShedConfig): Promise<void> {
    await this.ensureConfigDir();
    
    try {
      await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  async updateConfig(updates: Partial<DevShedConfig>): Promise<DevShedConfig> {
    const currentConfig = await this.loadConfig();
    if (!currentConfig) {
      throw new Error('No config found to update');
    }

    const updatedConfig = { ...currentConfig, ...updates };
    await this.saveConfig(updatedConfig);
    return updatedConfig;
  }

  async updateCurrentProject(projectId: string): Promise<void> {
    await this.updateConfig({ currentProjectId: projectId });
  }

  async updateCurrentTask(taskId: string): Promise<void> {
    await this.updateConfig({ currentTaskId: taskId });
  }

  async clearCurrentTask(): Promise<void> {
    await this.updateConfig({ currentTaskId: undefined });
  }

  getConfigPath(): string {
    return CONFIG_FILE;
  }

  getCurrentConfig(): DevShedConfig | null {
    return this.config;
  }
}