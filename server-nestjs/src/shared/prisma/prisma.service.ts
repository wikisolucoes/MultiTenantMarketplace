import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📴 Database disconnected');
  }

  async cleanDb() {
    if (process.env.NODE_ENV === 'production') return;
    
    // Add cleanup logic for development/test environments
    const modelNames = Object.keys(this).filter(
      (key) => key[0] !== '_' && key !== '$on' && key !== '$connect' && key !== '$disconnect'
    );

    return Promise.all(
      modelNames.map((modelName) => this[modelName].deleteMany())
    );
  }
}