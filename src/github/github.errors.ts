import { HttpException, HttpStatus } from '@nestjs/common';

export class GitHubRepositoryNotFoundError extends HttpException {
  constructor(repoName: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Repository '${repoName}' not found`,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class GitHubUnauthorizedError extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'GitHub authentication failed',
        error: 'Unauthorized',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class GitHubForbiddenError extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Access to GitHub resource forbidden',
        error: 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
