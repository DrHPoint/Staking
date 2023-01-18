import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
import { task } from "hardhat/config";
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { hexConcat } from "@ethersproject/bytes";
import "@nomiclabs/hardhat-waffle";
import '@nomiclabs/hardhat-etherscan'
import "solidity-coverage";
//import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "hardhat-docgen";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter"
import "./tasks";

require('@nomiclabs/hardhat-ethers');

require('solidity-coverage')
require('dotenv').config()
require('./tasks')

const chainIds: { [key: string]: number } = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  mainnet: 1
}

let mnemonic: string
if (!process.env.MNEMONIC) {
  throw new Error('Please set your MNEMONIC in a .env file')
} else {
  mnemonic = process.env.MNEMONIC
}

let infuraApiKey: string
if (!process.env.INFURA_API_KEY) {
  throw new Error('Please set your INFURA_API_KEY in a .env file')
} else {
  infuraApiKey = process.env.INFURA_API_KEY
}

function createNetworkConfig(network: string) {
  const url = 'https://' + network + '.infura.io/v3/' + infuraApiKey
  return {
    accounts: {
      count: 10,
      initialIndex: 0,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[network],
    url,
    gas: 'auto',
    gasPrice: 60000000000
  }
}


module.exports = {
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey:{
      goerli: process.env.SCAN_API_KEY_ETH,
      bscTestnet: process.env.SCAN_API_KEY_BSC,
      bsc: process.env.SCAN_API_KEY_BSC
    } 
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_API_HTTP,
        blockNumber: 16425000, //8325000
        enable: true
      },
      accounts: {
        mnemonic,
      },
      chainId: chainIds.hardhat,
    },
    mainnet: createNetworkConfig('mainnet'),
    goerli: {
      url: process.env.GOERLI_API_HTTP,
      chainId: 5,
      gasPrice: 'auto',
      // gasLimit: 10000000,
      accounts: { mnemonic: mnemonic },
    },
    bscTestnet: {
      url: process.env.BSC_API_HTTP,
      chainId: 97,
      gasPrice: 'auto',
      // gasLimit: 10000000,
      accounts: { mnemonic: mnemonic },
    },
    bsc: {
      url: process.env.BSC_API_HTTP,
      chainId: 97,
      gasPrice: 'auto',
      // gasLimit: 10000000,
      accounts: { mnemonic: mnemonic },
    },
    // bsc: {
    //   url: 'https://bsc-dataseed.binance.org/',
    //   chainId: 56,
    //   gasPrice: 5000000000,
    //   // gasLimit: 10000000,
    //   accounts: { mnemonic: mnemonic },
    // }
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './contracts',
    tests: './test',
  },
  mocha: {
    timeout: 4000000
  },
  solidity: {
    compilers: [
      // {
      //   version: '0.8.12',
      //   settings: {
      //     optimizer: {
      //       enabled: true,
      //       runs: 50,
      //     },
      //   },
      // },
      {
        version: '0.8.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 50,
          },
        },
      },
      {
        version: '0.5.16',
        settings: {
          optimizer: {
            enabled: true,
            runs: 50,
          },
        },
      },
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 50,
          },
        },
      },
    ],
  },
  docgen: {
    path: './docs',
    clear: false,
    runOnCompile: true,
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },

  gasReporter: {
    currency: 'CHF',
    gasPrice: 0.00000007
  }
}




// const { MNEMONIC, INFURA_URL, TOKEN_ADDR, DAO_ADDR } = process.env;

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// export default {
//   solidity: {
//     compilers: [
//       {
//         version: '0.8.6',
//         settings: {
//           optimizer: {
//             enabled: true,
//             runs: 200,
//           },
//         },
//       },
//     ],
//   },
//   networks: {
//     rinkeby: {
//       // gas: 5000000,
//       // gasPrice: 20000000000,
//       url: INFURA_URL,
//       accounts: { 
//         mnemonic: MNEMONIC
//       },
//     }
//   },
//   contractSizer: {
//     alphaSort: true,
//     disambiguatePaths: false,
//     runOnCompile: true,
//     strict: true,
//     // only: [':ERC20$'],
//   }
// };
