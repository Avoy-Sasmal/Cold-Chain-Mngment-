// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";

import {RoleManager}      from "../src/access/RoleManager.sol";
import {ProductBatch}     from "../src/products/ProductBatch.sol";
import {ColdChainMonitor} from "../src/tracking/ColdChainMonitor.sol";

/**
 * @title DeployScript
 * @dev Deploys all 3 contracts in order.
 *      RoleManager first → ProductBatch (needs RoleManager) → ColdChainMonitor (needs both).
 *
 * Run with:
 *   forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
 *
 * Copy the printed addresses into backend/.env and client/.env
 */
contract DeployScript is Script {

    function run() external {

        // Load private key from .env (Anvil account #0 by default)
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        // 1. Deploy RoleManager — admin = deployer wallet
        RoleManager roleManager = new RoleManager();
        console.log("RoleManager deployed at:     ", address(roleManager));

        // 2. Deploy ProductBatch — pass RoleManager address
        ProductBatch productBatch = new ProductBatch(address(roleManager));
        console.log("ProductBatch deployed at:    ", address(productBatch));

        // 3. Deploy ColdChainMonitor — pass both addresses
        ColdChainMonitor coldChainMonitor = new ColdChainMonitor(
            address(roleManager),
            address(productBatch)
        );
        console.log("ColdChainMonitor deployed at:", address(coldChainMonitor));

        vm.stopBroadcast();

        // Summary for easy copy-paste
        console.log("\n=== COPY THESE TO YOUR .env FILES ===");
        console.log("ROLE_MANAGER_ADDRESS=",      address(roleManager));
        console.log("PRODUCT_BATCH_ADDRESS=",     address(productBatch));
        console.log("COLD_CHAIN_MONITOR_ADDRESS=", address(coldChainMonitor));
    }
}