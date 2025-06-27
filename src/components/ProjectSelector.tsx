import React, { useEffect, useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { DevShedApiClient } from '../services/api.js';
import { ConfigManager } from '../utils/config.js';
import { Project } from '../types/index.js';
import { getUniqueKey, extractId } from '../utils/mongo.js';

export const ProjectSelector: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [switching, setSwitching] = useState(false);
  const { exit } = useApp();

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
          let projectsList: Project[] = [];
          
          if (Array.isArray(response.data)) {
            projectsList = response.data;
          } else if (response.data && typeof response.data === 'object') {
            const possibleArrays = ['projects', 'data', 'items', 'results'];
            let foundArray = null;
            
            for (const key of possibleArrays) {
              if (Array.isArray((response.data as any)[key])) {
                foundArray = (response.data as any)[key];
                break;
              }
            }
            
            if (foundArray) {
              projectsList = foundArray;
            } else {
              projectsList = [response.data as Project];
            }
          }
          
          setProjects(projectsList);
          
          // Set initial selection to current project if exists
          const configManager = ConfigManager.getInstance();
          const config = await configManager.loadConfig();
          if (config?.currentProjectId) {
            const currentIndex = projectsList.findIndex(p => 
              extractId(p._id) === config.currentProjectId || 
              extractId(p.id) === config.currentProjectId
            );
            if (currentIndex >= 0) {
              setSelectedIndex(currentIndex);
            }
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

  useInput((input, key) => {
    if (switching) return; // Ignore input while switching

    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(projects.length - 1, prev + 1));
    } else if (key.return) {
      handleSelectProject();
    } else if (key.escape || input === 'q') {
      exit();
    }
  });

  const handleSelectProject = async () => {
    if (switching || projects.length === 0) return;
    
    setSwitching(true);
    const selectedProject = projects[selectedIndex];
    const projectId = extractId(selectedProject._id) || extractId(selectedProject.id);
    
    if (!projectId) {
      console.error('❌ Unable to extract project ID');
      setSwitching(false);
      return;
    }

    try {
      const configManager = ConfigManager.getInstance();
      await configManager.updateCurrentProject(projectId);
      
      console.log('✅ Switched to project:');
      console.log(`   Name: ${selectedProject.name}`);
      console.log(`   ID: ${projectId}`);
      console.log(`   Status: ${selectedProject.status || 'Unknown'}`);
      
      exit();
    } catch (error) {
      console.error(`❌ Failed to switch project: ${error}`);
      setSwitching(false);
    }
  };

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
        <Text bold>No projects found</Text>
        <Text color="yellow">Create your first project with:</Text>
        <Text color="gray">devshed projects create "My Project"</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text bold>Select a project ({projects.length} available)</Text>
      <Text color="gray">Use ↑↓ to navigate, Enter to select, Esc/q to quit</Text>
      <Text> </Text>
      
      {projects.map((project, index) => {
        const isSelected = index === selectedIndex;
        const projectId = extractId(project._id) || extractId(project.id);
        
        return (
          <Box key={getUniqueKey(project, index, 'project')} marginLeft={2}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text color={isSelected ? 'cyan' : 'green'}>•</Text>
            <Text color={isSelected ? 'cyan' : 'white'}> {project.name}</Text>
            {project.status && (
              <Text color={isSelected ? 'cyan' : 'gray'}> ({project.status})</Text>
            )}
            {isSelected && (
              <Text color="blue"> [ID: {projectId}]</Text>
            )}
          </Box>
        );
      })}
      
      <Text> </Text>
      <Text color="gray">
        {switching ? 'Switching project...' : `${selectedIndex + 1}/${projects.length} selected`}
      </Text>
    </Box>
  );
};