#!/usr/bin/env node
'use strict';
/* eslint-disable no-undef */
const {spawn} = require('child_process');
const path = require('path');
require('dotenv').config();

const commander = require('commander');
const program = new commander.Command();

program
    .command('run')
    .allowUnknownOption()
    .argument('<network>')
    .argument('<script>')
    .action(async (network, filepath, options, command) => {
        const extra = command.args.slice(2);
        const folder = path.basename(__dirname);
        if (
            filepath.startsWith(folder + '/') ||
            filepath.startsWith(folder + '\\')
        ) {
            filepath = filepath.slice(folder.length + 1);
        }
        await execute(
            `cross-env HARDHAT_DEPLOY_LOG=true HARDHAT_NETWORK=${network} node ${filepath} ${extra.join(
                ' '
            )}`
        );
    });

program
    .command('deploy')
    .allowUnknownOption()
    .argument('<network>')
    .action(async (network, options, command) => {
        const extra = command.args.slice(1);
        await execute(
            `hardhat --network ${network} deploy --report-gas ${extra.join(
                ' '
            )}`
        );
    });

program
    .command('verify')
    .allowUnknownOption()
    .argument('<network>')
    .action(async (network, options, command) => {
        const extra = command.args.slice(1);
        if (!network) {
            console.error(`need to specify the network as first argument`);
            return;
        }
        await execute(
            `hardhat --network ${network} etherscan-verify ${extra.join(' ')}`
        );
    });

program
    .command('export')
    .argument('<network>')
    .argument('<file>')
    .action(async (network, file) => {
        await execute(`hardhat --network ${network} export --export ${file}`);
    });

program
    .command('export:address')
    .argument('<network>')
    .option('--no-render')
    .action(async (network, {render}) => {
        await execute(
            `hardhat --network ${network} export-address ${
                render ? '' : '--no-render'
            }`
        );
    });

program
    .command('fork:run')
    .allowUnknownOption()
    .argument('<network>', 'forking network')
    .argument('<script>', 'script file')
    .option('--deploy')
    .option('--blockNumber [value]', 'forking blockNumber')
    .option('--no-impersonation')
    .action(
        async (
            network,
            filepath,
            {blockNumber, deploy, impersonation},
            command
        ) => {
            const extra = command.args.slice(2);
            await execute(
                `cross-env ${
                    deploy ? 'HARDHAT_DEPLOY_FIXTURE=true' : ''
                } HARDHAT_DEPLOY_LOG=true HARDHAT_FORK=${network} ${
                    blockNumber ? `HARDHAT_FORK_NUMBER=${blockNumber}` : ''
                } ${
                    !impersonation ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true` : ''
                } hardhat run ${filepath} ${extra.join(' ')}`
            );
        }
    );

program
    .command('fork:deploy')
    .allowUnknownOption()
    .argument('<network>', 'forking network')
    .option('--blockNumber [value]', 'forking blockNumber')
    .option('--no-impersonation')
    .action(async (network, {blockNumber, impersonation}, command) => {
        const extra = command.args.slice(1);
        await execute(
            `cross-env HARDHAT_FORK=${network} ${
                blockNumber ? `HARDHAT_FORK_NUMBER=${blockNumber}` : ''
            } ${
                !impersonation ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true` : ''
            } hardhat deploy --report-gas ${extra.join(' ')}`
        );
    });

program
    .command('fork:node')
    .allowUnknownOption()
    .argument('<network>', 'forking network')
    .option('--blockNumber [value]', 'forking blockNumber')
    .option('--no-impersonation')
    .action(async (network, {blockNumber, impersonation}, command) => {
        const extra = command.args.slice(1);
        await execute(
            `cross-env HARDHAT_FORK=${network} ${
                blockNumber ? `HARDHAT_FORK_NUMBER=${blockNumber}` : ''
            } ${
                !impersonation ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true` : ''
            } hardhat node --hostname 0.0.0.0 ${extra.join(' ')}`
        );
    });

program
    .command('fork:test')
    .allowUnknownOption()
    .argument('<network>', 'forking network')
    .option('--blockNumber [value]', 'forking blockNumber')
    .option('--no-impersonation')
    .action(async (network, {blockNumber, impersonation}, command) => {
        const extra = command.args.slice(1);
        await execute(
            `cross-env HARDHAT_FORK=${network} ${
                blockNumber ? `HARDHAT_FORK_NUMBER=${blockNumber}` : ''
            } ${
                !impersonation ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true` : ''
            } HARDHAT_DEPLOY_FIXTURE=true HARDHAT_COMPILE=true mocha --bail --recursive test ${extra.join(
                ' '
            )}`
        );
    });

program
    .command('fork:dev')
    .allowUnknownOption()
    .argument('<network>', 'forking network')
    .option('--blockNumber [value]', 'forking blockNumber')
    .option('--no-impersonation')
    .action(async (network, {blockNumber, impersonation}, command) => {
        const extra = command.args.slice(1);
        await execute(
            `cross-env HARDHAT_FORK=${network} ${
                blockNumber ? `HARDHAT_FORK_NUMBER=${blockNumber}` : ''
            } ${
                !impersonation ? `HARDHAT_DEPLOY_NO_IMPERSONATION=true` : ''
            } hardhat node --hostname 0.0.0.0 --watch --export contractsInfo.json ${extra.join(
                ' '
            )}`
        );
    });

function execute(command) {
    return new Promise((resolve, reject) => {
        const onExit = (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        };
        spawn(command.split(' ')[0], command.split(' ').slice(1), {
            stdio: 'inherit',
            shell: true,
        }).on('exit', onExit);
    });
}

program.parse(process.argv);
