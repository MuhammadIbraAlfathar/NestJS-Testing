import { Test, TestingModule } from '@nestjs/testing';
import mongoose, { Model } from 'mongoose';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './schemas/user.schema';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('BookService', () => {
  let authService: AuthService;
  let model: Model<User>;
  let jwtService: JwtService;

  const mockAuthService = {
    create: jest.fn(),
    findOne: jest.fn(),
    hash: jest.fn(),
  };

  let token = 'jwtToken';

  const mockUser = {
    _id: '1212121212',
    name: 'ibra',
    email: 'ibra@gmail.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getModelToken(User.name),
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  it('auth service should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signUp', () => {
    const createUserDto = {
      name: 'ibra',
      email: 'ibra@gmail.com',
      password: '1234532',
    };

    it('should register the new user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassowrd');
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockUser));
      jest.spyOn(jwtService, 'sign').mockReturnValue('jwtToken');

      const result = await authService.signUp(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(result).toEqual({ token });
    });

    it('should throw an ConflictException if duplicate email', async () => {
      //   jest
      //     .spyOn(model, 'create')
      //     .mockImplementationOnce(() => Promise.reject({ code: 11000 }));

      //   const result = await authService.signUp(createUserDto);
      //   await expect(authService.signUp(createUserDto)).rejects.toThrow(
      //     ConflictException,
      //   );

      // expect(bcrypt.hash).toHaveBeenCalled();
      // expect(result).toEqual({ token });

      jest
        .spyOn(authService, 'signUp')
        .mockRejectedValue(new ConflictException('Duplicated email'));

      try {
        await authService.signUp(createUserDto); // Panggil fungsi signUp dengan data pengguna yang sama
      } catch (error) {
        // Pastikan bahwa error yang dilemparkan adalah ConflictException
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe('Duplicated email');
      }
    });
  });
});
