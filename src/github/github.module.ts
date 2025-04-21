import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OctokitProvider } from './octokit.provider';
import { GithubService } from './github.service';
import { GitHubIdentityProvider } from './github-identity.provider';

@Module({
  imports: [ConfigModule],
  providers: [OctokitProvider, GithubService, GitHubIdentityProvider],
  exports: [GithubService],
})
export class GithubModule {}
