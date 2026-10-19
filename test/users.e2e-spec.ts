import { INestApplication, ValidationPipe, NotFoundException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('Users API', () => {
  let app: INestApplication;

  const usersService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };
  
  it('отклоняет нечисловой ID до вызова сервиса', async () => {
  await request(app.getHttpServer())
    .get('/users/abc')
    .expect(400);

  await request(app.getHttpServer())
    .patch('/users/abc')
    .send({ name: 'Alexander' })
    .expect(400);

  await request(app.getHttpServer())
    .delete('/users/abc')
    .expect(400);

  expect(usersService.findOne).not.toHaveBeenCalled();
  expect(usersService.update).not.toHaveBeenCalled();
  expect(usersService.remove).not.toHaveBeenCalled();
  });

  it('PATCH /users/3 обновляет имя и возвращает 200', async () => {
  const updatedUser = {
    id: 3,
    name: 'Alexander',
    email: 'alex@example.com',
    createdAt: '2026-10-19T12:00:00.000Z',
  };

  usersService.update.mockResolvedValue(updatedUser);

  await request(app.getHttpServer())
    .patch('/users/3')
    .send({ name: 'Alexander' })
    .expect(200)
    .expect(updatedUser);

  expect(usersService.update).toHaveBeenCalledTimes(1);
  expect(usersService.update).toHaveBeenCalledWith(
    3,
    expect.objectContaining({ name: 'Alexander' }),
  );
  });

  it('PATCH /users/3 отклоняет неверный email', async () => {
  await request(app.getHttpServer())
    .patch('/users/3')
    .send({ email: 'not-an-email' })
    .expect(400);

  expect(usersService.update).not.toHaveBeenCalled();
  });

  it('PATCH /users/3 отклоняет null вместо имени', async () => {
  await request(app.getHttpServer())
    .patch('/users/3')
    .send({ name: null })
    .expect(400);

  expect(usersService.update).not.toHaveBeenCalled();
  });

  it('DELETE /users/3 возвращает 204 без тела ответа', async () => {
  usersService.remove.mockResolvedValue(undefined);

  const response = await request(app.getHttpServer())
    .delete('/users/3')
    .expect(204);

  expect(response.text).toBe('');
  expect(usersService.remove).toHaveBeenCalledTimes(1);
  expect(usersService.remove).toHaveBeenCalledWith(3);
  });

  it('DELETE /users/999 возвращает 404, если пользователь не найден', async () => {
  usersService.remove.mockRejectedValue(
    new NotFoundException('Пользователь не найден'),
  );

  const response = await request(app.getHttpServer())
    .delete('/users/999')
    .expect(404);

  expect(response.body.message).toBe('Пользователь не найден');
  expect(usersService.remove).toHaveBeenCalledWith(999);
  });

  it('GET /users/999 возвращает 404, если пользователь не найден', async () => {
  usersService.findOne.mockRejectedValue(
    new NotFoundException('Пользователь не найден'),
  );

  const response = await request(app.getHttpServer())
    .get('/users/999')
    .expect(404);

  expect(response.body.message).toBe('Пользователь не найден');
  expect(usersService.findOne).toHaveBeenCalledWith(999);
  });

  it('POST /users возвращает 409, если email уже занят', async () => {
  const body = {
    name: 'Maria',
    email: 'maria@example.com',
  };

  usersService.create.mockRejectedValue(
    new ConflictException('Пользователь с таким email уже существует'),
  );

  const response = await request(app.getHttpServer())
    .post('/users')
    .send(body)
    .expect(409);

  expect(response.body.message).toBe(
    'Пользователь с таким email уже существует',
  );

  expect(usersService.create).toHaveBeenCalledWith(
    expect.objectContaining(body),
  );
  });

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