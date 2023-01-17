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
		STAKING_ADDRESS: "",
		USDT_WALLET_ADDRESS: "0x2F62CEACb04eAbF8Fc53C195C5916DDDfa4BED02",

		CHAIN_ID: 5,
	},

	bsc: { //bsctestnet
		TTT_ADDRESS: "",
        USDT_ADDRESS: "",
		STAKING_ADDRESS: "",
		USDT_WALLET_ADDRESS: "",

		CHAIN_ID: 56,
	},

	mainnet: {
		TTT_ADDRESS: "",
        USDT_ADDRESS: "",
		STAKING_ADDRESS: "",
		USDT_WALLET_ADDRESS: "",

		CHAIN_ID: 1,
	}
} as { [keys: string]: any }