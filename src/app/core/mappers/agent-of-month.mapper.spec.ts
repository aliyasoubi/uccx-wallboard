import { mapAgentOfMonth } from './agent-of-month.mapper';
import { Agent, AgentStatus } from '../models/domain';

function buildAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'A1002',
    name: 'Sarah Johnson',
    status: AgentStatus.Ready,
    statusDurationSeconds: 0,
    reason: null,
    inboundCalls: 0,
    outboundCalls: 0,
    ...overrides,
  };
}

describe('agent-of-month.mapper', () => {
  it('cross-references the roster by agentID to resolve the display name', () => {
    const agents = [
      buildAgent({ id: 'A1001', name: 'John Smith' }),
      buildAgent({ id: 'A1002', name: 'Sarah Johnson' }),
    ];
    const result = mapAgentOfMonth({ agentID: 'A1002', photoUrl: '' }, agents);
    expect(result.agentId).toBe('A1002');
    expect(result.name).toBe('Sarah Johnson');
  });

  it('resolves name to null when the agent id has no roster match', () => {
    const result = mapAgentOfMonth({ agentID: 'A9999', photoUrl: '' }, [buildAgent()]);
    expect(result.name).toBeNull();
  });

  it('normalizes an empty photoUrl to null so the UI can show a defined fallback', () => {
    const result = mapAgentOfMonth({ agentID: 'A1002', photoUrl: '' }, [buildAgent()]);
    expect(result.photoUrl).toBeNull();
  });

  it('preserves a non-empty photoUrl', () => {
    const result = mapAgentOfMonth({ agentID: 'A1002', photoUrl: 'https://example.com/a.jpg' }, [
      buildAgent(),
    ]);
    expect(result.photoUrl).toBe('https://example.com/a.jpg');
  });
});
