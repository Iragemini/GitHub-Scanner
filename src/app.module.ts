import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubService } from './github/github.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, GithubService],
})
export class AppModule {}
