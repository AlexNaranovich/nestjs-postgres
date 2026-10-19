import { NotFoundException, ConflictException, } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, QueryFailedError, } from 'typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const repository = {
    findAndCount: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('успешно удаляет существующего пользователя', async () => {
  repository.delete.mockResolvedValue({ affected: 1 });

  await expect(service.remove(3)).resolves.toBeUndefined();

  expect(repository.delete).toHaveBeenCalledWith(3);
  });

  it('возвращает NotFoundException, если никто не удалён', async () => {
  repository.delete.mockResolvedValue({ affected: 0 });

  await expect(service.remove(999)).rejects.toBeInstanceOf(
    NotFoundException,
  );
  });

  it('превращает ошибку уникальности в ConflictException', async () => {
  const dto = {
    name: 'Maria',
    email: 'maria@example.com',
  };

  repository.create.mockReturnValue(dto);

  const databaseError = new QueryFailedError(
    'INSERT INTO users ...',
    [],
    Object.assign(new Error('duplicate key'), {
      code: '23505',
    }),
  );

  repository.save.mockRejectedValue(databaseError);

  await expect(service.create(dto)).rejects.toBeInstanceOf(
    ConflictException,
  );
  });

  it('передаёт прочие ошибки базы без изменения', async () => {
  const dto = {
    name: 'Maria',
    email: 'maria@example.com',
  };

  repository.create.mockReturnValue(dto);

  const databaseError = new Error('Connection lost');
  repository.save.mockRejectedValue(databaseError);

  await expect(service.create(dto)).rejects.toBe(databaseError);
  });

  it('применяет поиск и вычисляет смещение страницы', async () => {
    repository.findAndCount.mockResolvedValue([[], 12]);

    const result = await service.findAll({
      page: 2,
      limit: 5,
      search: ' alex ',
    });

    expect(repository.findAndCount).toHaveBeenCalledWith({
      where: { name: ILike('%alex%') },
      order: { id: 'ASC' },
      skip: 5,
      take: 5,
    });

    expect(result).toEqual({
      data: [],
      total: 12,
      page: 2,
      limit: 5,
      totalPages: 3,
    });
  });

  it('возвращает найденного пользователя', async () => {
    const user = {
      id: 3,
      name: 'Alexander',
      email: 'alex@example.com',
      createdAt: new Date(),
    };

    repository.findOneBy.mockResolvedValue(user);

    await expect(service.findOne(3)).resolves.toEqual(user);

    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 3 });
  });

  it('возвращает NotFoundException, если пользователь отсутствует', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});