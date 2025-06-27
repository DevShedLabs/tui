import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { ConfigManager } from '../utils/config.js';
import { DevShedConfig } from '../types/index.js';

export const ContextDisplay: React.FC = () => {
  const [config, setConfig] = useState<DevShedConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configManager = ConfigManager.getInstance();
        const loadedConfig = await configManager.loadConfig();
        setConfig(loadedConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return <Text>Loading configuration...</Text>;
  }

  if (!config) {
    return <Text color="red">❌ No configuration found</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text bold>Current Context</Text>
      <Box marginLeft={2}>
        <Text>API URL: </Text>
        <Text color="blue">{config.apiUrl}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text>User ID: </Text>
        <Text color="green">{config.userId}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text>Organization: </Text>
        <Text color="green">{config.defaultOrganizationId}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text>Current Project: </Text>
        <Text color={config.currentProjectId ? "green" : "yellow"}>
          {config.currentProjectId || "None set"}
        </Text>
      </Box>
      <Box marginLeft={2}>
        <Text>Current Task: </Text>
        <Text color={config.currentTaskId ? "green" : "yellow"}>
          {config.currentTaskId || "None set"}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Config: {ConfigManager.getInstance().getConfigPath()}</Text>
      </Box>
    </Box>
  );
};