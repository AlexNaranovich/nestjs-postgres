import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('Users API', () => {
  let app: INestApplication;

  const usersService = {
    findAll: jest.fn(),
    create: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
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
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /users преобразует параметры и возвращает 200', async () => {
    const result = {
      data: [],
      total: 0,
      page: 2,
      limit: 5,
      totalPages: 0,
    };

    usersService.findAll.mockResolvedValue(result);

    await request(app.getHttpServer())
      .get('/users?page=2&limit=5&search=alex')
      .expect(200)
      .expect(result);

    expect(usersService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 5,
        search: 'alex',
      }),
    );
  });

  it('GET /users?page=0 возвращает 400 и не вызывает сервис', async () => {
    await request(app.getHttpServer())
      .get('/users?page=0')
      .expect(400);

    expect(usersService.findAll).not.toHaveBeenCalled();
  });

  it('GET /users?limit=101 возвращает 400', async () => {
    await request(app.getHttpServer())
      .get('/users?limit=101')
      .expect(400);

    expect(usersService.findAll).not.toHaveBeenCalled();
  });
  it('POST /users создаёт пользователя и возвращает 201', async () => {
  const body = {
    name: 'Maria',
    email: 'maria@example.com',
  };

  const createdUser = {
    id: 10,
    ...body,
    createdAt: '2026-10-19T12:00:00.000Z',
  };

  usersService.create.mockResolvedValue(createdUser);

  await request(app.getHttpServer())
    .post('/users')
    .send(body)
    .expect(201)
    .expect(createdUser);

  expect(usersService.create).toHaveBeenCalledTimes(1);
  expect(usersService.create).toHaveBeenCalledWith(
    expect.objectContaining(body),
  );
  });

  it('POST /users отклоняет пустое имя и неверный email', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({
      name: '',
      email: 'not-an-email',
    })
    .expect(400);

  expect(usersService.create).not.toHaveBeenCalled();
  });

  it('POST /users отклоняет лишнее поле role', async () => {
  await request(app.getHttpServer())
    .post('/users')
    .send({
      name: 'Maria',
      email: 'maria@example.com',
      role: 'admin',
    })
    .expect(400);

  expect(usersService.create).not.toHaveBeenCalled();
  });
});