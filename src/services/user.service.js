import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import logger from '#config/logger.js';
import { users } from '#models/user.model.js';
import { hashPassword } from '#services/password.service.js';

export const createUser = async ({ name, email, password, role = 'user' }) => {
  if (!name || typeof name !== 'string') {
    logger.error('User Service - Create user failed: Name is required');
    throw new Error('Name must be a non-empty string');
  }

  if (!email || typeof email !== 'string') {
    logger.error('User Service - Create user failed: Email is required');
    throw new Error('Email must be a non-empty string');
  }

  if (!password || typeof password !== 'string') {
    logger.error('User Service - Create user failed: Password is required');
    throw new Error('Password must be a non-empty string');
  }

  try {
    logger.info(`User Service - Creating user for email: ${email}`);

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingUsers.length > 0) {
      logger.warn(`User Service - User already exists with email: ${email}`);
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
      })
      .returning();

    logger.info(`User Service - User created successfully: ID ${newUser.id}`);
    return newUser;
  } catch (error) {
    if (error.statusCode === 409) {
      throw error;
    }
    logger.error(`User Service - Error creating user: ${error.message}`);
    throw new Error('Failed to create user', { cause: error });
  }
};

export const findUserByEmail = async email => {
  if (!email || typeof email !== 'string') {
    return null;
  }

  try {
    logger.info(`User Service - Finding user by email: ${email}`);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return user || null;
  } catch (error) {
    logger.error(
      `User Service - Error finding user by email: ${error.message}`
    );
    throw new Error('Failed to find user by email', { cause: error });
  }
};

export const findUserById = async id => {
  if (!id) {
    return null;
  }

  try {
    logger.info(`User Service - Finding user by ID: ${id}`);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)))
      .limit(1);

    return user || null;
  } catch (error) {
    logger.error(`User Service - Error finding user by ID: ${error.message}`);
    throw new Error('Failed to find user by ID', { cause: error });
  }
};

export const updateUser = async (id, updateData) => {
  if (!id) {
    throw new Error('User ID is required for update');
  }

  if (
    !updateData ||
    typeof updateData !== 'object' ||
    Array.isArray(updateData) ||
    Object.keys(updateData).length === 0
  ) {
    throw new Error('Update data must be a non-empty object');
  }

  try {
    logger.info(`User Service - Updating user ID: ${id}`);
    const dataToUpdate = { ...updateData, updatedAt: new Date() };

    if (dataToUpdate.password) {
      dataToUpdate.password = await hashPassword(dataToUpdate.password);
    }

    if (dataToUpdate.email) {
      dataToUpdate.email = dataToUpdate.email.toLowerCase().trim();
    }

    const [updatedUser] = await db
      .update(users)
      .set(dataToUpdate)
      .where(eq(users.id, Number(id)))
      .returning();

    if (!updatedUser) {
      logger.warn(`User Service - Update failed: User ID ${id} not found`);
      const error = new Error(`User with ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    logger.info(`User Service - User updated successfully: ID ${id}`);
    return updatedUser;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(`User Service - Error updating user: ${error.message}`);
    throw new Error('Failed to update user', { cause: error });
  }
};

export const deleteUser = async id => {
  if (!id) {
    throw new Error('User ID is required for deletion');
  }

  try {
    logger.info(`User Service - Deleting user ID: ${id}`);
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, Number(id)))
      .returning();

    const isDeleted = Boolean(deletedUser);
    if (isDeleted) {
      logger.info(`User Service - User deleted successfully: ID ${id}`);
    } else {
      logger.warn(`User Service - User delete failed: User ID ${id} not found`);
    }

    return isDeleted;
  } catch (error) {
    logger.error(`User Service - Error deleting user: ${error.message}`);
    throw new Error('Failed to delete user', { cause: error });
  }
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
};
