import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { GithubService } from './github.service';
import { OCTOKIT, OctokitInstance } from './octokit.provider';
import { GITHUB_IDENTITY } from './github-identity.provider';

type MockResponse<T> = jest.Mock<(...args: any[]) => Promise<{ data: T }>>;

describe('GithubService', () => {
  let service: GithubService;
  let mockedOctokit: {
    repos: {
      listForAuthenticatedUser: MockResponse<
        { name: string; size: number; owner: { login: string } }[]
      >;
    };
    rest: {
      users: {
        getAuthenticated: MockResponse<{ login: string }>;
      };
      repos: {
        listForAuthenticatedUser: MockResponse<
          { name: string; size: number; owner: { login: string } }[]
        >;
        get: MockResponse<{
          name: string;
          size: number;
          owner: { login: string };
          private: boolean;
          default_branch: string;
        }>;
        getContent: MockResponse<{ content: string }>;
        listWebhooks: MockResponse<
          {
            id: number;
            active: boolean;
            config: { url: string };
            events: string[];
          }[]
        >;
      };
      git: {
        getTree: MockResponse<{ tree: { path: string; type: string }[] }>;
      };
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedOctokit = {
      repos: {
        listForAuthenticatedUser: jest
          .fn<
            (...args: any[]) => Promise<{
              data: { name: string; size: number; owner: { login: string } }[];
            }>
          >()
          .mockImplementation(() =>
            Promise.resolve({
              data: [
                { name: 'repo-a', size: 100, owner: { login: 'test-user' } },
              ],
            }),
          ),
      },
      rest: {
        users: {
          getAuthenticated: jest
            .fn<(...args: any[]) => Promise<{ data: { login: string } }>>()
            .mockImplementation(() =>
              Promise.resolve({ data: { login: 'test-user' } }),
            ),
        },
        repos: {
          listForAuthenticatedUser: jest
            .fn<
              (...args: any[]) => Promise<{
                data: {
                  name: string;
                  size: number;
                  owner: { login: string };
                }[];
              }>
            >()
            .mockImplementation(() =>
              Promise.resolve({
                data: [
                  { name: 'repo-a', size: 100, owner: { login: 'test-user' } },
                ],
              }),
            ),
          get: jest
            .fn<
              (...args: any[]) => Promise<{
                data: {
                  name: string;
                  size: number;
                  owner: { login: string };
                  private: boolean;
                  default_branch: string;
                };
              }>
            >()
            .mockImplementation(() =>
              Promise.resolve({
                data: {
                  name: 'repo-a',
                  size: 100,
                  owner: { login: 'test-user' },
                  private: false,
                  default_branch: 'main',
                },
              }),
            ),
          getContent: jest
            .fn<(...args: any[]) => Promise<{ data: { content: string } }>>()
            .mockImplementation(() =>
              Promise.resolve({
                data: { content: Buffer.from('test: yaml').toString('base64') },
              }),
            ),
          listWebhooks: jest
            .fn<
              (...args: any[]) => Promise<{
                data: {
                  id: number;
                  active: boolean;
                  config: { url: string };
                  events: string[];
                }[];
              }>
            >()
            .mockImplementation(() =>
              Promise.resolve({
                data: [
                  {
                    id: 1,
                    active: true,
                    config: { url: 'http://example.com' },
                    events: ['push'],
                  },
                ],
              }),
            ),
        },
        git: {
          getTree: jest
            .fn<
              (
                ...args: any[]
              ) => Promise<{ data: { tree: { path: string; type: string }[] } }>
            >()
            .mockImplementation(() =>
              Promise.resolve({
                data: {
                  tree: [
                    { path: 'test.yml', type: 'blob' },
                    { path: 'file2.txt', type: 'blob' },
                    { path: 'dir1', type: 'tree' },
                    { path: 'dir1/file3.yml', type: 'blob' },
                  ],
                },
              }),
            ),
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        {
          provide: OCTOKIT,
          useValue: mockedOctokit as unknown as OctokitInstance,
        },
        {
          provide: GITHUB_IDENTITY,
          useValue: { accessToken: 'test-token', login: 'test-user' },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return list of authenticated user repos', async () => {
    const repos = await service.getAuthenticatedUserRepos();
    expect(repos).toEqual([
      {
        name: 'repo-a',
        size: 100,
        owner: 'test-user',
      },
    ]);
    expect(mockedOctokit.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
      per_page: 100,
    });
  });

  it('should return repo details with file count, yml content, and active hooks', async () => {
    const details = await service.getRepoDetails('repo-a');
    expect(details).toEqual({
      name: 'repo-a',
      size: 100,
      owner: 'test-user',
      isPrivate: false,
      fileCount: 3,
      ymlContent: 'test: yaml',
      activeHooks: [
        {
          id: 1,
          url: 'http://example.com',
          events: ['push'],
        },
      ],
    });

    expect(mockedOctokit.rest.repos.get).toHaveBeenCalledWith({
      owner: 'test-user',
      repo: 'repo-a',
    });

    expect(mockedOctokit.rest.git.getTree).toHaveBeenCalledWith({
      owner: 'test-user',
      repo: 'repo-a',
      tree_sha: 'main',
      recursive: 'true',
    });
  });
});
