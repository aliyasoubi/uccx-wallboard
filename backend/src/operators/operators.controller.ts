import {Controller, Get, UseGuards, Request} from '@nestjs/common';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger';

@ApiTags('uccx-operators')
@ApiBearerAuth()
@Controller('uccx/operators')
export class OperatorsController {
    @UseGuards(JwtAuthGuard)
    @Get()
    getOperators(@Request() req) {
        // Access req.user for roles/tenant info!
        return [
            {id: 1, name: 'Ali', status: 'ready', callsHandled: 10},
            {id: 2, name: 'Sara', status: 'not_ready', callsHandled: 7}
        ];
    }
}
