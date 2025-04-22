import { Controller, Get, Param } from '@nestjs/common';
import { GithubService } from '../github/github.service.js';

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
}
