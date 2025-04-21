import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { Provider } from '@nestjs/common';

export const OCTOKIT = 'OCTOKIT';

export const OctokitProvider: Provider = {
  provide: OCTOKIT,
  useFactory: (configService: ConfigService) => {
    const token = configService.get<string>('GITHUB_TOKEN');
    return new Octokit({ auth: token });
  },
  inject: [ConfigService],
};

export type OctokitInstance = ReturnType<typeof OctokitProvider.useFactory>;

export type GitHubRepo = Awaited<
  ReturnType<OctokitInstance['repos']['listForAuthenticatedUser']>
>['data'][number];
