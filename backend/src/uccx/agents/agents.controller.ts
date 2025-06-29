import { Controller, Get, UseGuards } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { AgentStatsDto } from './dto/agent-stats.dto';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('api/v1/uccx/agents')
export class AgentsController {
    constructor(private readonly agentsService: AgentsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    @ApiOkResponse({
        description: 'List of agent statistics',
        type: [AgentStatsDto],
        examples: {
            sample: {
                summary: 'Sample response',
                value: [
                    {
                        agentName: 'Ali',
                        state: 'ready',
                        callsHandled: 12,
                        callsPresented: 15,
                        averageTalkDuration: 180,
                        averageHoldDuration: 30,
                        totalTalkTime: 1500,
                        reason: 'Logged in'
                    }
                ]
            }
        }
    })
    @ApiResponse({ status: 500, description: 'Failed to retrieve agent statistics' })
    async getStats() {
        return this.agentsService.getAgentStats();
    }
}
