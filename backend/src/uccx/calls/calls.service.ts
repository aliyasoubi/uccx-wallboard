import {Injectable, InternalServerErrorException} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import axios from 'axios';
import {CallStatsDto} from './dto/call-stats.dto';

@Injectable()
export class CallsService {
    constructor(private readonly configService: ConfigService) {
    }

    async getCallStats(): Promise<CallStatsDto> {
        const dataSource = this.configService.get<string>('DATA_SOURCE');
        if (dataSource === 'mock') {
            return {
                totalCalls: 45,
                handledCalls: 40,
                abandonedCalls: 5,
                averageWaitTime: 20,
                averageTalkTime: 120,
                callsInQueue: 3,
            };
        } else if (dataSource === 'uccx') {
            const url = this.configService.get<string>('UCCX_CALL_STATS_URL');
            const username = this.configService.get<string>('UCCX_API_USER');
            const password = this.configService.get<string>('UCCX_API_PASS');
            if (!url || !username || !password) {
                throw new InternalServerErrorException('UCCX API configuration is missing');
            }
            try {
                const response = await axios.post(url, {}, {
                    auth: {username, password},
                });
                const d = response.data ?? {};
                return {
                    totalCalls: d.nTotalCalls ?? 0,
                    handledCalls: d.nHandledCalls ?? 0,
                    abandonedCalls: d.nAbandonedCalls ?? 0,
                    averageWaitTime: d.avgWaitDuration ?? 0,
                    averageTalkTime: d.avgTalkDuration ?? 0,
                    callsInQueue: d.nCallsInQueue ?? 0,
                };
            } catch (error) {
                throw new InternalServerErrorException('Failed to fetch call stats from UCCX');
            }
        } else {
            throw new InternalServerErrorException('Invalid DATA_SOURCE config');
        }
    }
}
