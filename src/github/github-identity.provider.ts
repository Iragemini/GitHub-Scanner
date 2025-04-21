import { Provider } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { ConfigService } from '@nestjs/config';

export const GITHUB_IDENTITY = 'GITHUB_IDENTITY';

export interface GitHubIdentity {
  login: string;
  id: number;
  name?: string;
}

export const GitHubIdentityProvider: Provider = {
  provide: GITHUB_IDENTITY,
  useFactory: async (configService: ConfigService) => {
    const token = configService.get<string>('GITHUB_TOKEN');
    const octokit = new Octokit({ auth: token });

    const {
      data: { login, id, name },
    } = await octokit.rest.users.getAuthenticated();

    return {
      login,
      id,
      name,
    };
    inject: [ConfigService];
  },
};
