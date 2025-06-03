import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  TextField,
} from '@mui/material';
import { OutputProfile, DEFAULT_PROFILES, PumpCommand } from '../types';

interface OutputProfileControlProps {
  onCommand: (pumpId: number, command: PumpCommand) => void;
}

export const OutputProfileControl: React.FC<OutputProfileControlProps> = ({
  onCommand,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<OutputProfile | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const handleProfileChange = (event: any) => {
    const profile = DEFAULT_PROFILES.find(p => p.id === event.target.value);
    setSelectedProfile(profile || null);
    stopProfile();
  };

  const applyPhase = (phase: OutputProfile['parameters']['phases'][0]) => {
    // Send commands for both pumps
    onCommand(1, phase.pump1);
    onCommand(2, phase.pump2);
  };

  const startProfile = () => {
    if (!selectedProfile) return;

    setIsRunning(true);
    setCurrentPhase(0);
    
    // Apply initial phase
    applyPhase(selectedProfile.parameters.phases[0]);

    // Set up interval for phase transitions
    const id = setInterval(() => {
      setCurrentPhase(prev => {
        const nextPhase = (prev + 1) % selectedProfile!.parameters.phases.length;
        applyPhase(selectedProfile!.parameters.phases[nextPhase]);
        return nextPhase;
      });
    }, selectedProfile.parameters.interval * 1000);

    setIntervalId(id);
  };

  const stopProfile = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
    
    // Stop both pumps
    onCommand(1, { enable: false });
    onCommand(2, { enable: false });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return (
    <Card sx={{ minWidth: 275, margin: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Output Profile Control
        </Typography>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Profile</InputLabel>
            <Select
              value={selectedProfile?.id || ''}
              label="Select Profile"
              onChange={handleProfileChange}
              disabled={isRunning}
            >
              {DEFAULT_PROFILES.map((profile) => (
                <MenuItem key={profile.id} value={profile.id}>
                  {profile.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedProfile && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedProfile.description}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Interval: {selectedProfile.parameters.interval} seconds
              </Typography>
              {isRunning && (
                <Typography variant="body2">
                  Current Phase: {currentPhase + 1} of {selectedProfile.parameters.phases.length}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={startProfile}
                disabled={isRunning}
              >
                Start Profile
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={stopProfile}
                disabled={!isRunning}
              >
                Stop Profile
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 