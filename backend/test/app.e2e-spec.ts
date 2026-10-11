import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type ReadinessResponse = {
  status: string;
  info: {
    database: { status: string };
    redis: { status: string };
  };
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health/readiness (GET) reports database and Redis readiness', () => {
    return request(app.getHttpServer())
      .get('/health/readiness')
      .expect(200)
      .expect((response: { body: ReadinessResponse }) => {
        const { body } = response;
        expect(body.status).toBe('ok');
        expect(body.info.database.status).toBe('up');
        expect(body.info.redis.status).toBe('up');
      });
  });
});
