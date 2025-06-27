import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { ContextDisplay } from '../components/ContextDisplay.js';
import { ConfigManager } from '../utils/config.js';

export class ContextCommand extends Command {
  constructor() {
    super('context');
    this.description('Manage context and session state');
    
    this.command('show')
      .alias('')
      .description('Show current context')
      .action(this.showContext);
    
    this.command('switch')
      .description('Switch context')
      .addCommand(this.createSwitchProjectCommand())
      .addCommand(this.createSwitchOrgCommand());
    
    this.command('use')
      .description('Temporarily use context')
      .addCommand(this.createUseProjectCommand())
      .addCommand(this.createUseOrgCommand());
  }

  private createSwitchProjectCommand() {
    return new Command('project')
      .argument('<project-id>', 'Project ID to switch to')
      .description('Switch to a project permanently')
      .action(this.switchProject);
  }

  private createSwitchOrgCommand() {
    return new Command('org')
      .argument('<org-id>', 'Organization ID to switch to')
      .description('Switch to an organization permanently')
      .action(this.switchOrg);
  }

  private createUseProjectCommand() {
    return new Command('project')
      .argument('<project-name>', 'Project name to use temporarily')
      .description('Use a project for this session')
      .action(this.useProject);
  }

  private createUseOrgCommand() {
    return new Command('org')
      .argument('<org-name>', 'Organization name to use temporarily')
      .description('Use an organization for this session')
      .action(this.useOrg);
  }

  private async showContext() {
    render(React.createElement(ContextDisplay));
  }

  private async switchProject(projectId: string) {
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.updateCurrentProject(projectId);
      console.log(`✅ Switched to project: ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to switch project: ${error}`);
    }
  }

  private async switchOrg(orgId: string) {
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.updateConfig({ defaultOrganizationId: orgId });
      console.log(`✅ Switched to organization: ${orgId}`);
    } catch (error) {
      console.error(`❌ Failed to switch organization: ${error}`);
    }
  }

  private async useProject(projectName: string) {
    console.log(`🔄 Temporarily using project: ${projectName}`);
    console.log('Note: Use "devshed context switch project <id>" for permanent changes');
  }

  private async useOrg(orgName: string) {
    console.log(`🔄 Temporarily using organization: ${orgName}`);
    console.log('Note: Use "devshed context switch org <id>" for permanent changes');
  }
}