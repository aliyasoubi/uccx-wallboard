export interface AgentDto {
  id: string;
  name: string;
  state: AgentStateDto;
  stateStats: AgentStateStatsDto;
  inboundCallStats: AgentInboundCallStatsDto;
  outboundCallStats: AgentOutboundCallStatsDto;
}

export interface AgentStateDto {
  state: 'Ready' | 'Talking' | 'Not Ready';
  duration: number; // seconds
  reason: string;
}

export interface AgentStateStatsDto {
  logonDuration: number;

  totalReadyDuration: number;
  maxReadyDuration: number;
  avgReadyDuration: number;

  totalNotReadyDuration: number;
  maxNotReadyDuration: number;
  avgNotReadyDuration: number;
}

export interface AgentInboundCallStatsDto {
  totalTalkDuration: number;
  avgTalkDuration: number;
  maxTalkDuration: number;

  totalHoldDuration: number;
  avgHoldDuration: number;
  maxHoldDuration: number;

  totalWorkDuration: number;
  avgWorkDuration: number;
  maxWorkDuration: number;

  totalCalls: number;
  handledCalls: number;
  abandonedCalls: number;
}

export interface AgentOutboundCallStatsDto {
  totalTalkDuration: number;
  avgTalkDuration: number;
  maxTalkDuration: number;

  totalCalls: number;
}
