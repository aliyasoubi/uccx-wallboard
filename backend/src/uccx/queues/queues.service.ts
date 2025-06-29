import {Injectable, InternalServerErrorException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import axios from 'axios';
import {QueueStatsDto} from './dto/queue-stats.dto';

@Injectable()
export class QueuesService {
    constructor(private readonly configService: ConfigService) {
    }

    async getQueueStats(): Promise<QueueStatsDto[]> {
        const dataSource = this.configService.get<string>('DATA_SOURCE');
        if (dataSource === 'mock') {
            return [
                {
                    queueName: 'Support',
                    totalCall: 100,
                    handledCall: 80,
                    abandonedCall: 10,
                    averageWaitTime: 25,
                    callInQueue: 5,
                    nReadyAgents: 3,
                    nTalkingAgents: 2,
                    nNotReadyAgents: 1,
                },
                {
                    queueName: 'Sales',
                    totalCall: 60,
                    handledCall: 45,
                    abandonedCall: 5,
                    averageWaitTime: 40,
                    callInQueue: 4,
                    nReadyAgents: 2,
                    nTalkingAgents: 1,
                    nNotReadyAgents: 1,
                },
            ];
        } else if (dataSource === 'uccx') {
            const url = this.configService.get<string>('UCCX_QUEUE_STATS_URL');
            const username = this.configService.get<string>('UCCX_API_USER');
            const password = this.configService.get<string>('UCCX_API_PASS');
            if (!url || !username || !password) {
                throw new InternalServerErrorException('UCCX API configuration is missing');
            }
            try {
                const response = await axios.post(url, {}, {
                    auth: {username, password},
                });
                // Defensive mapping: UCCX returns array
                return (response.data ?? []).map((q: any) => ({
                    queueName: q.CSQ_Name ?? '',
                    totalCall: q.nTotalCalls ?? 0,
                    handledCall: (q.nTotalCalls ?? 0) - (q.nAbandonedCalls ?? 0),
                    abandonedCall: q.nAbandonedCalls ?? 0,
                    averageWaitTime: q.avgWaitDuration ?? 0,
                    callInQueue: q.nWaitingCalls ?? 0,
                    nReadyAgents: q.nReadyAgents ?? 0,
                    nTalkingAgents: q.nTalkingAgents ?? 0,
                    nNotReadyAgents: q.nNotReadyAgents ?? 0,
                }));
            } catch (error) {
                throw new InternalServerErrorException('Failed to fetch queue stats from UCCX');
            }
        } else {
            throw new InternalServerErrorException('Invalid DATA_SOURCE config');
        }
    }
}