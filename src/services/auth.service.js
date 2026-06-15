import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (err) {
        logger.error(`Error hashing password: ${err.message}`);
        throw new Error('Error hashing password');
    }
}

export const createUser = async ({username, email, password, role = 'user'}) => {
    // Here you would normally interact with your database to create the user
    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUser.length > 0) {
            throw new Error('user with this email already exists');
        }

        const hashedPassword = await hashPassword(password);

        const [newUser] = await db
        .insert(users)
        .values({ name: username, email, password: hashedPassword, role })
        .returning({ id: users.id, name: users.name, email: users.email, role: users.role, created_at: users.created_at });

        logger.info(`User created with email: ${newUser.email}`);
        return newUser;
    } catch (err) {
        logger.error(`Error creating user: ${err.message}`);
        if (err.message === 'user with this email already exists') {
            throw err;
        }
        throw new Error('Error creating user');
    }
}
