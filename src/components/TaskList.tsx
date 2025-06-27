import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { DevShedApiClient } from '../services/api.js';
import { Task } from '../types/index.js';
import { getUniqueKey } from '../utils/mongo.js';

interface TaskListProps {
  projectId?: string;
}

export const TaskList: React.FC<TaskListProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const apiClient = await DevShedApiClient.createFromConfig();
        if (!apiClient) {
          setError('Failed to initialize API client');
          return;
        }

        const response = await apiClient.listTasks(projectId);
        if (response.success && response.data) {
          // Handle different response formats (same logic as ProjectList)
          if (Array.isArray(response.data)) {
            setTasks(response.data);
          } else if (response.data && typeof response.data === 'object') {
            // If response.data is an object, check for common array properties
            const possibleArrays = ['tasks', 'data', 'items', 'results'];
            let foundArray = null;
            
            for (const key of possibleArrays) {
              if (Array.isArray((response.data as any)[key])) {
                foundArray = (response.data as any)[key];
                break;
              }
            }
            
            if (foundArray) {
              setTasks(foundArray);
            } else {
              // If it's a single task object, wrap it in an array
              setTasks([response.data as Task]);
            }
          } else {
            setError('Invalid response format: expected array or object');
          }
        } else {
          setError(response.error || 'Failed to load tasks');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [projectId]);

  if (loading) {
    return <Text>Loading tasks...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error loading tasks:</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  const displayProjectId = projectId || 'current project';

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold>Tasks for {displayProjectId}</Text>
        <Text color="yellow">No tasks found. Create your first task with:</Text>
        <Text color="gray">devshed tasks create {projectId || '<project-id>'} "My Task"</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Tasks for {displayProjectId} ({tasks.length})</Text>
      {tasks.map((task, index) => (
        <Box key={getUniqueKey(task, index, 'task')} marginLeft={2}>
          <Text color="blue">•</Text>
          <Text> {task.title}</Text>
          {task.status && (
            <Text color={task.status === 'done' ? 'green' : task.status === 'in_progress' ? 'yellow' : 'gray'}>
              {' '}({task.status})
            </Text>
          )}
        </Box>
      ))}
    </Box>
  );
};