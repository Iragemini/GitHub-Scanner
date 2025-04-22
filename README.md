# GitHub Scanner

A NestJS application that scans GitHub repositories and provides detailed information about them.

## Features

- List authenticated user's repositories
- Get detailed information about specific repositories
- Concurrent repository scanning with a limit of 2 operations
- Configurable log levels for better debugging

## API Endpoints

### GET /repos
Lists all repositories for the authenticated user.

**Response:**
```json
[
  {
    "name": "repo-name",
    "size": 100,
    "owner": "username"
  }
]
```

### GET /repos/:repoName/details
Gets detailed information about a specific repository.

**Response:**
```json
{
  "name": "repo-name",
  "size": 100,
  "owner": "username",
  "isPrivate": false,
  "fileCount": 10,
  "ymlContent": "test: yaml",
  "activeHooks": [
    {
      "id": 1,
      "url": "http://example.com",
      "events": ["push"]
    }
  ]
}
```

### GET /repos/batch?repos=repo1,repo2
Scans multiple repositories concurrently (limited to 2 at a time).

**Response:**
```json
[
  {
    "name": "repo1",
    "size": 100,
    "owner": "username",
    "isPrivate": false,
    "fileCount": 10,
    "ymlContent": "test: yaml",
    "activeHooks": []
  },
  {
    "name": "repo2",
    "size": 200,
    "owner": "username",
    "isPrivate": true,
    "fileCount": 20,
    "ymlContent": null,
    "activeHooks": []
  }
]
```

## Error Handling

The application provides proper error handling with appropriate HTTP status codes:

- `404 Not Found`: When a repository doesn't exist
- `401 Unauthorized`: When GitHub authentication fails
- `403 Forbidden`: When access to a repository is denied

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your GitHub token and log level:
```
GITHUB_TOKEN=your_github_token
LOG_LEVEL=error  # Available levels: error, warn, log, debug, verbose
```

4. Run the application:
```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Log Levels

The application supports different log levels to help with debugging:

- `error`: Only error messages (default)
- `warn`: Warnings and errors
- `log`: General information, warnings, and errors
- `debug`: Detailed debugging information
- `verbose`: Most detailed logging

Example of setting different log levels:
```bash
# Set log level via environment variable
LOG_LEVEL=debug npm run start:dev

# Or in .env file
LOG_LEVEL=debug
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```

## Deployment

The application is deployed to Heroku and available at:
[https://github-scanner-36faf018c358.herokuapp.com/](https://github-scanner-36faf018c358.herokuapp.com/)


## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
