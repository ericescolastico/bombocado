import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

export interface RedisConfigOptions {
  host: string;
  port: number;
  password?: string;
  tls?: boolean;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClient | null = null;
  private pubClient: RedisClient | null = null;
  private subClient: RedisClient | null = null;

  onModuleInit() {
    this.getClient();
  }

  async onModuleDestroy() {
    await Promise.all([
      this.client?.quit().catch(() => this.client?.disconnect()),
      this.pubClient?.quit().catch(() => this.pubClient?.disconnect()),
      this.subClient?.quit().catch(() => this.subClient?.disconnect()),
    ]);
  }

  getClient(): RedisClient {
    if (!this.client) {
      const opts = this.getOptionsFromEnv();
      this.client = this.createClient(opts);
      this.logger.log(`Redis client connected to ${opts.host}:${opts.port}`);
    }
    return this.client;
  }

  getPubSubClients(): { pubClient: RedisClient; subClient: RedisClient } {
    if (!this.pubClient || !this.subClient) {
      const opts = this.getOptionsFromEnv();
      try {
        this.pubClient = this.createClient(opts);
        this.subClient = this.createClient(opts);
        this.logger.log(`Redis pub/sub clients created for ${opts.host}:${opts.port}`);
      } catch (error) {
        this.logger.error(`Failed to create Redis pub/sub clients: ${error}`);
        throw error;
      }
    }
    return { pubClient: this.pubClient, subClient: this.subClient };
  }

  private getOptionsFromEnv(): RedisConfigOptions {
    return {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === 'true',
    };
  }

  private createClient(opts: RedisConfigOptions): RedisClient {
    const { host, port, password, tls } = opts;
    const client = new Redis({
      host,
      port,
      password,
      tls: tls ? {} : undefined,
      lazyConnect: false,
      enableReadyCheck: true,
      maxRetriesPerRequest: null,
      retryStrategy: () => null, // Não reconectar automaticamente
    });

    // Tratar erros de conexão
    client.on('error', (error) => {
      if (error.message.includes('ECONNREFUSED')) {
        this.logger.warn(`Redis connection refused (${host}:${port}). Make sure Redis is running.`);
      } else {
        this.logger.error(`Redis client error: ${error.message}`);
      }
    });

    client.on('connect', () => {
      this.logger.log(`Redis client connected to ${host}:${port}`);
    });

    return client;
  }
}


