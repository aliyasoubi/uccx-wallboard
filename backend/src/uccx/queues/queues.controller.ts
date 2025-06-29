import {Controller, Get, UseGuards} from '@nestjs/common';
import {QueuesService} from './queues.service';
import {JwtAuthGuard} from '../../auth/jwt-auth.guard';
import {ApiBearerAuth, ApiTags, ApiOkResponse, ApiResponse} from '@nestjs/swagger';
import {QueueStatsDto} from './dto/queue-stats.dto';

@ApiTags('queues')
@ApiBearerAuth()
@Controller('api/v1/uccx/queues')
export class QueuesController {
    constructor(private readonly queuesService: QueuesService) {
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    @ApiOkResponse({
        description: 'List of queue statistics',
        type: [QueueStatsDto],
        examples: {
            sample: {
                summary: 'Example response',
                value: [
                    {
                        queueName: 'Support',
                        totalCall: 100,
                        handledCall: 80,
                        abandonedCall: 10,
                        averageWaitTime: 25,
                        callInQueue: 5,
                        nReadyAgents: 3,
                        nTalkingAgents: 2,
                        nNotReadyAgents: 1
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
                        nNotReadyAgents: 1
                    }
                ]
            }
        }
    })
    @ApiResponse({status: 500, description: 'Failed to retrieve queue statistics'})
    async getStats() {
        return this.queuesService.getQueueStats();
    }
}