import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, ValidationPipe} from '@nestjs/common';
import * as request from 'supertest';
import {AppModule} from '../src/app.module';

describe('Agents API (e2e)', () => {
    let app: INestApplication;
    let jwtToken: string;

    beforeAll(async () => {
        process.env.DATA_SOURCE = 'mock';
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_EXPIRES_IN = '1h';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({whitelist: true}));
        await app.init();

        // This POST must succeed and return a token
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({username: 'admin', password: 'admin'});
        jwtToken = res.body.access_token;

        // Optional debug
        // console.log('Received JWT:', jwtToken);

        expect(jwtToken).toBeDefined();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /api/v1/uccx/agents/stats - should return agent stats (mock)', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/v1/uccx/agents/stats')
            .set('Authorization', `Bearer ${jwtToken}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty('agentName');
        expect(res.body[0]).toHaveProperty('callsHandled');
        // ...add more field checks as needed
    });

    it('GET /api/v1/uccx/agents/stats - should require auth', async () => {
        await request(app.getHttpServer())
            .get('/api/v1/uccx/agents/stats')
            .expect(401);
    });
});
