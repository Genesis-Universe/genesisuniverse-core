require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-solhint');
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-ethers');
require('hardhat-spdx-license-identifier');
require('hardhat-watcher');
require('hardhat-abi-exporter');
require('hardhat-deploy');
require('solidity-coverage');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');
require('dotenv').config();

const {removeConsoleLog} = require('hardhat-preprocessor');

const {node_url, accounts, addForkConfiguration} = require('./utils/network');

const external = {
    contracts: [
        {
            artifacts: 'node_modules/@uniswap/v2-core/build',
        },
        {
            artifacts: 'node_modules/@uniswap/v2-periphery/build',
        },
    ],
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    docgen: {
        path: './docs',
        clear: true,
        runOnCompile: true,
        testMode: false,
        except: ['^contracts/mocks', '^contracts/test'],
    },
    gasReporter: {
        currency: 'USD',
        token: 'BNB',
        gasPriceApi:
            'https://api.bscscan.com/api?module=proxy&action=eth_gasPrice',
        enabled: process.env.REPORT_GAS === 'true',
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        maxMethodDiff: 1,
    },
    render: {
        // only: [],
        except: ['^UniswapV2'],
    },
    abiExporter: {
        path: './abi',
        clear: false,
        flat: true,
        // only: [],
        // except: []
    },
    networks: addForkConfiguration({
        hardhat: {
            live: false,
            saveDeployments: false,
            tags: ['local'],
        },
        'bsc-testnet': {
            url: node_url('bsc-testnet'),
            accounts: accounts('bsc-testnet'),
            chainId: 97,
            gas: 2100000,
            gasPrice: 20000000000,
        },
        'bsc-mainnet': {
            url: node_url('bsc-mainnet'),
            accounts: accounts('bsc-mainnet'),
            chainId: 56,
            gasMultiplier: 1.5,
            tags: ['bsc', 'mainnet'],
        },
    }),
    external: process.env.HARDHAT_FORK
        ? {
              ...external,
              deployments: {
                  hardhat: ['deployments/' + process.env.HARDHAT_FORK],
              },
          }
        : {...external},
    mocha: {
        timeout: 200000,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            'bsc-mainnet': '0xCB041176b2A9ca1CF0bF5aE70aA5e46d177DE4B1',
        },
        admin: {
            default: 1,
            'bsc-mainnet': '0x4E805f38fF4EAa483996005A069ECF6102D01920',
        },
        treasury: {
            default: 2,
        },
        nftMarketplaceFeeReceiver: {
            default: 3,
        },
        icoBeneficiary: {
            default: 4,
            'bsc-mainnet': '0x44a2295AD0Fe04dc4E35c80447EF02D10700973A',
        },
        owner: 'admin',
        upgradeAdmin: 'admin',
        /**
         * Token Distribution
         */
        playToEarn: {
            default: 5,
            'bsc-mainnet': '0xe814B3113D8bdfd21185325dA7cB5d78C1d07242',
        },
        privateSale: {
            default: 6,
            'bsc-mainnet': '0x9cBFDf30AeCcC0B02523C156c969EaAF2e2597a5',
        },
        team: {
            default: 7,
            'bsc-mainnet': '0x738B782Ce662508A224ea25943d2a4af11323831',
        },
        stakingPool: {
            default: 8,
            'bsc-mainnet': '0xF356764EfA63F9a3E770c5b572e96BE261Fb3265',
        },
        marketing: {
            default: 9,
            'bsc-mainnet': '0x64F1f0CB589AFb2B4cDb6B0Fd4453AC7738C4a85',
        },
        operation: {
            default: 10,
            'bsc-mainnet': '0x3195a58445AE987A4208Ef292DDF7B1877697085',
        },
    },
    preprocess: {
        eachLine: removeConsoleLog(
            (bre) =>
                bre.network.name !== 'hardhat' &&
                bre.network.name !== 'localhost'
        ),
    },
    solidity: {
        compilers: [
            {
                version: '0.8.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.7.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.5.16',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: '0.6.6',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    spdxLicenseIdentifier: {
        overwrite: false,
        runOnCompile: true,
    },
    contractSizer: {
        alphaSort: false,
        runOnCompile: false,
        disambiguatePaths: false,
    },
    watcher: {
        compile: {
            tasks: ['compile'],
            files: ['./contracts'],
            verbose: true,
        },
    },
};
