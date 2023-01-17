const hre = require("hardhat");
import config from '../config'
import { ethers, network, run } from 'hardhat'
import { parseEther, parseUnits } from "ethers/lib/utils";

function sleep() {
    return new Promise(
        resolve => setTimeout(resolve, 20000)
    );
}

async function main() {
  
    const { TTT_ADDRESS, USDT_ADDRESS } = config[network.name]

    const hour = 60 * 60;
    const day = 24 * hour;
    const month = day * 30;
    
    const rewardPerDay = parseUnits("1000", 18);

    const Contract = await hre.ethers.getContractFactory("Staking");
    const contract = await Contract.deploy(USDT_ADDRESS, TTT_ADDRESS, rewardPerDay, month, day, hour);
    await contract.deployed();
    
    console.log("Staking deployed to:", contract.address);

    await sleep();

    console.log('Starting verify contract...');

    try {
        await run('verify:verify', {
            address: contract.address,
            constructorArguments: [
                USDT_ADDRESS, 
                TTT_ADDRESS, 
                rewardPerDay, 
                month, 
                day, 
                hour
                ],
                contract: "contracts/Staking.sol:Staking"
            });
        } catch (e: any) {
            console.log(e.message)
        }
    
    console.log('Verify successfull');
    
    console.log('Mint reward tokens to staking contract');

    const token = await hre.ethers.getContractAt("TTT", TTT_ADDRESS);
    await token.mint(contract.address, rewardPerDay.mul(30)); // Проверить на правильность + ^ по сравнению с другими проектами

    console.log('Minting complite');
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
