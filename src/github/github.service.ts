import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  OCTOKIT,
  OctokitInstance,
  GitHubRepo,
  TreeItem,
  GitHubWebhook,
} from './octokit.provider.js';
import { GITHUB_IDENTITY, GitHubIdentity } from './github-identity.provider.js';
import {
  GitHubRepositoryNotFoundError,
  GitHubUnauthorizedError,
  GitHubForbiddenError,
} from './github.errors.js';

@Injectable()
export class GithubService {
  constructor(
    @Inject(OCTOKIT) private readonly octokit: OctokitInstance,
    @Inject(GITHUB_IDENTITY) private readonly identity: GitHubIdentity,
  ) {}

  private mapRepoInfo(repo: GitHubRepo) {
    return {
      id: repo.id,
      name: repo.name,
      size: repo.size,
      owner: repo.owner.login,
    };
  }

  private handleGitHubError(error: any, repoName?: string) {
    Logger.error(`GitHub API error: ${error.message}`);

    if (error.status === 404) {
      throw new GitHubRepositoryNotFoundError(repoName || 'unknown');
    }

    if (error.status === 401) {
      throw new GitHubUnauthorizedError();
    }

    if (error.status === 403) {
      throw new GitHubForbiddenError();
    }

    // For any other error, rethrow it
    throw error;
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
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        ...options,
      });

      return data.map(this.mapRepoInfo);
    } catch (error) {
      this.handleGitHubError(error);
    }
  }

  async getRepoDetails(repoName: string) {
    const userName = this.identity.login;

    try {
      const [repoResponse, hooksResponse] = await Promise.all([
        this.octokit.rest.repos.get({
          owner: userName,
          repo: repoName,
        }),
        this.octokit.rest.repos.listWebhooks({
          owner: userName,
          repo: repoName,
        }),
      ]);

      const repo = repoResponse.data;

      const treeResponse = await this.octokit.rest.git.getTree({
        owner: userName,
        repo: repoName,
        tree_sha: repo.default_branch,
        recursive: 'true',
      });

      const files = treeResponse.data.tree.filter(
        (item): item is TreeItem & { path: string } =>
          item.type === 'blob' && item.path !== undefined,
      );
      const fileCount = files.length;

      const ymlFile = files.find((file) => file.path.endsWith('.yml'));
      let ymlContent: string | null = null;

      if (ymlFile) {
        try {
          const { data: fileData } = await this.octokit.rest.repos.getContent({
            owner: userName,
            repo: repoName,
            path: ymlFile.path,
          });

          if ('content' in fileData && fileData.content) {
            const buff = Buffer.from(fileData.content, 'base64');
            ymlContent = buff.toString('utf-8');
          }
        } catch (error) {
          Logger.warn(
            `Failed to fetch YAML content for ${repoName}: ${error.message}`,
          );
        }
      }

      const activeHooks = hooksResponse.data
        .filter((hook: GitHubWebhook) => hook.active)
        .map((hook: GitHubWebhook) => ({
          id: hook.id,
          url: hook.config?.url,
          events: hook.events,
        }));

      return {
        name: repo.name,
        size: repo.size,
        owner: repo.owner.login,
        isPrivate: repo.private,
        fileCount,
        ymlContent,
        activeHooks,
      };
    } catch (error) {
      this.handleGitHubError(error, repoName);
    }
  }
}
