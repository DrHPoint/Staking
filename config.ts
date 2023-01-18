// import BigNumber from 'bignumber.js'
// BigNumber.config({ EXPONENTIAL_AT: 60 })
import { parseEther, parseUnits } from "ethers/lib/utils";



export default {
	
    bsctestnet: {
		TTT_ADDRESS: "",
        USDT_ADDRESS: "",
		STAKING_ADDRESS: "",
		USDT_WALLET_ADDRESS: "",

		CHAIN_ID: 97,
	},

	goerli: {
		TTT_ADDRESS: "",
        USDT_ADDRESS: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
		FAKE_USDT_ADDRESS: "",
		STAKING_ADDRESS: "",
		USDT_WALLET_ADDRESS: "0x2F62CEACb04eAbF8Fc53C195C5916DDDfa4BED02",

		CHAIN_ID: 5,
	},

	bsc: { //bsctestnet
		TTT_ADDRESS: "0x0B96b937946768745849F4bA3D67C69a8f909b97",
        USDT_ADDRESS: "",
		FAKE_USDT_ADDRESS: "0x2F16F49c398C8353Fb8a7FeBd1F9A3141f2b2c8d",
		STAKING_ADDRESS: "0x506d7e411AAFF9eaFb3F0703590029A8A49D746C",
		USDT_WALLET_ADDRESS: "",

		CHAIN_ID: 56,
	},

	mainnet: {
		TTT_ADDRESS: "",
        USDT_ADDRESS: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        // USDС_ADDRESS: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		STAKING_ADDRESS: "",
		USDT_WALLET_ADDRESS: "0xA7A93fd0a276fc1C0197a5B5623eD117786eeD06",
		// USDС_WALLET_ADDRESS: "0x7713974908be4bed47172370115e8b1219f4a5f0",

		CHAIN_ID: 1,
	}
} as { [keys: string]: any }