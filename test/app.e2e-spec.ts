import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GithubService } from '../src/github/github.service';
import { ConfigService } from '@nestjs/config';
import { OCTOKIT } from '../src/github/octokit.provider';
import { GITHUB_IDENTITY } from '../src/github/github-identity.provider';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let githubService: GithubService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => {
          if (key === 'GITHUB_TOKEN') return 'test-token';
          if (key === 'LOG_LEVEL') return 'error';
          return null;
        }),
      })
      .overrideProvider(OCTOKIT)
      .useValue({
        rest: {
          users: {
            getAuthenticated: jest
              .fn<
                () => Promise<{
                  data: { login: string; id: number; name: string };
                }>
              >()
              .mockResolvedValue({
                data: { login: 'test-user', id: 123, name: 'Test User' },
              }),
          },
        },
      })
      .overrideProvider(GITHUB_IDENTITY)
      .useValue({ accessToken: 'test-token', login: 'test-user' })
      .overrideProvider(GithubService)
      .useValue({
        getAuthenticatedUserRepos: jest
          .fn<
            () => Promise<Array<{ name: string; size: number; owner: string }>>
          >()
          .mockResolvedValue([
            { name: 'repo-a', size: 100, owner: 'test-user' },
          ]),
        getRepoDetails: jest
          .fn<
            (repoName: string) => Promise<{
              name: string;
              size: number;
              owner: string;
              isPrivate: boolean;
              fileCount: number;
              ymlContent: string;
              activeHooks: Array<{ id: number; url: string; events: string[] }>;
            }>
          >()
          .mockResolvedValue({
            name: 'repo-a',
            size: 100,
            owner: 'test-user',
            isPrivate: false,
            fileCount: 10,
            ymlContent: 'test: yaml',
            activeHooks: [],
          }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    githubService = moduleFixture.get<GithubService>(GithubService);
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/repos', () => {
    it('GET /repos should return list of repositories', async () => {
      const response = await request(app.getHttpServer())
        .get('/repos')
        .expect(200);

      expect(response.body).toEqual([
        { name: 'repo-a', size: 100, owner: 'test-user' },
      ]);
      expect(githubService.getAuthenticatedUserRepos).toHaveBeenCalled();
    });

    it('GET /repos/:repoName/details should return repository details', async () => {
      const response = await request(app.getHttpServer())
        .get('/repos/repo-a/details')
        .expect(200);

      expect(response.body).toEqual({
        name: 'repo-a',
        size: 100,
        owner: 'test-user',
        isPrivate: false,
        fileCount: 10,
        ymlContent: 'test: yaml',
        activeHooks: [],
      });
      expect(githubService.getRepoDetails).toHaveBeenCalledWith('repo-a');
    });

    it('GET /repos/batch should handle multiple repositories', async () => {
      await request(app.getHttpServer())
        .get('/repos/batch?repos=repo-a,repo-b')
        .expect(200);

      expect(githubService.getRepoDetails).toHaveBeenCalledTimes(2);
      expect(githubService.getRepoDetails).toHaveBeenCalledWith('repo-a');
      expect(githubService.getRepoDetails).toHaveBeenCalledWith('repo-b');
    });

    it('GET /repos/batch should limit concurrent operations to 2', async () => {
      const activeOperations = new Set<string>();
      let maxConcurrent = 0;

      (githubService.getRepoDetails as jest.Mock).mockImplementation(
        async (repoName: string) => {
          activeOperations.add(repoName);
          maxConcurrent = Math.max(maxConcurrent, activeOperations.size);

          await new Promise((resolve) => setTimeout(resolve, 100));

          activeOperations.delete(repoName);
          return {
            name: repoName,
            size: 100,
            owner: 'test-user',
            isPrivate: false,
            fileCount: 10,
            ymlContent: 'test: yaml',
            activeHooks: [],
          };
        },
      );

      await request(app.getHttpServer())
        .get('/repos/batch?repos=repo-a,repo-b,repo-c,repo-d')
        .expect(200);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
      expect(githubService.getRepoDetails).toHaveBeenCalledTimes(4);
    });
  });
});
