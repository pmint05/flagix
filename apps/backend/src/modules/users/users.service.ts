import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DATABASE } from '../database/database.module';
import type { Database } from '../../db';
import { user } from '../../db/auth-schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(createUserDto: CreateUserDto) {
    const [newUser] = await this.db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: createUserDto.name,
        email: createUserDto.email,
      })
      .returning();
    return newUser;
  }

  async findAll() {
    return await this.db.select().from(user);
  }

  async findOne(id: string) {
    const [foundUser] = await this.db
      .select()
      .from(user)
      .where(eq(user.id, id));
    if (!foundUser) throw new NotFoundException(`User with ID ${id} not found`);
    return foundUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const [updatedUser] = await this.db
      .update(user)
      .set({
        ...updateUserDto,
        updatedAt: new Date(),
      })
      .where(eq(user.id, id))
      .returning();

    if (!updatedUser)
      throw new NotFoundException(`User with ID ${id} not found`);

    return updatedUser;
  }

  async remove(id: string) {
    const [deletedUser] = await this.db
      .delete(user)
      .where(eq(user.id, id))
      .returning();

    if (!deletedUser)
      throw new NotFoundException(`User with ID ${id} not found`);

    return deletedUser;
  }
}
