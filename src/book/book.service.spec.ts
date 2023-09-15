import { Test, TestingModule } from '@nestjs/testing';
import { async } from 'rxjs';
import { BookService } from './book.service';
import { getModelToken } from '@nestjs/mongoose';
import { Book, Category } from './schemas/book.schema';
import mongoose, { Model } from 'mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { User } from 'src/auth/schemas/user.schema';

describe('BookService', () => {
  let service: BookService;
  let model: Model<Book>;

  const mockBook = {
    _id: '123312313312',
    user: '123312313312',
    title: 'New Book',
    description: 'ASASASASASASASAS',
    author: 'author',
    price: '1111',
    category: Category.ADVENTURE,
  };

  const mockUser = {
    _id: '1212121212',
    name: 'ibra',
    email: 'ibra@gmail.com',
  };

  const mockBookService = {
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getModelToken(Book.name),
          useValue: mockBookService,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
    model = module.get<Model<Book>>(getModelToken(Book.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of books', async () => {
      const query = { page: '1', keyword: 'test' };

      jest.spyOn(model, 'find').mockImplementation(
        () =>
          ({
            limit: () => ({
              skip: jest.fn().mockResolvedValue([mockBook]),
            }),
          } as any),
      );

      const result = await service.findAll(query);
      expect(result).toEqual([mockBook]);
      expect(model.find).toHaveBeenCalledWith({
        title: { $regex: 'test', $options: 'i' },
      });
    });
  });

  describe('findById', () => {
    it('should find and return a book by id', async () => {
      jest.spyOn(model, 'findById').mockResolvedValue(mockBook);
      const result = await service.findById(mockBook._id);

      expect(model.findById).toHaveBeenCalledWith(mockBook._id);
      expect(result).toEqual(mockBook);
    });

    it('should throw BadRequestException if invalid ID is provided', async () => {
      const id = 'invalid-id';
      const isValidObjectId = jest
        .spyOn(mongoose, 'isValidObjectId')
        .mockReturnValue(false);

      expect(service.findById(id)).rejects.toThrow(BadRequestException);
      expect(isValidObjectId).toHaveBeenCalledWith(id);
      isValidObjectId.mockRestore();
    });

    it('should throw NotFoundException if book is not found', async () => {
      jest.spyOn(model, 'findById').mockResolvedValue(null);

      expect(service.findById(mockBook._id)).rejects.toThrow(NotFoundException);

      expect(model.findById).toHaveBeenCalledWith(mockBook._id);
    });
  });

  describe('create', () => {
    it('should craete and return a book', async () => {
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve(mockBook));

      const newBook = {
        title: 'New Book',
        description: 'ASASASASASASASAS',
        author: 'author',
        price: '11111',
        category: Category.ADVENTURE,
      };

      const result = await service.create(
        newBook as CreateBookDto,
        mockUser as User,
      );

      expect(result).toEqual(mockBook);
    });
  });

  describe('updateById', () => {
    it('should update book and return a book', async () => {
      const updatedBook = {
        ...mockBook,
        title: 'updated book',
      };
      const book = { title: 'updated book' };

      jest.spyOn(model, 'findByIdAndUpdate').mockResolvedValue(updatedBook);

      const result = await service.updateById(mockBook._id, book as any);

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(mockBook._id, book, {
        new: true,
        runValidators: true,
      });

      expect(result.title).toEqual(book.title);
    });
  });

  describe('deleteById', () => {
    it('should delete book by id and return a book', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockResolvedValue(mockBook);

      const result = await service.deleteById(mockBook._id);

      expect(model.findByIdAndDelete).toHaveBeenCalledWith(mockBook._id);

      expect(result).toEqual(mockBook);
    });
  });
});
