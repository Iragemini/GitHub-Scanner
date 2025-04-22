import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
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
    const repoList = repos.split(',').filter((repo) => !!repo);
    const limit = pLimit(2);
    const promises = repoList.map((repo) =>
      limit(() => this.getRepoDetails(repo)),
    );

    const response = await Promise.allSettled(promises);

    const fulfilled = response
      .filter(
        (item): item is PromiseFulfilledResult<any> =>
          item.status === 'fulfilled',
      )
      .map((item) => item.value);

    const rejected = response
      .filter(
        (item): item is PromiseRejectedResult => item.status === 'rejected',
      )
      .map((item) => item.reason);

    if (rejected.length) {
      Logger.warn(
        `Rejected repos: ${JSON.stringify(rejected)}`,
        ReposController.name,
      );
    }

    return fulfilled;
  }
}
