import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { ProjectList } from '../components/ProjectList.js';
import { ProjectSelector } from '../components/ProjectSelector.js';
import { ProjectDetails } from '../components/ProjectDetails.js';
import { DevShedApiClient } from '../services/api.js';
import { extractId } from '../utils/mongo.js';

export class ProjectsCommand extends Command {
  constructor() {
    super('projects');
    this.description('Manage projects');
    
    this.command('list')
      .description('List all accessible projects')
      .action(this.listProjects);
    
    this.command('create <name>')
      .description('Create a new project')
      .action(this.createProject);
    
    this.command('switch')
      .description('Interactively switch to a different project')
      .action(this.switchProject);
    
    this.command('read [project-id]')
      .alias('get')
      .description('Show detailed information about current project or specified project')
      .action(this.readProject);
  }

  private async listProjects() {
    render(React.createElement(ProjectList));
  }

  private async createProject(name: string) {
    try {
      const apiClient = await DevShedApiClient.createFromConfig();
      if (!apiClient) {
        console.error('❌ Failed to initialize API client');
        return;
      }

      console.log(`Creating project: ${name}...`);
      const response = await apiClient.createProject({ name });
      
      if (response.success && response.data) {
        // Handle different response formats
        let projectData = response.data;
        if ((response.data as any).data) {
          projectData = (response.data as any).data;
        }
        
        const projectId = extractId((projectData as any)._id) || extractId((projectData as any).id);
        const projectName = (projectData as any).name;
        
        console.log(`✅ Project created successfully!`);
        console.log(`   ID: ${projectId}`);
        console.log(`   Name: ${projectName}`);
      } else {
        console.error(`❌ Failed to create project: ${response.error}`);
      }
    } catch (error) {
      console.error(`❌ Error creating project: ${error}`);
    }
  }

  private async switchProject() {
    render(React.createElement(ProjectSelector));
  }

  private async readProject(projectId?: string) {
    render(React.createElement(ProjectDetails, { projectId }));
  }
}