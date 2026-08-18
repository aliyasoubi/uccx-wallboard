import { mapAgent, mapAgents } from './agent.mapper';
import { AgentDto } from '../models/dto';
import { AgentStatus } from '../models/domain';

function buildAgentDto(overrides: Partial<AgentDto> = {}): AgentDto {
  return {
    id: 'A1001',
    name: 'John Smith',
    state: { state: 'Ready', duration: 1240, reason: '' },
    stateStats: {
      logonDuration: 14400,
      totalReadyDuration: 9600,
      maxReadyDuration: 1800,
      avgReadyDuration: 960,
      totalNotReadyDuration: 2400,
      maxNotReadyDuration: 900,
      avgNotReadyDuration: 480,
    },
    inboundCallStats: {
      totalTalkDuration: 6240,
      avgTalkDuration: 312,
      maxTalkDuration: 900,
      totalHoldDuration: 420,
      avgHoldDuration: 21,
      maxHoldDuration: 120,
      totalWorkDuration: 960,
      avgWorkDuration: 48,
      maxWorkDuration: 180,
      totalCalls: 20,
      handledCalls: 19,
      abandonedCalls: 1,
    },
    outboundCallStats: { totalTalkDuration: 1800, avgTalkDuration: 300, maxTalkDuration: 540, totalCalls: 6 },
    ...overrides,
  };
}

describe('agent.mapper', () => {
  it('maps identity fields straight through', () => {
    const agent = mapAgent(buildAgentDto());
    expect(agent.id).toBe('A1001');
    expect(agent.name).toBe('John Smith');
  });

  it('maps each raw DTO state to the canonical AgentStatus enum', () => {
    expect(mapAgent(buildAgentDto({ state: { state: 'Ready', duration: 1, reason: '' } })).status).toBe(
      AgentStatus.Ready,
    );
    expect(mapAgent(buildAgentDto({ state: { state: 'Talking', duration: 1, reason: '' } })).status).toBe(
      AgentStatus.Talking,
    );
    expect(mapAgent(buildAgentDto({ state: { state: 'Not Ready', duration: 1, reason: '' } })).status).toBe(
      AgentStatus.NotReady,
    );
  });

  it('maps the state duration and normalizes an empty reason to null', () => {
    const agent = mapAgent(buildAgentDto({ state: { state: 'Ready', duration: 42, reason: '' } }));
    expect(agent.statusDurationSeconds).toBe(42);
    expect(agent.reason).toBeNull();
  });

  it('preserves a non-empty reason', () => {
    const agent = mapAgent(buildAgentDto({ state: { state: 'Not Ready', duration: 42, reason: 'Break' } }));
    expect(agent.reason).toBe('Break');
  });

  it('maps inbound and outbound call totals (previously silently dropped by the old mapper)', () => {
    const agent = mapAgent(
      buildAgentDto({
        inboundCallStats: {
          ...buildAgentDto().inboundCallStats,
          totalCalls: 28,
        },
        outboundCallStats: { ...buildAgentDto().outboundCallStats, totalCalls: 8 },
      }),
    );
    expect(agent.inboundCalls).toBe(28);
    expect(agent.outboundCalls).toBe(8);
  });

  it('maps a full roster array in order', () => {
    const dtos = [buildAgentDto({ id: 'A1' }), buildAgentDto({ id: 'A2' }), buildAgentDto({ id: 'A3' })];
    const agents = mapAgents(dtos);
    expect(agents.map((a) => a.id)).toEqual(['A1', 'A2', 'A3']);
  });

  it('maps an empty roster to an empty array', () => {
    expect(mapAgents([])).toEqual([]);
  });

  // Regression guard: AgentStateDto['state'] is a closed TS union at compile
  // time, but the BFF is under no obligation to actually only ever send one
  // of those three strings at runtime (UCCX reports several states this
  // board has no dedicated bucket for — Reserved, Work, Logout, ...). Before
  // this fallback existed, an unrecognized value made STATUS_MAP[...] return
  // undefined, which every downstream consumer (severity checks, status
  // badge/visual lookups) expects to never see.
  it('falls back to Not Ready, not undefined, for a state string outside the known union', () => {
    spyOn(console, 'warn');
    // Cast bypasses the compile-time union deliberately — this simulates
    // exactly the runtime payload the union can't actually prevent.
    const agent = mapAgent(
      buildAgentDto({ state: { state: 'Reserved' as AgentDto['state']['state'], duration: 12, reason: '' } }),
    );
    expect(agent.status).toBe(AgentStatus.NotReady);
  });

  it('surfaces the raw unrecognized state string as the reason when the DTO gave no reason of its own', () => {
    spyOn(console, 'warn');
    const agent = mapAgent(
      buildAgentDto({ state: { state: 'Reserved' as AgentDto['state']['state'], duration: 12, reason: '' } }),
    );
    expect(agent.reason).toBe('Reserved');
  });

  it('keeps a genuine DTO reason over the raw state string for an unrecognized state', () => {
    spyOn(console, 'warn');
    const agent = mapAgent(
      buildAgentDto({
        state: { state: 'Work' as AgentDto['state']['state'], duration: 12, reason: 'Wrap-up' },
      }),
    );
    expect(agent.reason).toBe('Wrap-up');
  });
});
