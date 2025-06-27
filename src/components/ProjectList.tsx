import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { DevShedApiClient } from '../services/api.js';
import { Project } from '../types/index.js';
import { getUniqueKey } from '../utils/mongo.js';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const apiClient = await DevShedApiClient.createFromConfig();
        if (!apiClient) {
          setError('Failed to initialize API client');
          return;
        }

        const response = await apiClient.listProjects();
        if (response.success && response.data) {
          // Handle different response formats
          if (Array.isArray(response.data)) {
            setProjects(response.data);
          } else if (response.data && typeof response.data === 'object') {
            // If response.data is an object, check for common array properties
            const possibleArrays = ['projects', 'data', 'items', 'results'];
            let foundArray = null;
            
            for (const key of possibleArrays) {
              if (Array.isArray((response.data as any)[key])) {
                foundArray = (response.data as any)[key];
                break;
              }
            }
            
            if (foundArray) {
              setProjects(foundArray);
            } else {
              // If it's a single project object, wrap it in an array
              setProjects([response.data as Project]);
            }
          } else {
            setError('Invalid response format: expected array or object');
          }
        } else {
          setError(response.error || 'Failed to load projects');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  if (loading) {
    return <Text>Loading projects...</Text>;
  }

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">❌ Error loading projects:</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold>Projects</Text>
        <Text color="yellow">No projects found. Create your first project with:</Text>
        <Text color="gray">devshed projects create "My Project"</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Projects ({projects.length})</Text>
      {projects.map((project, index) => (
        <Box key={getUniqueKey(project, index, 'project')} marginLeft={2}>
          <Text color="green">•</Text>
          <Text> {project.name}</Text>
          {project.status && <Text color="gray"> ({project.status})</Text>}
        </Box>
      ))}
    </Box>
  );
};