// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {RoleManager} from "../src/access/RoleManager.sol";

/**
 * @title RoleManagerTest
 * @dev Tests for the RoleManager contract.
 * Run: forge test --match-contract RoleManagerTest -vvv
 */
contract RoleManagerTest is Test {

    RoleManager roleManager;
    
    // Event defined here so the test contract can emit it for vm.expectEmit
    event StakeholderCreated(
        address indexed stakeholder,
        string name,
        RoleManager.Role role
    );

    // Test accounts
    address admin       = address(1);
    address manufacturer = address(2);
    address supplier    = address(3);
    address warehouse   = address(4);
    address retailer    = address(5);
    address nobody      = address(6);

    function setUp() public {
        // Deploy as admin
        vm.prank(admin);
        roleManager = new RoleManager();
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    function test_AdminIsDeployer() public view {
        assertEq(roleManager.admin(), admin);
    }

    // ── Create Stakeholder ──────────────────────────────────────────────────

    function test_CreateManufacturer() public {
        vm.prank(admin);
        roleManager.createStakeholder(manufacturer, "Pharma Corp", RoleManager.Role.MANUFACTURER);

        (string memory name, RoleManager.Role role, bool exists) =
            roleManager.stakeholders(manufacturer);

        assertEq(name, "Pharma Corp");
        assertEq(uint8(role), uint8(RoleManager.Role.MANUFACTURER));
        assertTrue(exists);
    }

    function test_CreateAllRoles() public {
        vm.startPrank(admin);
        roleManager.createStakeholder(manufacturer, "MFG", RoleManager.Role.MANUFACTURER);
        roleManager.createStakeholder(supplier,     "SUP", RoleManager.Role.SUPPLIER);
        roleManager.createStakeholder(warehouse,    "WRH", RoleManager.Role.WAREHOUSE);
        roleManager.createStakeholder(retailer,     "RET", RoleManager.Role.RETAILER);
        vm.stopPrank();

        assertEq(roleManager.getStakeholderCount(), 4);
    }

    function test_GetRole() public {
        vm.prank(admin);
        roleManager.createStakeholder(supplier, "Supplier Co", RoleManager.Role.SUPPLIER);

        assertEq(uint8(roleManager.getRole(supplier)), uint8(RoleManager.Role.SUPPLIER));
    }

    function test_GetAllStakeholders() public {
        vm.startPrank(admin);
        roleManager.createStakeholder(manufacturer, "MFG", RoleManager.Role.MANUFACTURER);
        roleManager.createStakeholder(supplier,     "SUP", RoleManager.Role.SUPPLIER);
        vm.stopPrank();

        address[] memory all = roleManager.getAllStakeholders();
        assertEq(all.length, 2);
        assertEq(all[0], manufacturer);
        assertEq(all[1], supplier);
    }

    // ── Failure Cases ───────────────────────────────────────────────────────

    function test_RevertIf_NotAdmin() public {
        vm.prank(nobody);
        vm.expectRevert("Not Admin");
        roleManager.createStakeholder(manufacturer, "Hack", RoleManager.Role.MANUFACTURER);
    }

    function test_RevertIf_DuplicateStakeholder() public {
        vm.startPrank(admin);
        roleManager.createStakeholder(manufacturer, "MFG", RoleManager.Role.MANUFACTURER);
        vm.expectRevert("Stakeholder already exists");
        roleManager.createStakeholder(manufacturer, "MFG2", RoleManager.Role.MANUFACTURER);
        vm.stopPrank();
    }

    function test_RevertIf_ZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Invalid wallet");
        roleManager.createStakeholder(address(0), "Zero", RoleManager.Role.MANUFACTURER);
    }

    function test_RevertIf_RoleNone() public {
        vm.prank(admin);
        vm.expectRevert("Invalid role");
        roleManager.createStakeholder(manufacturer, "None", RoleManager.Role.NONE);
    }

    // ── Events ──────────────────────────────────────────────────────────────

    function test_EmitsStakeholderCreated() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit StakeholderCreated(
            manufacturer,
            "Pharma Corp",
            RoleManager.Role.MANUFACTURER
        );
        roleManager.createStakeholder(manufacturer, "Pharma Corp", RoleManager.Role.MANUFACTURER);
    }
}
