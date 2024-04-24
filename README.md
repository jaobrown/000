# Project 000 CLI Tool

## Overview
The 000 CLI tool is a command-line interface application designed to interact with the Linear API. It allows users to store their Linear API key, manage their default team, and create issues in Linear directly from the terminal.

## Features
- **Login**: Store your Linear API key securely.
- **Update Team**: Set or update your default team.
- **Fix**: Create a new issue and checkout a new git branch for it.

## Prerequisites
- Node.js installed on your system.
- Access to Linear API and a generated API key.

## Installation
To install the CLI tool, clone the repository and run `npm install` to install the dependencies. After installing the dependencies, build the package and link it globally to your system:

```shell
npm run build
npm link
```

This will make the `000` command available globally on your machine.

## Usage

### Login
To store your Linear API key, run:
```shell
000 login
```
This will prompt you to enter your Linear API key and select your default team.

### Update Default Team
To update your default team, run:
```shell
000 update-team
```
This will prompt you to select a new default team from the list of available teams.

### Create Issue and Checkout Branch
To create a new issue in Linear and checkout a new git branch for it, run:
```shell
000 fix [issue-title]
```
Replace `[issue-title]` with a brief title for the issue. The command will create the issue and checkout a new branch with the issue's branch name.

## Configuration
The project uses TypeScript and is configured to transpile to JavaScript. The output is directed to the `dist` directory.

## Building
To build the project, run:
```shell
npm run build
```

## Contributing
Contributions to the project are welcome. Please ensure that you follow the existing code style and add tests for any new features or fixes.

## License
The project is licensed under the ISC license.