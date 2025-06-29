import {Controller, Post, Body, BadRequestException, UsePipes, ValidationPipe} from '@nestjs/common';
import {AuthService} from './auth.service';
import {LoginDto} from './dto/login.dto';
import {ApiBody, ApiTags} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {
    }

    @Post('login')
    @ApiBody({
        type: LoginDto,
        examples: {
            demo: {
                summary: 'Example credentials',
                value: {
                    username: 'admin',
                    password: 'admin'
                }
            }
        }
    })
    @UsePipes(new ValidationPipe({whitelist: true}))
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new BadRequestException('Invalid username or password');
        }
        return this.authService.login(user);
    }
}
