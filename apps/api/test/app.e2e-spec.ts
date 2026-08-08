import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health/live (GET) responde 200', () => {
    return request(app.getHttpServer()).get('/health/live').expect(200);
  });

  it('/health/ready (GET) responde 200 cuando la base de datos está disponible', () => {
    return request(app.getHttpServer()).get('/health/ready').expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
