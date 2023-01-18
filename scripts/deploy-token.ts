const hre = require("hardhat");
import config from '../config'
import { ethers, network, run } from 'hardhat'
// import { parseEther, parseUnits } from "ethers/lib/utils";

function sleep() {
    return new Promise(
        resolve => setTimeout(resolve, 20000)
    );
}

async function main() {
    
    const Contract = await hre.ethers.getContractFactory("Token");
    const contract = await Contract.deploy();
    await contract.deployed();
    console.log("Token deployed to:", contract.address);

    await sleep();

    console.log('Starting verify contract...');


    try {
        await run('verify:verify', {
            address: contract.address,
            constructorArguments: [],
                contract: "contracts/Token.sol:Token"
            });
            console.log('Verify successfull')
        } catch (e: any) {
            console.log(e.message)
        }
     
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
