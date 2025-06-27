#!/usr/bin/env node

import { Command } from 'commander';
import { ProjectsCommand } from './commands/projects.js';
import { TasksCommand } from './commands/tasks.js';
import { ContextCommand } from './commands/context.js';
import { InitManager } from './utils/init.js';
import { ConfigManager } from './utils/config.js';

async function main() {
  try {
    // Create CLI program
    const program = new Command();

    program
      .name('devshed')
      .description('DevShed Terminal User Interface')
      .version('0.1.1');

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