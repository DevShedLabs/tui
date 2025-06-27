import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { DevShedApiClient } from '../services/api.js';
import { ConfigManager } from '../utils/config.js';
import { Task } from '../types/index.js';
import { getUniqueKey, extractId } from '../utils/mongo.js';

interface TaskSelectorProps {
  projectId?: string;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const { exit } = useApp();

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const configManager = ConfigManager.getInstance();
        const config = await configManager.loadConfig();
        
        if (!config) {
          setError('No configuration found');
          return;
        }

        const targetProjectId = projectId || config.currentProjectId;
        if (!targetProjectId) {
          setError('No project specified and no current project set. Use "devshed projects switch" to set a current project.');
          return;
        }

        const apiClient = await DevShedApiClient.createFromConfig();
        if (!apiClient) {
          setError('Failed to initialize API client');
          return;
        }

        // Get project name for display
        try {
          const projectResponse = await apiClient.readProject(targetProjectId);
          if (projectResponse.success && projectResponse.data) {
            let projectData = projectResponse.data;
            if ((projectData as any).data) {
              projectData = (projectData as any).data;
            }
            setCurrentProjectName((projectData as any).name || targetProjectId);
          }
        } catch {
          setCurrentProjectName(targetProjectId);
        }

        const response = await apiClient.listTasks(targetProjectId);
        if (response.success && response.data) {
          // Handle different response formats (same logic as TaskList)
          let tasksList: Task[] = [];
          
          if (Array.isArray(response.data)) {
            tasksList = response.data;
          } else if (response.data && typeof response.data === 'object') {
            const possibleArrays = ['tasks', 'data', 'items', 'results'];
            let foundArray = null;
            
            for (const key of possibleArrays) {
              if (Array.isArray((response.data as any)[key])) {
                foundArray = (response.data as any)[key];
                break;
              }
            }
            
            if (foundArray) {
              tasksList = foundArray;
            } else {
              tasksList = [response.data as Task];
            }
          }
          
          setTasks(tasksList);
          
          // Set initial selection to current task if exists
          if (config?.currentTaskId && tasksList.length > 0) {
            const currentIndex = tasksList.findIndex(t => 
              extractId(t._id) === config.currentTaskId || 
              extractId(t.id) === config.currentTaskId
            );
            if (currentIndex >= 0) {
              setSelectedIndex(currentIndex);
            }
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

  // Handle empty tasks case - this useEffect must always be called
  const hasNoTasks = tasks.length === 0 && !loading && !error;
  
  useEffect(() => {
    if (hasNoTasks) {
      const timer = setTimeout(() => {
        console.log(`📋 No tasks found for ${currentProjectName}`);
        console.log('💡 Create your first task with:');
        console.log(`   devshed tasks create ${projectId || '<project-id>'} "My Task"`);
        exit();
      }, 1500); // Show message for 1.5 seconds then exit

      return () => clearTimeout(timer);
    }
  }, [hasNoTasks, currentProjectName, projectId, exit]);

  useInput((input, key) => {
    if (switching) return; // Ignore input while switching

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(tasks.length - 1, prev + 1));
    } else if (key.return) {
      handleSelectTask();
    } else if (key.escape || input === 'q') {
      exit();
    } else if (input === 'c') {
      handleClearCurrentTask();
    }
  });

  const handleSelectTask = async () => {
    if (switching || tasks.length === 0) return;
    
    setSwitching(true);
    const selectedTask = tasks[selectedIndex];
    const taskId = extractId(selectedTask._id) || extractId(selectedTask.id);
    
    if (!taskId) {
      console.error('❌ Unable to extract task ID');
      setSwitching(false);
      return;
    }

    try {
      const configManager = ConfigManager.getInstance();
      await configManager.updateCurrentTask(taskId);
      
      console.log('✅ Switched to task:');
      console.log(`   Title: ${selectedTask.title}`);
      console.log(`   ID: ${taskId}`);
      console.log(`   Status: ${selectedTask.status || 'Unknown'}`);
      
      exit();
    } catch (error) {
      console.error(`❌ Failed to switch task: ${error}`);
      setSwitching(false);
    }
  };

  const handleClearCurrentTask = async () => {
    if (switching) return;
    
    setSwitching(true);
    try {
      const configManager = ConfigManager.getInstance();
      await configManager.clearCurrentTask();
      
      console.log('✅ Cleared current task');
      exit();
    } catch (error) {
      console.error(`❌ Failed to clear current task: ${error}`);
      setSwitching(false);
    }
  };

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

  if (hasNoTasks) {
    return (
      <Box flexDirection="column">
        <Text bold>No tasks found for {currentProjectName}</Text>
        <Text color="yellow">Create your first task with:</Text>
        <Text color="gray">devshed tasks create {projectId || '<project-id>'} "My Task"</Text>
        <Text color="gray" dimColor>Exiting in a moment...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Select a task from {currentProjectName} ({tasks.length} available)</Text>
      <Text color="gray">Use ↑↓ to navigate, Enter to select, 'c' to clear current task, Esc/q to quit</Text>
      <Text> </Text>
      
      {tasks.map((task, index) => {
        const isSelected = index === selectedIndex;
        const taskId = extractId(task._id) || extractId(task.id);
        
        return (
          <Box key={getUniqueKey(task, index, 'task')} marginLeft={2}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text color={isSelected ? 'cyan' : 'blue'}>•</Text>
            <Text color={isSelected ? 'cyan' : 'white'}> {task.title}</Text>
            {task.status && (
              <Text color={
                isSelected ? 'cyan' : 
                task.status === 'done' ? 'green' : 
                task.status === 'in_progress' ? 'yellow' : 'gray'
              }> ({task.status})</Text>
            )}
            {isSelected && (
              <Text color="blue"> [ID: {taskId}]</Text>
            )}
          </Box>
        );
      })}
      
      <Text> </Text>
      <Text color="gray">
        {switching ? 'Switching task...' : `${selectedIndex + 1}/${tasks.length} selected`}
      </Text>
    </Box>
  );
};