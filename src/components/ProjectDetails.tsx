import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { DevShedApiClient } from '../services/api.js';
import { ConfigManager } from '../utils/config.js';
import { Project } from '../types/index.js';
import { extractId } from '../utils/mongo.js';

interface ProjectDetailsProps {
  projectId?: string;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentProject, setIsCurrentProject] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const configManager = ConfigManager.getInstance();
        const config = await configManager.loadConfig();
        
        if (!config) {
          setError('No configuration found');
          return;
        }

        // Determine which project to load
        let targetProjectId = projectId;
        if (!targetProjectId) {
          targetProjectId = config.currentProjectId;
          setIsCurrentProject(true);
        }

        if (!targetProjectId) {
          setError('No project ID specified and no current project set. Use "devshed context switch project <id>" to set a current project.');
          return;
        }

        const apiClient = await DevShedApiClient.createFromConfig();
        if (!apiClient) {
          setError('Failed to initialize API client');
          return;
        }

        const response = await apiClient.readProject(targetProjectId);
        if (response.success && response.data) {
          // Handle different response formats
          let projectData: Project;
          
          if (response.data && typeof response.data === 'object') {
            // Check if it's wrapped in a data property
            if ((response.data as any).data && typeof (response.data as any).data === 'object') {
              projectData = (response.data as any).data as Project;
            } else {
              projectData = response.data as Project;
            }
            
            setProject(projectData);
            
            // Check if this is the current project
            const projectIdFromData = extractId(projectData._id) || extractId(projectData.id);
            if (projectIdFromData === config.currentProjectId) {
              setIsCurrentProject(true);
            }
          } else {
            setError('Invalid response format');
          }
        } else {
          setError(response.error || 'Failed to load project');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  if (loading) {
    return <Text>Loading project details...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error loading project:</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (!project) {
    return <Text color="red">❌ Project not found</Text>;
  }

  const projectIdString = extractId(project._id) || extractId(project.id);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">Project Details</Text>
        {isCurrentProject && <Text color="green"> (Current)</Text>}
      </Box>
      
      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text bold>Name: </Text>
          <Text color="green">{project.name}</Text>
        </Box>
        
        <Box>
          <Text bold>ID: </Text>
          <Text color="blue">{projectIdString}</Text>
        </Box>

        {project.key && (
          <Box>
            <Text bold>Key: </Text>
            <Text color="yellow">{project.key}</Text>
          </Box>
        )}

        {project.status && (
          <Box>
            <Text bold>Status: </Text>
            <Text color={
              project.status === 'in-progress' ? 'yellow' :
              project.status === 'completed' ? 'green' :
              project.status === 'planning' ? 'blue' : 'gray'
            }>
              {project.status}
            </Text>
          </Box>
        )}

        {project.description && (
          <Box>
            <Text bold>Description: </Text>
            <Text>{project.description}</Text>
          </Box>
        )}

        {project.priority && (
          <Box>
            <Text bold>Priority: </Text>
            <Text color={
              project.priority === 'high' ? 'red' :
              project.priority === 'medium' ? 'yellow' : 'green'
            }>
              {project.priority}
            </Text>
          </Box>
        )}

        {project.start_date && (
          <Box>
            <Text bold>Start Date: </Text>
            <Text>{project.start_date}</Text>
          </Box>
        )}

        {project.end_date && (
          <Box>
            <Text bold>End Date: </Text>
            <Text>{project.end_date}</Text>
          </Box>
        )}

        {project.project_url && (
          <Box>
            <Text bold>URL: </Text>
            <Text color="blue">{project.project_url}</Text>
          </Box>
        )}

        {project.template && (
          <Box>
            <Text bold>Template: </Text>
            <Text>{project.template}</Text>
          </Box>
        )}

        {project.created_at && (
          <Box>
            <Text bold>Created: </Text>
            <Text color="gray">
              {typeof project.created_at === 'number' 
                ? new Date(project.created_at * 1000).toLocaleDateString()
                : project.created_at
              }
            </Text>
          </Box>
        )}

        {project.updated_at && (
          <Box>
            <Text bold>Updated: </Text>
            <Text color="gray">
              {typeof project.updated_at === 'number' 
                ? new Date(project.updated_at * 1000).toLocaleDateString()
                : project.updated_at
              }
            </Text>
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">
          Use "devshed tasks list" to see tasks for this project
        </Text>
      </Box>
    </Box>
  );
};