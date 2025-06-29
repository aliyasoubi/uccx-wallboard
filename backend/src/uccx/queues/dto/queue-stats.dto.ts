import {ApiProperty} from '@nestjs/swagger';

export class QueueStatsDto {
    @ApiProperty({example: 'Support'})
    queueName: string;

    @ApiProperty({example: 100})
    totalCall: number;

    @ApiProperty({example: 80})
    handledCall: number;

    @ApiProperty({example: 10})
    abandonedCall: number;

    @ApiProperty({example: 25})
    averageWaitTime: number;

    @ApiProperty({example: 5})
    callInQueue: number;

    @ApiProperty({example: 3})
    nReadyAgents: number;

    @ApiProperty({example: 2})
    nTalkingAgents: number;

    @ApiProperty({example: 1})
    nNotReadyAgents: number;
}
