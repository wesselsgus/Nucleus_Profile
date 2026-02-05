
export enum MenuState {
  MAIN = 'MAIN',
  JUMPHOSTS = 'JUMPHOSTS',
  SERVER_SCAN = 'SERVER_SCAN',
  WEB_SCAN = 'WEB_SCAN',
  EXECUTING = 'EXECUTING'
}

export interface TerminalLine {
  text: string;
  type: 'info' | 'error' | 'success' | 'command' | 'output';
  timestamp: string;
}

export interface Host {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  region: string;
}

export interface ScriptExecution {
  hostId: string;
  scriptName: string;
  status: 'running' | 'completed' | 'failed';
}
