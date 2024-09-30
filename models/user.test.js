const User = require('./user'); // adjust the path accordingly
const db = require('../db');

beforeAll(async () => {
    // Clean up and set up the database before tests
    await db.query("DELETE FROM users");
    await db.query("DELETE FROM applications"); // Clean applications table if necessary
});

afterAll(async () => {
    // Close the database connection after all tests
    await db.end();
});

describe("User Model", () => {
    test("can register a user", async () => {
        const user = await User.register({
            username: 'testuser',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            isAdmin: false,
        });
        expect(user).toHaveProperty('username', 'testuser');
        expect(user).toHaveProperty('firstName', 'Test');
        expect(user).toHaveProperty('lastName', 'User');
        expect(user).toHaveProperty('email', 'test@example.com');
        expect(user).toHaveProperty('isAdmin', false);
    });

    test("throws error for duplicate username", async () => {
        await User.register({
            username: 'duplicateuser',
            password: 'password123',
            firstName: 'Dup',
            lastName: 'User',
            email: 'dup@example.com',
            isAdmin: false,
        });

        await expect(User.register({
            username: 'duplicateuser',
            password: 'password456',
            firstName: 'Dup2',
            lastName: 'User2',
            email: 'dup2@example.com',
            isAdmin: false,
        })).rejects.toThrow('Duplicate username: duplicateuser');
    });

    test("can authenticate user", async () => {
        await User.register({
            username: 'authuser',
            password: 'securepass',
            firstName: 'Auth',
            lastName: 'User',
            email: 'auth@example.com',
            isAdmin: false,
        });
        
        const user = await User.authenticate('authuser', 'securepass');
        expect(user).toHaveProperty('username', 'authuser');
        expect(user).toHaveProperty('firstName', 'Auth');
        expect(user).toHaveProperty('lastName', 'User');
        expect(user).toHaveProperty('email', 'auth@example.com');
        expect(user).toHaveProperty('isAdmin', false);
    });

    test("throws error for invalid authentication", async () => {
        await User.register({
            username: 'invaliduser',
            password: 'validpass',
            firstName: 'Invalid',
            lastName: 'User',
            email: 'invalid@example.com',
            isAdmin: false,
        });

        await expect(User.authenticate('invaliduser', 'wrongpass')).rejects.toThrow('Invalid username/password');
    });

    test("can retrieve a user by username", async () => {
        await User.register({
            username: 'retrieveuser',
            password: 'pass123',
            firstName: 'Retrieve',
            lastName: 'User',
            email: 'retrieve@example.com',
            isAdmin: false,
        });

        const user = await User.get('retrieveuser');
        expect(user).toHaveProperty('username', 'retrieveuser');
        expect(user).toHaveProperty('firstName', 'Retrieve');
        expect(user).toHaveProperty('lastName', 'User');
        expect(user).toHaveProperty('email', 'retrieve@example.com');
        expect(user).toHaveProperty('isAdmin', false);
        expect(user).toHaveProperty('applications', []);
    });

    // Additional tests for update, remove, applyToJob, etc.
});

