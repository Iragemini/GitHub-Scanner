import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { LogLevel } from '@nestjs/common';

const levelMap: Record<string, LogLevel[]> = {
  error: ['error'],
  warn: ['warn'],
  log: ['log'],
  debug: ['debug'],
  verbose: ['verbose'],
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logLevel = configService.get<string>('LOG_LEVEL') ?? 'error';

  app.useLogger(levelMap[logLevel] ?? ['error']);
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
