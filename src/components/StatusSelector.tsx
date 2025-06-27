import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';

interface StatusOption {
  value: TaskStatus;
  label: string;
  color: string;
  description: string;
}

const statusOptions: StatusOption[] = [
  { value: 'todo', label: 'Todo', color: 'gray', description: 'Ready to start' },
  { value: 'in_progress', label: 'In Progress', color: 'yellow', description: 'Currently working on' },
  { value: 'blocked', label: 'Blocked', color: 'red', description: 'Cannot proceed' },
  { value: 'in_review', label: 'In Review', color: 'blue', description: 'Awaiting review' },
  { value: 'done', label: 'Done', color: 'green', description: 'Completed' }
];

interface StatusSelectorProps {
  onSelect: (status: TaskStatus) => void;
  onCancel?: () => void;
  title?: string;
  defaultStatus?: TaskStatus;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  onSelect, 
  onCancel, 
  title = 'Select Status',
  defaultStatus = 'todo'
}) => {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const index = statusOptions.findIndex(opt => opt.value === defaultStatus);
    return index >= 0 ? index : 0;
  });

  const { exit } = useApp();

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(statusOptions.length - 1, prev + 1));
    } else if (key.return) {
      const selectedStatus = statusOptions[selectedIndex];
      onSelect(selectedStatus.value);
    } else if (key.escape || input === 'q') {
      if (onCancel) {
        onCancel();
      } else {
        exit();
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Text color="gray">Use ↑↓ to navigate, Enter to select, Esc/q to cancel</Text>
      <Text> </Text>
      
      {statusOptions.map((option, index) => {
        const isSelected = index === selectedIndex;
        
        return (
          <Box key={option.value} marginLeft={2}>
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '▶ ' : '  '}
            </Text>
            <Text color={isSelected ? 'cyan' : option.color}>
              {option.label}
            </Text>
            <Text color={isSelected ? 'cyan' : 'gray'}>
              {' '}- {option.description}
            </Text>
          </Box>
        );
      })}
      
      <Text> </Text>
      <Text color="gray">
        Selected: {statusOptions[selectedIndex].label}
      </Text>
    </Box>
  );
};