import React, { useState, useCallback, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { Container, AppBar, Toolbar, Typography, Grid, Alert, Box, Tab, Tabs } from '@mui/material';
import { PumpControl } from './components/PumpControl';
import { OutputProfileControl } from './components/OutputProfileControl';
import { PumpCommand, WebSocketMessage, PumpStatus } from './types';

const WS_URL = `ws://${window.location.host}/ws`;
const API_URL = `http://${window.location.host}/api`;

interface PumpState {
  [key: number]: PumpStatus;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function App() {
  const [pumpStates, setPumpStates] = useState<PumpState>({
    1: { pump_id: 1, enable: false, direction: true, rpm: 0, microstep: 0 },
    2: { pump_id: 2, enable: false, direction: true, rpm: 0, microstep: 0 },
  });

  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  const { lastMessage } = useWebSocket(WS_URL, {
    onError: () => setError('WebSocket connection error'),
    onOpen: () => setError(null),
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if (lastMessage) {
      try {
        const message: WebSocketMessage = JSON.parse(lastMessage.data);
        const pumpId = parseInt(message.topic.split('/')[1]);
        setPumpStates((prev) => ({
          ...prev,
          [pumpId]: message.payload,
        }));
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    }
  }, [lastMessage]);

  const handleCommand = useCallback(async (pumpId: number, command: PumpCommand) => {
    try {
      const response = await fetch(`${API_URL}/pump/${pumpId}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optimistically update the state
      setPumpStates((prev) => ({
        ...prev,
        [pumpId]: { ...prev[pumpId], ...command },
      }));
    } catch (err) {
      setError(`Failed to send command: ${err}`);
      console.error('Error sending command:', err);
    }
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Pump Control System
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="pump control tabs">
            <Tab label="Manual Control" />
            <Tab label="Output Profiles" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={2}>
            {Object.values(pumpStates).map((state) => (
              <Grid item xs={12} md={6} key={state.pump_id}>
                <PumpControl
                  pumpId={state.pump_id}
                  enabled={state.enable}
                  direction={state.direction}
                  rpm={state.rpm}
                  microstep={state.microstep}
                  onCommand={(command) => handleCommand(state.pump_id, command)}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <OutputProfileControl onCommand={handleCommand} />
        </TabPanel>
      </Container>
    </>
  );
} 