import request from 'supertest';
import app from '../src/test-app';

describe('Authentication Routes', () => {
	describe('POST /api/auth/signup', () => {
		it('should register a new user successfully', async () => {
			const userData = {
				email: 'testuser@example.com',
				password: 'securePassword123!'
			};

			const response = await request(app)
				.post('/api/auth/signup')
				.send(userData)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('created successfully');
		});

		it('should reject duplicate user registration', async () => {
			const userData = {
				email: 'duplicate@example.com',
				password: 'securePassword123!'
			};

			// First registration should succeed
			await request(app)
				.post('/api/auth/signup')
				.send(userData)
				.expect(200);

			// Second registration should fail
			const response = await request(app)
				.post('/api/auth/signup')
				.send(userData)
				.expect(409);

			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /api/auth/signin', () => {
		beforeEach(async () => {
			// Register a test user
			await request(app)
				.post('/api/auth/signup')
				.send({
					email: 'signin@example.com',
					password: 'securePassword123!'
				});
		});

		it('should sign in with valid credentials', async () => {
			const response = await request(app)
				.post('/api/auth/signin')
				.send({
					email: 'signin@example.com',
					password: 'securePassword123!'
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.token).toBeDefined();
		});

		it('should reject invalid credentials', async () => {
			const response = await request(app)
				.post('/api/auth/signin')
				.send({
					email: 'signin@example.com',
					password: 'wrongPassword'
				})
				.expect(401);

			expect(response.body.success).toBe(false);
		});
	});

	describe('POST /api/auth/forgot-password', () => {
		it('should handle password reset request', async () => {
			const response = await request(app)
				.post('/api/auth/forgot-password')
				.send({
					email: 'test@example.com'
				})
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('password reset link');
		});
	});
});
