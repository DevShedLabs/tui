#!/usr/bin/env node

import { Command } from 'commander';
import updateNotifier from 'update-notifier';
import { createRequire } from 'module';
import { ProjectsCommand } from './commands/projects.js';
import { TasksCommand } from './commands/tasks.js';
import { ContextCommand } from './commands/context.js';
import { InitManager } from './utils/init.js';
import { ConfigManager } from './utils/config.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

async function main() {
  try {
    // Check for updates
    const notifier = updateNotifier({ pkg });
    notifier.notify();

    // Create CLI program
    const program = new Command();

    program
      .name('devshed')
      .description('DevShed Terminal User Interface')
      .version(pkg.version);

    // Add init command for manual config setup
    const initManager = new InitManager();
    program
      .command('init')
      .description('Initialize or reconfigure DevShed TUI')
      .action(async () => {
        await initManager.initializeConfig();
      });

    // Check if we need config for the current command
    const args = process.argv.slice(2);
    const isHelpCommand = args.includes('--help') || args.includes('-h') || args.includes('help') || args.length === 0;
    const isInitCommand = args.includes('init');
    
    if (!isHelpCommand && !isInitCommand) {
      // Initialize config if needed for non-help commands
      await initManager.ensureConfigExists();

      // Load config
      const configManager = ConfigManager.getInstance();
      const config = await configManager.loadConfig();
      
      if (!config) {
        console.error('❌ Failed to load configuration. Run "devshed init" to set up.');
        process.exit(1);
      }
    }

    // Add update command
    program
      .command('update')
      .description('Update DevShed TUI to latest version')
      .action(async () => {
        console.log('🔄 Checking for updates...');
        try {
          const { execSync } = await import('child_process');
          const currentVersion = pkg.version;
          const latestVersion = execSync('npm view @devshed/tui version', { encoding: 'utf8' }).trim();
          
          if (currentVersion === latestVersion) {
            console.log(`✅ Already on latest version: ${currentVersion}`);
            return;
          }
          
          console.log(`📦 Updating from ${currentVersion} to ${latestVersion}...`);
          execSync('npm install -g @devshed/tui@latest', { stdio: 'inherit' });
          console.log('✅ Update complete! Restart your terminal to use the new version.');
        } catch (error) {
          console.error('❌ Update failed:', error instanceof Error ? error.message : 'Unknown error');
          console.log('💡 Try running: npm install -g @devshed/tui@latest');
        }
      });

    program
      .addCommand(new ProjectsCommand())
      .addCommand(new TasksCommand())
      .addCommand(new ContextCommand());

    program.parse();
  } catch (error) {
    console.error('❌ Error starting DevShed TUI:', error);
    process.exit(1);
  }
}

main();