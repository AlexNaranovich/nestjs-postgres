import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  it('передаёт поиск и пагинацию в сервис и возвращает результат', async () => {
    const query = {
      page: 2,
      limit: 10,
      search: 'alex',
    };

    const expected = {
      data: [],
      total: 0,
      page: 2,
      limit: 10,
      totalPages: 0,
    };

    usersService.findAll.mockResolvedValue(expected);

    const result = await controller.findAll(query);

    expect(usersService.findAll).toHaveBeenCalledWith(query);
    expect(result).toEqual(expected);
  });
});