import {ApiProperty} from '@nestjs/swagger';

export class AgentStatsDto {
    @ApiProperty({example: 'Ali'})
    agentName: string;

    @ApiProperty({example: 'ready'})
    state: string;

    @ApiProperty({example: 12})
    callsHandled: number;

    @ApiProperty({example: 4})
    callsPresented: number;

    @ApiProperty({example: 180})
    averageTalkDuration: number; // seconds

    @ApiProperty({example: 30})
    averageHoldDuration: number; // seconds

    @ApiProperty({example: 50})
    totalTalkTime: number; // seconds

    @ApiProperty({example: 'Lunch break'})
    reason: string;
}
