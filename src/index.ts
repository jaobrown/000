#!/usr/bin/env node
import { LinearClient } from '@linear/sdk';
import inquirer from 'inquirer';
import keytar from 'keytar';
import { execSync } from 'child_process';

const SERVICE_NAME = 'linear-cli-tool';

async function storeApiKey() {
  const response = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Linear API key:',
      validate: input => !!input || 'API key is required!',
    },
  ]);

  await keytar.setPassword(SERVICE_NAME, 'api-key', response.apiKey);
  console.log('Linear API key stored successfully.');
}

async function getApiKey(): Promise<string | null> {
  return await keytar.getPassword(SERVICE_NAME, 'api-key');
}

async function createIssueAndCheckoutBranch(apiKey: string, issueTitle: string) {
  const linearClient = new LinearClient({ apiKey });

  const viewer = await linearClient.viewer;
  const teams = await viewer.teams();

  const firstTeamId = teams.nodes[0].id;

  try {
    const issueResponse = await linearClient.createIssue({
      teamId: firstTeamId,
      title: issueTitle,
      description: 'Generated from CLI',
    });

    const issue = await issueResponse.issue;

    if (issue) {
      console.log(`Issue created: ${issue.title} with ID ${issue.identifier}`);
      execSync(`git checkout -b ${issue.branchName}`, { stdio: 'inherit' });
      console.log(`Checked out to new branch: ${issue.branchName}`);
    } else {
      console.error('Failed to create issue.');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
  }
}

async function main() {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case 'login':
      await storeApiKey();
      break;
    case 'checkout':
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.log('No API key found. Please login using `000 login`.');
        return;
      }
      if (args.length === 0) {
        console.log('Please provide a brief issue title for the checkout command.');
        return;
      }
      const issueTitle = args.join(' ');
      await createIssueAndCheckoutBranch(apiKey, issueTitle);
      break;
    default:
      console.log('Unknown command. Available commands are `login` and `checkout`.');
  }
}

main();
