import { ConfigManager } from '../utils/config.js';
import { Project, Task, DevShedConfig } from '../types/index.js';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

export interface TaskCreateRequest {
  title: string;
  description?: string;
  projectId: string;
  status?: string;
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: string;
  assigneeId?: string;
}

export class DevShedApiClient {
  private config: DevShedConfig;
  private baseUrl: string;

  constructor(config: DevShedConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
  }

  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/${endpoint}`;
      const headers: Record<string, string> = {
        'X-API-KEY': this.config.apiKey,
        'Content-Type': 'application/json'
      };

      const requestOptions: RequestInit = {
        method,
        headers
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private getBaseRequestBody() {
    return {
      user_id: this.config.userId,
      organization_id: this.config.defaultOrganizationId
    };
  }

  // Project API Methods
  async listProjects(): Promise<ApiResponse<Project[]>> {
    const body = this.getBaseRequestBody();
    return this.makeRequest<Project[]>('projects/list', 'POST', body);
  }

  async createProject(request: ProjectCreateRequest): Promise<ApiResponse<Project>> {
    const body = {
      ...this.getBaseRequestBody(),
      name: request.name,
      description: request.description || ''
    };
    return this.makeRequest<Project>('projects/create', 'POST', body);
  }

  async readProject(projectId: string): Promise<ApiResponse<Project>> {
    const body = {
      ...this.getBaseRequestBody(),
      id: projectId
    };
    return this.makeRequest<Project>('projects/read', 'POST', body);
  }

  async updateProject(projectId: string, updates: Partial<ProjectCreateRequest>): Promise<ApiResponse<Project>> {
    const body = {
      ...this.getBaseRequestBody(),
      id: projectId,
      ...updates
    };
    return this.makeRequest<Project>('projects/update', 'POST', body);
  }

  // Task API Methods
  async listTasks(projectId?: string): Promise<ApiResponse<Task[]>> {
    const body = {
      ...this.getBaseRequestBody(),
      project_id: projectId || this.config.currentProjectId
    };

    if (!body.project_id) {
      return {
        success: false,
        error: 'No project ID specified. Use "devshed context switch project <id>" to set a current project.'
      };
    }

    return this.makeRequest<Task[]>('tasks/list', 'POST', body);
  }

  async createTask(request: TaskCreateRequest): Promise<ApiResponse<Task>> {
    const body = {
      ...this.getBaseRequestBody(),
      project_id: request.projectId,
      title: request.title,
      description: request.description || '',
      status: request.status || 'todo'
    };
    return this.makeRequest<Task>('tasks/create', 'POST', body);
  }

  async readTask(taskId: string, projectId?: string): Promise<ApiResponse<Task>> {
    const body = {
      ...this.getBaseRequestBody(),
      project_id: projectId || this.config.currentProjectId,
      id: taskId
    };

    if (!body.project_id) {
      return {
        success: false,
        error: 'No project ID specified. Use "devshed context switch project <id>" to set a current project.'
      };
    }

    return this.makeRequest<Task>('tasks/read', 'POST', body);
  }

  async updateTask(taskId: string, updates: TaskUpdateRequest, projectId?: string): Promise<ApiResponse<Task>> {
    const body = {
      ...this.getBaseRequestBody(),
      project_id: projectId || this.config.currentProjectId,
      id: taskId,
      ...updates
    };

    if (!body.project_id) {
      return {
        success: false,
        error: 'No project ID specified. Use "devshed context switch project <id>" to set a current project.'
      };
    }

    return this.makeRequest<Task>('tasks/update', 'POST', body);
  }

  // Utility method to refresh config
  static async createFromConfig(): Promise<DevShedApiClient | null> {
    const configManager = ConfigManager.getInstance();
    const config = await configManager.loadConfig();
    
    if (!config) {
      return null;
    }

    return new DevShedApiClient(config);
  }
}