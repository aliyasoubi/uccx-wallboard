import { TotalCallSummary } from "../models/domain/total-call-summary.model";
import { TotalCallSummaryDto } from "../models/dto/total-call-summary";


export function mapTotalCallSummary(dto: TotalCallSummaryDto): TotalCallSummary {
    return {
        inboundTotalCalls: dto.inboundTotalCalls,
        inboundTotalTalkTime: dto.inboundTotalTalkTime,
        outboundTotalCalls: dto.outboundTotalCalls,
        outboundTotalTalkTime: dto.outboundTotalTalkTime
    };
}

