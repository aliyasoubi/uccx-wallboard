import {Controller, Get, UseGuards} from '@nestjs/common';
import {CallsService} from './calls.service';
import {JwtAuthGuard} from '../../auth/jwt-auth.guard';
import {ApiBearerAuth, ApiTags, ApiOkResponse, ApiResponse} from '@nestjs/swagger';
import {CallStatsDto} from './dto/call-stats.dto';

@ApiTags('calls')
@ApiBearerAuth()
@Controller('api/v1/uccx/calls')
export class CallsController {
    constructor(private readonly callsService: CallsService) {
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    @ApiOkResponse({
        description: 'Current call statistics',
        type: CallStatsDto,
        examples: {
            sample: {
                summary: 'Sample response',
                value: {
                    totalCalls: 45,
                    handledCalls: 40,
                    abandonedCalls: 5,
                    averageWaitTime: 20,
                    averageTalkTime: 120,
                    callsInQueue: 3
                }
            }
        }
    })
    @ApiResponse({status: 500, description: 'Failed to retrieve call statistics'})
    async getStats() {
        return this.callsService.getCallStats();
    }
}
