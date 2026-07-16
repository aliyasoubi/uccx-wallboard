export interface AgentOfMonth {
  agentId: string;
  name: string | null; // resolved by cross-referencing the agent roster
  photoUrl: string | null; // null (not '') when absent, so the UI can show a defined fallback
}
