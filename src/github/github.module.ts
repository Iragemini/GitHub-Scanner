import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OctokitProvider } from './octokit.provider';
import { GithubService } from './github.service';

@Module({
  imports: [ConfigModule],
  providers: [OctokitProvider, GithubService],
  exports: [GithubService],
})
export class GithubModule {}
