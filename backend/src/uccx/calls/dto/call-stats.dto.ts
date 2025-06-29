import {ApiProperty} from '@nestjs/swagger';

export class CallStatsDto {
    @ApiProperty({example: 45})
    totalCalls: number;

    @ApiProperty({example: 40})
    handledCalls: number;

    @ApiProperty({example: 5})
    abandonedCalls: number;

    @ApiProperty({example: 20})
    averageWaitTime: number; // seconds

    @ApiProperty({example: 120})
    averageTalkTime: number; // seconds

    @ApiProperty({example: 3})
    callsInQueue: number;
}
