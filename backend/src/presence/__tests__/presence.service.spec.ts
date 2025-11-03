import { Test, TestingModule } from '@nestjs/testing';
import { PresenceService } from '../presence.service';
import { RedisService } from '../../infra/redis/redis.service';
import Redis from 'ioredis';

describe('PresenceService', () => {
  let service: PresenceService;
  let redisService: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    // Mock Redis client
    mockRedisClient = {
      exists: jest.fn(),
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exec: jest.fn(),
    } as any;

    // Mock RedisService
    const mockRedisService = {
      getClient: jest.fn(() => mockRedisClient),
      getPubSubClients: jest.fn(() => ({
        pubClient: mockRedisClient,
        subClient: mockRedisClient,
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresenceService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('beat', () => {
    it('should mark user as new online when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.beat('user123');

      expect(result.isNewOnline).toBe(true);
      expect(result.online).toBe(true);
      expect(result.lastSeen).toBeDefined();
      expect(mockRedisClient.exists).toHaveBeenCalledWith('presence:user:user123');
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'presence:user:user123',
        90,
        expect.any(String),
      );
    });

    it('should update existing user without marking as new online', async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.setex.mockResolvedValue('OK');

      const result = await service.beat('user123');

      expect(result.isNewOnline).toBe(false);
      expect(result.online).toBe(true);
      expect(result.lastSeen).toBeDefined();
    });
  });

  describe('isOnline', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.isOnline('user123');

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('presence:user:user123');
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.isOnline('user123');

      expect(result).toBe(false);
    });
  });

  describe('getSnapshot', () => {
    it('should return empty array for empty userIds', async () => {
      const result = await service.getSnapshot([]);

      expect(result).toEqual([]);
    });

    it('should return snapshot for multiple users', async () => {
      const userIds = ['user1', 'user2'];
      mockRedisClient.exec.mockResolvedValue([
        [null, 1], // exists for user1
        [null, '2024-01-15T10:30:00.000Z'], // get for user1
        [null, 0], // exists for user2
        [null, null], // get for user2
      ]);

      // Mock pipeline
      const mockPipeline = {
        exists: jest.fn().mockReturnThis(),
        get: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 1],
          [null, '2024-01-15T10:30:00.000Z'],
          [null, 0],
          [null, null],
        ]),
      };

      mockRedisClient.pipeline = jest.fn(() => mockPipeline as any);

      const result = await service.getSnapshot(userIds);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user1');
      expect(result[0].online).toBe(true);
      expect(result[1].userId).toBe('user2');
      expect(result[1].online).toBe(false);
    });
  });

  describe('getLastSeen', () => {
    it('should return lastSeen when key exists', async () => {
      mockRedisClient.get.mockResolvedValue('2024-01-15T10:30:00.000Z');

      const result = await service.getLastSeen('user123');

      expect(result).toBe('2024-01-15T10:30:00.000Z');
      expect(mockRedisClient.get).toHaveBeenCalledWith('presence:user:user123');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getLastSeen('user123');

      expect(result).toBeNull();
    });
  });
});

