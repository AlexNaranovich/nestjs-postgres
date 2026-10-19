import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { UsersModule } from '../src/users/users.module';
import { User } from '../src/users/user.entity';

describe('Users API with PostgreSQL', () => {
  let app: INestApplication | undefined;
  let dataSource: DataSource;
  const email = `test-${randomUUID()}@example.com`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT ?? 5432),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: 'app_test',
          entities: [User],
          synchronize: false,
        }),
        UsersModule,
      ],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);

    const [connection] = await dataSource.query(
      'SELECT current_database() AS name',
    );

    if (connection.name !== 'app_test') {
      throw new Error('Тест должен использовать только app_test');
    }
  });

  afterAll(async () => {
    try {
      if (dataSource?.isInitialized) {
        await dataSource.getRepository(User).delete({ email });
      }
    } finally {
      await app?.close();
    }
  });

  it('сохраняет пользователя и отклоняет повторный email', async () => {
    const body = {
      name: 'Database Test',
      email,
    };

    const created = await request(app!.getHttpServer())
      .post('/users')
      .send(body)
      .expect(201);

    const saved = await dataSource.getRepository(User).findOneBy({
      id: created.body.id,
    });

    expect(saved).toMatchObject(body);

    await request(app!.getHttpServer())
      .post('/users')
      .send(body)
      .expect(409);

    const count = await dataSource.getRepository(User).countBy({
      email,
    });

    expect(count).toBe(1);
  });
});