import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { id: 'ASC' },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(dto);
  
    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
  const result = await this.usersRepository.delete(id);

  if (result.affected === 0) {
    throw new NotFoundException('Пользователь не найден');
  }
  }

  async findOne(id: number): Promise<User> {
  const user = await this.usersRepository.findOneBy({ id });

  if (!user) {
    throw new NotFoundException('Пользователь не найден');
  }

  return user;
  }
  async update(id: number, dto: UpdateUserDto): Promise<User> {
  const user = await this.findOne(id);

  if (dto.name !== undefined) {
    user.name = dto.name;
  }

  if (dto.email !== undefined) {
    user.email = dto.email;
  }

  try {
    return await this.usersRepository.save(user);
  } catch (error) {
    if (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string }).code === '23505'
    ) {
      throw new ConflictException(
        'Пользователь с таким email уже существует',
      );
    }

    throw error;
  }
  }
}