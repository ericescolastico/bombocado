import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  username: 'ADMIN',
  password: 'ADMIN123',
};

test.describe('API - Autenticação', () => {
  let authToken: string | null = null;

  test('POST /auth/login deve autenticar com credenciais válidas', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
      },
    });

    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('username');
    expect(body.user.username).toBe(ADMIN_CREDENTIALS.username);
    
    // Salvar token para testes subsequentes
    authToken = body.access_token;
    expect(authToken).toBeTruthy();
  });

  test('POST /auth/login deve retornar 401 com credenciais inválidas', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        username: 'usuario_invalido',
        password: 'senha_invalida',
      },
    });

    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body).toHaveProperty('message');
  });

  test('POST /auth/login deve retornar 400 sem credenciais', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {},
    });

    expect(response.status()).toBe(400);
  });

  test('POST /auth/validate deve validar token válido', async ({ request }) => {
    // Primeiro fazer login para obter token
    const loginResponse = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        username: ADMIN_CREDENTIALS.username,
        password: ADMIN_CREDENTIALS.password,
      },
    });

    expect(loginResponse.status()).toBe(201);
    const loginBody = await loginResponse.json();
    const token = loginBody.access_token;

    // Validar token
    const validateResponse = await request.post(`${BASE_URL}/auth/validate`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(validateResponse.status()).toBe(200);
    
    const validateBody = await validateResponse.json();
    expect(validateBody).toHaveProperty('valid');
    expect(validateBody.valid).toBe(true);
    expect(validateBody).toHaveProperty('user');
    expect(validateBody.user.username).toBe(ADMIN_CREDENTIALS.username);
  });

  test('POST /auth/validate deve retornar 401 com token inválido', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/validate`, {
      headers: {
        Authorization: 'Bearer token_invalido_12345',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('POST /auth/validate deve retornar 401 sem token', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/validate`, {});

    expect(response.status()).toBe(401);
  });
});
