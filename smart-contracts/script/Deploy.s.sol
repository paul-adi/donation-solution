// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {DonationToken} from "../src/DonationToken.sol";

contract DeployDonation is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // Get USDC address from environment variable
        address usdcAddress = vm.envAddress("USDC_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the DonationToken contract
        DonationToken donation = new DonationToken(usdcAddress);

        vm.stopBroadcast();

        console.log("Donation contract deployed at:", address(donation));
    }
}
