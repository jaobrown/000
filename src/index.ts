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

  const teams = await fetchTeams(response.apiKey);
  const teamChoices = teams.map(team => ({ name: team.name, value: team.id }));

  const teamResponse = await inquirer.prompt([
    {
      type: 'list',
      name: 'teamId',
      message: 'Select your default team:',
      choices: teamChoices,
    },
  ]);

  await keytar.setPassword(SERVICE_NAME, 'default-team', teamResponse.teamId);
}

async function getApiKey(): Promise<string | null> {
  return await keytar.getPassword(SERVICE_NAME, 'api-key');
}

async function createIssueAndCheckoutBranch(apiKey: string, issueTitle: string, selectTeam?: boolean) {
  const linearClient = new LinearClient({ apiKey });
  const defaultTeamId = await keytar.getPassword(SERVICE_NAME, 'default-team');

  let teamId = defaultTeamId;
  if (selectTeam) {
    const teams = await fetchTeams(apiKey);
    const teamChoices = teams.map(team => ({ name: team.name, value: team.id }));
    const teamResponse = await inquirer.prompt([
      {
        type: 'list',
        name: 'teamId',
        message: 'Select a team for this issue:',
        choices: teamChoices,
      },
    ]);
    teamId = teamResponse.teamId;
  }

  const viewer = await linearClient.viewer;

  if (!teamId) {
    console.log('No default team found. Please use `000 update-team` to set your default team.');
    return;
  }

  try {
    const selectedTeam = await linearClient.team(teamId);
    const statesForSelectedTeam = await selectedTeam.states();
    const inProgressStateIdForSelectedTeam = statesForSelectedTeam.nodes.find(
      state => state.name.includes('Progress')
    )?.id;

    const issueResponse = await linearClient.createIssue({
      teamId,
      title: `${issueTitle}`,
      description: 'Generated from 000 cli',
      assigneeId: viewer.id,
      stateId: inProgressStateIdForSelectedTeam,
      estimate: 1,
      priority: 2,
    });

    const issue = await issueResponse.issue;

    if (issue) {
      console.log(`Issue created: ${issue.title} with ID ${issue.identifier}`);
      execSync(`git checkout -b ${issue.branchName}`, { stdio: 'inherit' });
      console.log(`Issue URL: ${issue.url}`);
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

async function fetchTeams(apiKey: string): Promise<{ id: string; name: string }[]> {
  const linearClient = new LinearClient({ apiKey });
  try {
    const teams = await linearClient.teams();
    return teams.nodes.map(team => ({
      name: team.name,
      id: team.id
    }));
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
}

async function updateDefaultTeam() {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.log('No API key found. Please use `000 login` first.');
    return;
  }

  const teams = await fetchTeams(apiKey);
  const teamChoices = teams.map(team => ({ name: team.name, value: team.id }));

  const teamResponse = await inquirer.prompt([
    {
      type: 'list',
      name: 'teamId',
      message: 'Select your new default team:',
      choices: teamChoices,
    },
  ]);

  await keytar.setPassword(SERVICE_NAME, 'default-team', teamResponse.teamId);
  console.log('Default team updated successfully.');
}

async function main() {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case 'login':
      await storeApiKey();
      break;
    case 'fix':
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.log('No API key found. Please login using `000 login`.');
        return;
      }
      if (args.length === 0) {
        console.log('Please provide a brief issue title for the fix command.');
        return;
      }
      const issueTitle = args.join(' ');
      await createIssueAndCheckoutBranch(apiKey, issueTitle);
      break;
    case 'update-team':
      await updateDefaultTeam();
      break;
    default:
      console.log('Unknown command. Available commands are `login` and `fix`.');
  }
}

main();
