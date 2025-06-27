import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { StatusSelector, TaskStatus } from './StatusSelector.js';
import { DevShedApiClient } from '../services/api.js';
import { ConfigManager } from '../utils/config.js';
import { Task } from '../types/index.js';
import { extractId } from '../utils/mongo.js';

interface TaskUpdaterProps {
  taskId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type UpdateMode = 'menu' | 'status' | 'title' | 'description';

interface UpdateOption {
  key: string;
  label: string;
  description: string;
  currentValue: string;
}

export const TaskUpdater: React.FC<TaskUpdaterProps> = ({ 
  taskId, 
  onComplete, 
  onCancel 
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<UpdateMode>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const { exit } = useApp();

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        const apiClient = await DevShedApiClient.createFromConfig();
        if (!apiClient) {
          setError('Failed to initialize API client');
          return;
        }

        const response = await apiClient.readTask(taskId);
        if (response.success && response.data) {
          // Handle different response formats
          let taskData = response.data;
          if ((response.data as any).data) {
            taskData = (response.data as any).data;
          }
          
          setTask(taskData as Task);
          setTitleInput((taskData as any).title || '');
          setDescriptionInput((taskData as any).description || '');
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
  }, [taskId]);

  const updateOptions: UpdateOption[] = [
    {
      key: 'status',
      label: 'Status',
      description: 'Change task status',
      currentValue: task?.status || 'unknown'
    },
    {
      key: 'title',
      label: 'Title',
      description: 'Update task title',
      currentValue: task?.title || ''
    },
    {
      key: 'description',
      label: 'Description',
      description: 'Update task description',
      currentValue: task?.description || 'No description'
    }
  ];

  const handleMenuInput = (input: string, key: any) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(updateOptions.length - 1, prev + 1));
    } else if (key.return) {
      const selectedOption = updateOptions[selectedIndex];
      if (selectedOption.key === 'status') {
        setMode('status');
      } else if (selectedOption.key === 'title') {
        setMode('title');
      } else if (selectedOption.key === 'description') {
        setMode('description');
      }
    } else if (key.escape || input === 'q') {
      onCancel();
    }
  };

  const handleTitleInput = (input: string, key: any) => {
    if (key.return) {
      handleUpdateTask('title', titleInput);
    } else if (key.escape) {
      setMode('menu');
    } else if (key.backspace || key.delete) {
      setTitleInput(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setTitleInput(prev => prev + input);
    }
  };

  const handleDescriptionInput = (input: string, key: any) => {
    if (key.return) {
      handleUpdateTask('description', descriptionInput);
    } else if (key.escape) {
      setMode('menu');
    } else if (key.backspace || key.delete) {
      setDescriptionInput(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setDescriptionInput(prev => prev + input);
    }
  };

  useInput((input, key) => {
    if (updating) return;
    
    if (mode === 'menu') {
      handleMenuInput(input, key);
    } else if (mode === 'title') {
      handleTitleInput(input, key);
    } else if (mode === 'description') {
      handleDescriptionInput(input, key);
    }
    // Status mode is handled by StatusSelector
  });

  const handleUpdateTask = async (field: string, value: string) => {
    if (!task) return;
    
    setUpdating(true);
    
    try {
      const apiClient = await DevShedApiClient.createFromConfig();
      if (!apiClient) {
        console.error('❌ Failed to initialize API client');
        onCancel();
        return;
      }

      const taskIdToUpdate = extractId(task._id) || extractId(task.id) || taskId;
      
      const updates: any = {};
      updates[field] = value;

      console.log(`Updating task ${field}...`);
      const response = await apiClient.updateTask(taskIdToUpdate, updates);
      
      if (response.success && response.data) {
        console.log(`✅ Task ${field} updated successfully!`);
        console.log(`   ${field}: ${value}`);
        onComplete();
      } else {
        console.error(`❌ Failed to update task: ${response.error}`);
        onCancel();
      }
    } catch (error) {
      console.error(`❌ Error updating task: ${error}`);
      onCancel();
    }
  };

  const handleStatusSelect = async (status: TaskStatus) => {
    await handleUpdateTask('status', status);
  };

  const handleStatusCancel = () => {
    setMode('menu');
  };

  if (loading) {
    return <Text>Loading task...</Text>;
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

  if (updating) {
    return <Text>Updating task...</Text>;
  }

  if (mode === 'status') {
    return (
      <Box flexDirection="column">
        <Text bold color="green">Update Task Status</Text>
        <Box marginLeft={2}>
          <Text>Task: </Text>
          <Text color="cyan">"{task.title}"</Text>
        </Box>
        <Text> </Text>
        
        <StatusSelector
          onSelect={handleStatusSelect}
          onCancel={handleStatusCancel}
          title="Choose new status:"
          defaultStatus={(task.status as TaskStatus) || 'todo'}
        />
      </Box>
    );
  }

  if (mode === 'title') {
    return (
      <Box flexDirection="column">
        <Text bold color="green">Update Task Title</Text>
        <Text color="gray">Current: "{task.title}"</Text>
        <Text> </Text>
        <Box>
          <Text>New title: </Text>
          <Text color="cyan">{titleInput}</Text>
          <Text color="gray">|</Text>
        </Box>
        <Text> </Text>
        <Text color="gray">Press Enter to save, Esc to cancel</Text>
      </Box>
    );
  }

  if (mode === 'description') {
    return (
      <Box flexDirection="column">
        <Text bold color="green">Update Task Description</Text>
        <Text color="gray">Current: "{task.description || 'No description'}"</Text>
        <Text> </Text>
        <Box>
          <Text>New description: </Text>
          <Text color="cyan">{descriptionInput}</Text>
          <Text color="gray">|</Text>
        </Box>
        <Text> </Text>
        <Text color="gray">Press Enter to save, Esc to cancel</Text>
      </Box>
    );
  }

  // Menu mode
  return (
    <Box flexDirection="column">
      <Text bold color="green">Update Task</Text>
      <Box marginLeft={2}>
        <Text>Task: </Text>
        <Text color="cyan">"{task.title}"</Text>
      </Box>
      <Box marginLeft={2}>
        <Text>ID: </Text>
        <Text color="blue">{extractId(task._id) || extractId(task.id)}</Text>
      </Box>
      <Text> </Text>
      
      <Text bold>What would you like to update?</Text>
      <Text color="gray">Use ↑↓ to navigate, Enter to select, Esc/q to cancel</Text>
      <Text> </Text>
      
      {updateOptions.map((option, index) => {
        const isSelected = index === selectedIndex;
        
        return (
          <Box key={option.key} marginLeft={2}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text color={isSelected ? 'cyan' : 'yellow'}>
              {option.label}
            </Text>
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {' '}- {option.description}
            </Text>
          </Box>
        );
      })}
      
      <Text> </Text>
      <Text color="gray">Current values:</Text>
      <Box marginLeft={2}>
        <Text color="gray">Status: </Text>
        <Text color={
          task.status === 'done' ? 'green' : 
          task.status === 'in_progress' ? 'yellow' : 'gray'
        }>{task.status || 'unknown'}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="gray">Title: </Text>
        <Text>{task.title}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text color="gray">Description: </Text>
        <Text>{task.description || 'No description'}</Text>
      </Box>
    </Box>
  );
};