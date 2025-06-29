import {Injectable, InternalServerErrorException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import axios from 'axios';
import {AgentStatsDto} from './dto/agent-stats.dto';

@Injectable()
export class AgentsService {
    constructor(private readonly configService: ConfigService) {
    }

    async getAgentStats(): Promise<AgentStatsDto[]> {
        const dataSource = this.configService.get<string>('DATA_SOURCE');
        if (dataSource === 'mock') {
            return [
                {
                    agentName: 'Ali',
                    state: 'ready',
                    callsHandled: 12,
                    callsPresented: 15,
                    averageTalkDuration: 180,
                    averageHoldDuration: 30,
                    totalTalkTime: 1500,
                    reason: 'Logged in',
                },
                {
                    agentName: 'Sara',
                    state: 'not_ready',
                    callsHandled: 9,
                    callsPresented: 11,
                    averageTalkDuration: 140,
                    averageHoldDuration: 20,
                    totalTalkTime: 900,
                    reason: 'Lunch break',
                },
            ];
        } else if (dataSource === 'uccx') {
            const url = this.configService.get<string>('UCCX_AGENT_STATS_URL');
            const username = this.configService.get<string>('UCCX_API_USER');
            const password = this.configService.get<string>('UCCX_API_PASS');
            if (!url || !username || !password) {
                throw new InternalServerErrorException('UCCX API configuration is missing');
            }
            try {
                const response = await axios.post(url, {}, {
                    auth: {username, password},
                });
                // Defensive mapping based on your UCCX API response:
                return (response.data ?? []).map((item: any) => ({
                    agentName: item.AgentName ?? '',
                    state: item.AgentStatus ?? '',
                    callsHandled: item.nHandledContacts ?? 0,
                    callsPresented: item.nPresentedContacts ?? 0,
                    averageTalkDuration: item.avgTalkDuration ?? 0,
                    averageHoldDuration: item.avgHoldDuration ?? 0,
                    totalTalkTime: item.totalTalkTime ?? 0,
                    reason: item.reason ?? '',
                }));
            } catch (error) {
                throw new InternalServerErrorException('Failed to fetch agent stats from UCCX');
            }
        } else {
            throw new InternalServerErrorException('Invalid DATA_SOURCE config');
        }
    }
}