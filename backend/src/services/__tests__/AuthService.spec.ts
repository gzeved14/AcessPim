import { DataSource } from 'typeorm';
import { Usuario } from '../../entities/Usuario';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload) => `signed-${JSON.stringify(payload)}`),
  verify: jest.fn((token) => ({ sub: 'user-id' })),
  decode: jest.fn((token) => ({ exp: Math.floor(Date.now() / 1000) + 3600 })),
}));

// Import AuthService after basic module mocks
const { AuthService } = require('../AuthService');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  let service: any;
  let mockRepo: any;
  let mockDataSource: any;
  // will inject a mocked tokenBlacklistService into the service instance

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };
    mockDataSource = {
      getRepository: jest.fn(() => mockRepo),
    };
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';
    const ds = mockDataSource as unknown as DataSource;
    service = new AuthService(ds);
    // inject a lightweight mock for tokenBlacklistService to avoid constructing the real one
    service.tokenBlacklistService = {
      add: jest.fn(),
      isBlacklisted: jest.fn(),
    };
  });

  it('login returns tokens and usuario on valid credentials', async () => {
    const user = {
      id: 'user-id',
      nome: 'Test User',
      email: 'test@example.com',
      senha_hash: 'hash',
      cargo: 'ADMIN',
      matricula: '123',
      setor: 'TI',
    } as unknown as Usuario;
    (mockRepo.findOne as jest.Mock).mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login('test@example.com', 'password', { ip: '1.2.3.4', userAgent: 'agent' });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.usuario).toMatchObject({ id: 'user-id', email: 'test@example.com' });
    expect(jwt.sign).toHaveBeenCalled();
  });

  it('login throws on invalid password', async () => {
    const user = { senha_hash: 'hash' } as unknown as Usuario;
    (mockRepo.findOne as jest.Mock).mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.login('a@b.com', 'bad', { ip: '', userAgent: '' })).rejects.toThrow();
  });

  it('refresh returns new tokens for valid refresh token', async () => {
    const user = { id: 'user-id', nome: 'Test' } as unknown as Usuario;
    (jwt.verify as jest.Mock).mockReturnValue({ sub: 'user-id' });
    (mockRepo.findOneBy as jest.Mock).mockResolvedValue(user);

    const tokens = await service.refresh('some-refresh-token');

    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
  });

  it('logout adds both tokens to blacklist when exp present', async () => {
    const tbAdd = service.tokenBlacklistService.add;
    // jwt.decode mocked to return exp by default
    await service.logout({ refreshToken: 'r', accessToken: 'a' });
    expect(tbAdd).toHaveBeenCalledTimes(2);
    expect(tbAdd).toHaveBeenCalledWith('r', expect.any(Date));
    expect(tbAdd).toHaveBeenCalledWith('a', expect.any(Date));
  });

  it('logout does not add when token decode has no exp', async () => {
    const tbAdd = service.tokenBlacklistService.add;
    // make first decode return null
    (jwt.decode as jest.Mock).mockReturnValueOnce(null);
    await service.logout({ refreshToken: 'r', accessToken: 'a' });
    // first token not added, but second still added
    expect(tbAdd).toHaveBeenCalledTimes(1);
  });

  it('logout catches errors from blacklist and does not throw', async () => {
    const tbAdd = service.tokenBlacklistService.add;
    tbAdd.mockImplementationOnce(() => { throw new Error('fail'); });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(service.logout({ refreshToken: 'r', accessToken: 'a' })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
