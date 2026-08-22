import { mapAgentsOfMonth } from './agent-of-month.mapper';
import { AgentOfMonthDto } from '../models/dto';

function buildDto(overrides: Partial<AgentOfMonthDto> = {}): AgentOfMonthDto {
  return {
    agentID: 'A1002',
    name: 'Sarah Johnson',
    photoUrl: '',
    ...overrides,
  };
}

describe('agent-of-month.mapper', () => {
  it('maps each dto straight across (agentID -> agentId, name, photoUrl)', () => {
    const result = mapAgentsOfMonth([buildDto({ agentID: 'A1002', name: 'Sarah Johnson' })]);
    expect(result).toEqual([{ agentId: 'A1002', name: 'Sarah Johnson', photoUrl: null }]);
  });

  it('maps every entry in the array, preserving order', () => {
    const result = mapAgentsOfMonth([
      buildDto({ agentID: 'A1001', name: 'John Smith' }),
      buildDto({ agentID: 'A1002', name: 'Sarah Johnson' }),
      buildDto({ agentID: 'A1003', name: 'Emily Davis' }),
    ]);
    expect(result.map((a) => a.agentId)).toEqual(['A1001', 'A1002', 'A1003']);
    expect(result.map((a) => a.name)).toEqual(['John Smith', 'Sarah Johnson', 'Emily Davis']);
  });

  it('returns an empty array for an empty roster of winners', () => {
    expect(mapAgentsOfMonth([])).toEqual([]);
  });

  it('normalizes an empty photoUrl to null so the UI can show a defined fallback', () => {
    const result = mapAgentsOfMonth([buildDto({ photoUrl: '' })]);
    expect(result[0].photoUrl).toBeNull();
  });

  it('preserves a non-empty photoUrl', () => {
    const result = mapAgentsOfMonth([buildDto({ photoUrl: 'https://example.com/a.jpg' })]);
    expect(result[0].photoUrl).toBe('https://example.com/a.jpg');
  });
});