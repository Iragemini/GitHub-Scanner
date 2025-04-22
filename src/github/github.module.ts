import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OctokitProvider } from './octokit.provider.js';
import { GithubService } from './github.service.js';
import { GitHubIdentityProvider } from './github-identity.provider.js';

@Module({
  imports: [ConfigModule],
  providers: [OctokitProvider, GithubService, GitHubIdentityProvider],
  exports: [GithubService],
})
export class GithubModule {}
