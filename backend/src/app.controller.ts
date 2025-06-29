import {Controller, Get, Res} from '@nestjs/common';
import {Response} from 'express';

@Controller()
export class AppController {
    @Get()
    home(@Res() res: Response) {
        res.type('html').send(`
      <div style="font-family:sans-serif;max-width:600px;margin:3rem auto;text-align:center;">
        <img src="https://nestjs.com/img/logo-small.svg" width="64" alt="NestJS" />
        <h1>Welcome to the UCCX IVR Monitoring Dashboard Backend</h1>
        <p>This API provides real-time and historical monitoring for operators, queues, and calls.</p>
        <p>
          <a href="/api" style="color:#ea2845;text-decoration:none;font-weight:bold;">
            View API Documentation (Swagger UI)
          </a>
        </p>
      </div>
    `);
    }
}
