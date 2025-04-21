import { Inject, Injectable } from '@nestjs/common';
import {
  OCTOKIT,
  OctokitInstance,
  GitHubRepo,
  TreeItem,
} from './octokit.provider';
import { GITHUB_IDENTITY, GitHubIdentity } from './github-identity.provider';

@Injectable()
export class GithubService {
  constructor(
    @Inject(OCTOKIT) private readonly octokit: OctokitInstance,
    @Inject(GITHUB_IDENTITY) private readonly identity: GitHubIdentity,
  ) {}

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

  async getRepoDetails(repoName: string) {
    const userName = this.identity.login;

    const { data: repo } = await this.octokit.rest.repos.get({
      owner: userName,
      repo: repoName,
    });

    const tree = await this.octokit.rest.git.getTree({
      owner: userName,
      repo: repoName,
      tree_sha: repo.default_branch,
      recursive: 'true',
    });
    const files = (tree.data.tree as TreeItem[]).filter(
      (item: TreeItem) => item.type === 'blob',
    );
    const fileCount = files.length;

    return {
      name: repo.name,
      size: repo.size,
      owner: repo.owner.login,
      isPrivate: repo.private,
      fileCount,
    };
  }
}
