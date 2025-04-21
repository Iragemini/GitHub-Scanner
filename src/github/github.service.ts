import { Inject, Injectable } from '@nestjs/common';
import { OCTOKIT, OctokitInstance, GitHubRepo } from './octokit.provider';

@Injectable()
export class GithubService {
  constructor(@Inject(OCTOKIT) private readonly octokit: OctokitInstance) {}

  private mapRepoInfo(repo: GitHubRepo) {
    return {
      name: repo.name,
      size: repo.size,
      owner: repo.owner.login,
    };
  }

  async getAuthenticatedUserRepos(options?: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: string;
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }) {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      ...options,
    });

    return data.map(this.mapRepoInfo);
  }
}
