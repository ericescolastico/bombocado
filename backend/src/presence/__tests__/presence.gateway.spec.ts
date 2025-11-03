import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { PresenceGateway } from '../presence.gateway';
import { PresenceService } from '../presence.service';
import { RedisService } from '../../infra/redis/redis.service';
import { Server, Socket } from 'socket.io';

describe('PresenceGateway', () => {
  let gateway: PresenceGateway;
  let presenceService: PresenceService;
  let redisService: RedisService;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      adapter: jest.fn(),
      emit: jest.fn(),
    };

    mockSocket = {
      id: 'socket123',
      handshake: {
        auth: {},
        query: {},
        headers: {},
      } as any,
      disconnect: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
      userId: undefined,
      user: undefined,
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
        }),
      ],
      providers: [
        PresenceGateway,
        {
          provide: PresenceService,
          useValue: {
            beat: jest.fn(),
            getSnapshot: jest.fn(),
            isOnline: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getPubSubClients: jest.fn(() => ({
              pubClient: {} as any,
              subClient: {} as any,
            })),
          },
        },
      ],
    }).compile();

    gateway = module.get<PresenceGateway>(PresenceGateway);
    presenceService = module.get<PresenceService>(PresenceService);
    redisService = module.get<RedisService>(RedisService);

    // Mock @WebSocketServer() decorator
    (gateway as any).server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should reject connection without token', async () => {
      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should accept connection with valid token', async () => {
      // Mock JWT verification
      const jwtService = (gateway as any).jwtService;
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'user123',
        id: 'user123',
      });

      jest.spyOn(presenceService, 'getSnapshot').mockResolvedValue([
        { userId: 'user123', online: true, lastSeen: '2024-01-15T10:30:00.000Z' },
      ]);

      mockSocket.handshake.auth = { token: 'valid-token' };

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).not.toHaveBeenCalled();
      expect(mockSocket.join).toHaveBeenCalledWith('user:user123');
    });

    it('should reject connection with invalid token', async () => {
      const jwtService = (gateway as any).jwtService;
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      mockSocket.handshake.auth = { token: 'invalid-token' };

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleHeartbeat', () => {
    it('should process heartbeat from leader', async () => {
      const mockAuthenticatedSocket = {
        ...mockSocket,
        userId: 'user123',
      } as any;

      jest.spyOn(presenceService, 'beat').mockResolvedValue({
        online: true,
        lastSeen: '2024-01-15T10:30:00.000Z',
        isNewOnline: false,
      });

      // Mock rate limiting (set last beat to allow this one)
      (gateway as any).rateLimitMap.set('socket123', Date.now() - 11000);

      await gateway.handleHeartbeat(mockAuthenticatedSocket);

      expect(presenceService.beat).toHaveBeenCalledWith('user123');
    });

    it('should reject heartbeat without userId', async () => {
      await gateway.handleHeartbeat(mockSocket as any);

      expect(presenceService.beat).not.toHaveBeenCalled();
    });

    it('should rate limit frequent heartbeats', async () => {
      const mockAuthenticatedSocket = {
        ...mockSocket,
        userId: 'user123',
      } as any;

      // Set last beat to recent (rate limited)
      (gateway as any).rateLimitMap.set('socket123', Date.now() - 5000);

      await gateway.handleHeartbeat(mockAuthenticatedSocket);

      expect(presenceService.beat).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up on disconnect', async () => {
      const mockAuthenticatedSocket = {
        ...mockSocket,
        userId: 'user123',
      } as any;

      await gateway.handleDisconnect(mockAuthenticatedSocket);

      expect((gateway as any).rateLimitMap.has('socket123')).toBe(false);
    });
  });
});

