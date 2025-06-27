import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { StatusSelector, TaskStatus } from './StatusSelector.js';
import { DevShedApiClient } from '../services/api.js';
import { ConfigManager } from '../utils/config.js';
import { extractId } from '../utils/mongo.js';

interface TaskCreatorProps {
  title: string;
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const TaskCreator: React.FC<TaskCreatorProps> = ({ 
  title, 
  projectId, 
  onComplete, 
  onCancel 
}) => {
  const [creating, setCreating] = useState(false);

  const handleStatusSelect = async (status: TaskStatus) => {
    setCreating(true);
    
    try {
      const apiClient = await DevShedApiClient.createFromConfig();
      if (!apiClient) {
        console.error('❌ Failed to initialize API client');
        onCancel();
        return;
      }

      console.log(`Creating task "${title}" with status "${status}" in project ${projectId}...`);
      const response = await apiClient.createTask({ title, projectId, status });
      
      if (response.success && response.data) {
        // Handle different response formats
        let taskData = response.data;
        if ((response.data as any).data) {
          taskData = (response.data as any).data;
        }
        
        const taskId = extractId((taskData as any)._id) || extractId((taskData as any).id);
        const taskTitle = (taskData as any).title;
        const taskStatus = (taskData as any).status;
        const taskProjectId = extractId((taskData as any).project_id) || extractId((taskData as any).projectId);
        
        console.log(`✅ Task created successfully!`);
        console.log(`   ID: ${taskId}`);
        console.log(`   Title: ${taskTitle}`);
        console.log(`   Status: ${taskStatus}`);
        console.log(`   Project: ${taskProjectId}`);
        
        onComplete();
      } else {
        console.error(`❌ Failed to create task: ${response.error}`);
        onCancel();
      }
    } catch (error) {
      console.error(`❌ Error creating task: ${error}`);
      onCancel();
    }
  };

  if (creating) {
    return <Text>Creating task...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold color="green">Creating Task</Text>
      <Box marginLeft={2}>
        <Text>Title: </Text>
        <Text color="cyan">"{title}"</Text>
      </Box>
      <Box marginLeft={2}>
        <Text>Project: </Text>
        <Text color="blue">{projectId}</Text>
      </Box>
      <Text> </Text>
      
      <StatusSelector
        onSelect={handleStatusSelect}
        onCancel={onCancel}
        title="Choose initial status:"
        defaultStatus="todo"
      />
    </Box>
  );
};