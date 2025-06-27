import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { TaskList } from '../components/TaskList.js';
import { TaskSelector } from '../components/TaskSelector.js';
import { TaskDetails } from '../components/TaskDetails.js';
import { TaskCreator } from '../components/TaskCreator.js';
import { TaskUpdater } from '../components/TaskUpdater.js';
import { ConfigManager } from '../utils/config.js';

export class TasksCommand extends Command {
  constructor() {
    super('tasks');
    this.description('Manage tasks');
    
    this.command('list [project-id]')
      .description('List tasks for a project')
      .action(this.listTasks);
    
    this.command('create <title>')
      .description('Create a new task in current project')
      .option('-p, --project <project-id>', 'Specify project ID (defaults to current project)')
      .action(this.createTask.bind(this));
    
    this.command('create-in <project-id> <title>')
      .description('Create a new task in specified project')
      .action(this.createTaskInProject.bind(this));
    
    this.command('comment <task-id> <message>')
      .description('Add comment to a task')
      .action(this.commentTask);
    
    this.command('switch [project-id]')
      .description('Interactively switch to a different task')
      .action(this.switchTask);
    
    this.command('read [task-id]')
      .alias('get')
      .description('Show detailed information about current task or specified task')
      .action(this.readTask);
    
    this.command('update [task-id]')
      .description('Update a task (status, title, description)')
      .action(this.updateTask.bind(this));
  }

  private async listTasks(projectId?: string) {
    render(React.createElement(TaskList, { projectId }));
  }

  private async createTask(title: string, options: { project?: string }) {
    try {
      const configManager = ConfigManager.getInstance();
      const config = await configManager.loadConfig();
      
      if (!config) {
        console.error('❌ No configuration found');
        return;
      }

      // Use project from option or current project
      const projectId = options.project || config.currentProjectId;
      
      if (!projectId) {
        console.error('❌ No project specified and no current project set.');
        console.error('   Use "devshed projects switch" to set a current project, or');
        console.error('   Use: devshed tasks create-in <project-id> "<title>"');
        return;
      }

      render(React.createElement(TaskCreator, { 
        title, 
        projectId, 
        onComplete: () => process.exit(0),
        onCancel: () => process.exit(0)
      }));
    } catch (error) {
      console.error(`❌ Error creating task: ${error}`);
    }
  }

  private async createTaskInProject(projectId: string, title: string) {
    try {
      render(React.createElement(TaskCreator, { 
        title, 
        projectId, 
        onComplete: () => process.exit(0),
        onCancel: () => process.exit(0)
      }));
    } catch (error) {
      console.error(`❌ Error creating task: ${error}`);
    }
  }


  private async commentTask(taskId: string, message: string) {
    console.log(`📝 Adding comment to task ${taskId}: ${message}`);
    console.log('Note: Comment functionality will be implemented in a future update.');
  }

  private async switchTask(projectId?: string) {
    render(React.createElement(TaskSelector, { projectId }));
  }

  private async readTask(taskId?: string) {
    render(React.createElement(TaskDetails, { taskId }));
  }

  private async updateTask(taskId?: string) {
    try {
      if (taskId) {
        // Task ID provided, go directly to update
        render(React.createElement(TaskUpdater, { 
          taskId, 
          onComplete: () => process.exit(0),
          onCancel: () => process.exit(0)
        }));
      } else {
        // No task ID provided, use current task or show selector
        const configManager = ConfigManager.getInstance();
        const config = await configManager.loadConfig();
        
        if (config?.currentTaskId) {
          // Use current task
          render(React.createElement(TaskUpdater, { 
            taskId: config.currentTaskId, 
            onComplete: () => process.exit(0),
            onCancel: () => process.exit(0)
          }));
        } else {
          // No current task, show task selector
          console.error('❌ No task specified and no current task set.');
          console.error('   Use "devshed tasks switch" to set a current task, or');
          console.error('   Use: devshed tasks update <task-id>');
        }
      }
    } catch (error) {
      console.error(`❌ Error updating task: ${error}`);
    }
  }
}