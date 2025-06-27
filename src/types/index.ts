export interface DevShedConfig {
  apiUrl: string;
  apiKey: string;
  userId: string;
  defaultOrganizationId: string;
  currentProjectId?: string;
  currentTaskId?: string;
  preferences?: {
    autoSaveContext?: boolean;
    showContextInPrompt?: boolean;
    contextPersistence?: 'session' | 'config' | 'session_and_config';
    defaultTaskView?: 'compact' | 'detailed';
  };
}

export interface Project {
  id?: string;
  _id?: any;
  name: string;
  description?: string;
  status?: string;
  key?: string;
  organizationId?: string;
  organization_id?: any;
  userId?: string;
  user_id?: any;
  createdAt?: string;
  created_at?: string | number;
  updatedAt?: string;
  updated_at?: string | number;
  priority?: string;
  project_url?: string;
  start_date?: string;
  end_date?: string;
  template?: string;
  tags?: any[];
  members?: any[];
  features?: any[];
  settings?: any;
  url?: string;
}

export interface Task {
  id?: string;
  _id?: any;
  title: string;
  description?: string;
  status?: string;
  assigneeId?: string;
  assignee_id?: any;
  projectId?: string;
  project_id?: any;
  createdAt?: string;
  created_at?: string | number;
  updatedAt?: string;
  updated_at?: string | number;
  userId?: string;
  user_id?: any;
  organizationId?: string;
  organization_id?: any;
  priority?: string;
  tags?: any[];
  due_date?: string;
  completed_at?: string | number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
}

export interface ContextState {
  organization?: Organization;
  project?: Project;
}