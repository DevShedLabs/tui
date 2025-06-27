import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { DevShedApiClient } from '../services/api.js';
import { ConfigManager } from '../utils/config.js';
import { Task } from '../types/index.js';
import { extractId } from '../utils/mongo.js';

interface TaskDetailsProps {
  taskId?: string;
  projectId?: string;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({ taskId, projectId }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentTask, setIsCurrentTask] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const configManager = ConfigManager.getInstance();
        const config = await configManager.loadConfig();
        
        if (!config) {
          setError('No configuration found');
          return;
        }

        // Determine which task to load
        let targetTaskId = taskId;
        let targetProjectId = projectId;
        
        if (!targetTaskId) {
          targetTaskId = config.currentTaskId;
          setIsCurrentTask(true);
        }

        if (!targetProjectId) {
          targetProjectId = config.currentProjectId;
        }

        if (!targetTaskId) {
          setError('No task ID specified and no current task set. Use "devshed tasks switch" to set a current task.');
          return;
        }

        if (!targetProjectId) {
          setError('No project ID specified and no current project set. Use "devshed projects switch" to set a current project.');
          return;
        }

        const apiClient = await DevShedApiClient.createFromConfig();
        if (!apiClient) {
          setError('Failed to initialize API client');
          return;
        }

        const response = await apiClient.readTask(targetTaskId, targetProjectId);
        if (response.success && response.data) {
          // Handle different response formats
          let taskData: Task;
          
          if (response.data && typeof response.data === 'object') {
            // Check if it's wrapped in a data property
            if ((response.data as any).data && typeof (response.data as any).data === 'object') {
              taskData = (response.data as any).data as Task;
            } else {
              taskData = response.data as Task;
            }
            
            setTask(taskData);
            
            // Check if this is the current task
            const taskIdFromData = extractId(taskData._id) || extractId(taskData.id);
            if (taskIdFromData === config.currentTaskId) {
              setIsCurrentTask(true);
            }
          } else {
            setError('Invalid response format');
          }
        } else {
          setError(response.error || 'Failed to load task');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId, projectId]);

  if (loading) {
    return <Text>Loading task details...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error loading task:</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (!task) {
    return <Text color="red">❌ Task not found</Text>;
  }

  const taskIdString = extractId(task._id) || extractId(task.id);
  const projectIdString = extractId(task.project_id) || extractId(task.projectId);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">Task Details</Text>
        {isCurrentTask && <Text color="green"> (Current)</Text>}
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text bold>Title: </Text>
          <Text color="green">{task.title}</Text>
        </Box>
        
        <Box>
          <Text bold>ID: </Text>
          <Text color="blue">{taskIdString}</Text>
        </Box>

        <Box>
          <Text bold>Project ID: </Text>
          <Text color="blue">{projectIdString}</Text>
        </Box>

        {task.status && (
          <Box>
            <Text bold>Status: </Text>
            <Text color={
              task.status === 'done' ? 'green' :
              task.status === 'in_progress' ? 'yellow' :
              task.status === 'blocked' ? 'red' : 'gray'
            }>
              {task.status}
            </Text>
          </Box>
        )}

        {task.description && (
          <Box>
            <Text bold>Description: </Text>
            <Text>{task.description}</Text>
          </Box>
        )}

        {task.priority && (
          <Box>
            <Text bold>Priority: </Text>
            <Text color={
              task.priority === 'high' ? 'red' :
              task.priority === 'medium' ? 'yellow' : 'green'
            }>
              {task.priority}
            </Text>
          </Box>
        )}

        {task.assignee_id && (
          <Box>
            <Text bold>Assignee: </Text>
            <Text color="blue">{extractId(task.assignee_id) || task.assignee_id}</Text>
          </Box>
        )}

        {task.due_date && (
          <Box>
            <Text bold>Due Date: </Text>
            <Text>{task.due_date}</Text>
          </Box>
        )}

        {task.created_at && (
          <Box>
            <Text bold>Created: </Text>
            <Text color="gray">
              {typeof task.created_at === 'number' 
                ? new Date(task.created_at * 1000).toLocaleDateString()
                : task.created_at
              }
            </Text>
          </Box>
        )}

        {task.updated_at && (
          <Box>
            <Text bold>Updated: </Text>
            <Text color="gray">
              {typeof task.updated_at === 'number' 
                ? new Date(task.updated_at * 1000).toLocaleDateString()
                : task.updated_at
              }
            </Text>
          </Box>
        )}

        {task.completed_at && (
          <Box>
            <Text bold>Completed: </Text>
            <Text color="green">
              {typeof task.completed_at === 'number' 
                ? new Date(task.completed_at * 1000).toLocaleDateString()
                : task.completed_at
              }
            </Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          Use "devshed tasks switch" to select a different task
        </Text>
      </Box>
    </Box>
  );
};