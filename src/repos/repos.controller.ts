import { Controller, Get, Param, Query } from '@nestjs/common';
import { GithubService } from '../github/github.service.js';
import pLimit from 'p-limit';

@Controller('repos')
export class ReposController {
  constructor(private readonly githubService: GithubService) {}
  @Get()
  async getRepos() {
    return this.githubService.getAuthenticatedUserRepos();
  }

  @Get(':repoName/details')
  async getRepoDetails(@Param('repoName') repoName: string) {
    return this.githubService.getRepoDetails(repoName);
  }

  @Get('batch')
  async getReposBatch(@Query('repos') repos: string) {
    const repoList = repos.split(',');
    const limit = pLimit(2);
    const promises = repoList.map((repo) =>
      limit(() => this.getRepoDetails(repo)),
    );

    return Promise.all(promises);
  }
}
