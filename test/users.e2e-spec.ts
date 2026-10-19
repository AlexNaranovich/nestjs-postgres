import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

describe('Users API', () => {
  let app: INestApplication;

  const usersService = {
    findAll: jest.fn(),
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
});