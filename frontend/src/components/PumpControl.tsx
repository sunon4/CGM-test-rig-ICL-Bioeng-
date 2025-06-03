import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  Slider,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import { PumpCommand } from '../types';

interface PumpControlProps {
  pumpId: number;
  onCommand: (command: PumpCommand) => void;
  enabled?: boolean;
  direction?: boolean;
  rpm?: number;
  microstep?: number;
}

const microstepOptions = [
  { value: 0, label: 'Full Step' },
  { value: 1, label: 'Half Step' },
  { value: 2, label: '1/4 Step' },
  { value: 3, label: '1/8 Step' },
  { value: 4, label: '1/16 Step' },
];

export const PumpControl: React.FC<PumpControlProps> = ({
  pumpId,
  onCommand,
  enabled = false,
  direction = true,
  rpm = 0,
  microstep = 0,
}) => {
  const handleEnableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCommand({ enable: event.target.checked });
  };

  const handleDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onCommand({ direction: event.target.checked });
  };

  const handleRpmChange = (_event: Event, value: number | number[]) => {
    onCommand({ rpm: value as number });
  };

  const handleMicrostepChange = (event: any) => {
    onCommand({ microstep: event.target.value });
  };

  return (
    <Card sx={{ minWidth: 275, margin: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Pump {pumpId}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={handleEnableChange}
                color="primary"
              />
            }
            label="Enable"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={direction}
                onChange={handleDirectionChange}
                color="primary"
              />
            }
            label={direction ? "Clockwise" : "Counter-clockwise"}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Speed (RPM)</Typography>
          <Slider
            value={rpm}
            onChange={handleRpmChange}
            min={0}
            max={200}
            valueLabelDisplay="auto"
            disabled={!enabled}
          />
        </Box>

        <FormControl fullWidth>
          <InputLabel>Microstepping</InputLabel>
          <Select
            value={microstep}
            label="Microstepping"
            onChange={handleMicrostepChange}
            disabled={!enabled}
          >
            {microstepOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </CardContent>
    </Card>
  );
}; 