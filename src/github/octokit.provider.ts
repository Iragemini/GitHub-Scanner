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
export type ApiResponseItem<
  T extends (...args: any[]) => any,
  U extends keyof Awaited<ReturnType<T>>,
> = Awaited<ReturnType<T>>[U][number];

export type GitHubRepo = ApiResponseItem<
  OctokitInstance['repos']['listForAuthenticatedUser'],
  'data'
>;

export type TreeItem = ApiResponseItem<
  OctokitInstance['rest']['git']['getTree'],
  'data'
>;

export type GitHubWebhook = ApiResponseItem<
  OctokitInstance['rest']['repos']['listWebhooks'],
  'data'
>;
