import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GithubModule } from './github/github.module.js';
import { ConfigModule } from '@nestjs/config';
import { ReposController } from './repos/repos.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GithubModule,
  ],
  controllers: [AppController, ReposController],
  providers: [AppService],
})
export class AppModule {}
