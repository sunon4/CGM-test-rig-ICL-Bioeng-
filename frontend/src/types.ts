export interface PumpCommand {
  enable?: boolean;
  direction?: boolean;  // true = clockwise, false = counterclockwise
  rpm?: number;
  microstep?: number;
}

export interface PumpStatus {
  pump_id: number;
  enable: boolean;
  direction: boolean;
  rpm: number;
  microstep: number;
}

export interface WebSocketMessage {
  topic: string;
  payload: PumpStatus;
}

export interface OutputProfile {
  id: string;
  name: string;
  description: string;
  type: 'square-wave' | 'custom';  // Add more types as needed
  parameters: {
    interval: number;  // Time in seconds for each phase
    phases: {
      pump1: {
        enable: boolean;
        direction: boolean;
        rpm: number;
      };
      pump2: {
        enable: boolean;
        direction: boolean;
        rpm: number;
      };
    }[];
  };
}

export const DEFAULT_PROFILES: OutputProfile[] = [
  {
    id: 'alternating-square',
    name: 'Alternating Square Wave',
    description: 'Alternates between pumps with square wave pattern',
    type: 'square-wave',
    parameters: {
      interval: 5,
      phases: [
        {
          pump1: { enable: true, direction: true, rpm: 100 },
          pump2: { enable: false, direction: true, rpm: 0 }
        },
        {
          pump1: { enable: false, direction: true, rpm: 0 },
          pump2: { enable: true, direction: true, rpm: 100 }
        }
      ]
    }
  }
]; 