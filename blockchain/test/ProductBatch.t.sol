// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {RoleManager}  from "../src/access/RoleManager.sol";
import {ProductBatch} from "../src/products/ProductBatch.sol";

/**
 * @title ProductBatchTest
 * Run: forge test --match-contract ProductBatchTest -vvv
 */
contract ProductBatchTest is Test {

    RoleManager  roleManager;
    ProductBatch productBatch;
    
    // Events defined here so the test contract can emit them for vm.expectEmit
    event ProductCreated(
        bytes32 indexed productHash,
        address indexed creator,
        string  batchId,
        uint256 timestamp
    );

    event OwnershipTransferred(
        bytes32 indexed productHash,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    address admin        = address(1);
    address manufacturer = address(2);
    address supplier     = address(3);
    address warehouse    = address(4);
    address retailer     = address(5);
    address nobody       = address(6);

    bytes32 constant HASH_1 = keccak256("product-1");
    bytes32 constant HASH_2 = keccak256("product-2");
    string  constant BATCH  = "BATCH-001";

    function setUp() public {
        vm.prank(admin);
        roleManager = new RoleManager();

        productBatch = new ProductBatch(address(roleManager));

        // Register stakeholders
        vm.startPrank(admin);
        roleManager.createStakeholder(manufacturer, "MFG", RoleManager.Role.MANUFACTURER);
        roleManager.createStakeholder(supplier,     "SUP", RoleManager.Role.SUPPLIER);
        roleManager.createStakeholder(warehouse,    "WRH", RoleManager.Role.WAREHOUSE);
        roleManager.createStakeholder(retailer,     "RET", RoleManager.Role.RETAILER);
        vm.stopPrank();
    }

    // ── Create Product ──────────────────────────────────────────────────────

    function test_ManufacturerCanCreateProduct() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        ProductBatch.Product memory p = productBatch.getProduct(HASH_1);
        assertEq(p.creator,      manufacturer);
        assertEq(p.currentOwner, manufacturer);
        assertEq(p.batchId,      BATCH);
        assertTrue(p.exists);
    }

    function test_GetProductByBatchId() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        ProductBatch.Product memory p = productBatch.getProductByBatchId(BATCH);
        assertEq(p.productHash, HASH_1);
    }

    function test_GetManufacturerProducts() public {
        vm.startPrank(manufacturer);
        productBatch.createProduct(HASH_1, "BATCH-001");
        productBatch.createProduct(HASH_2, "BATCH-002");
        vm.stopPrank();

        bytes32[] memory list = productBatch.getManufacturerProducts(manufacturer);
        assertEq(list.length, 2);
    }

    function test_RevertIf_NotManufacturer() public {
        vm.prank(supplier);
        vm.expectRevert("Only Manufacturer");
        productBatch.createProduct(HASH_1, BATCH);
    }

    function test_RevertIf_DuplicateHash() public {
        vm.startPrank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);
        vm.expectRevert("Hash already exists");
        productBatch.createProduct(HASH_1, "OTHER");
        vm.stopPrank();
    }

    function test_RevertIf_DuplicateBatchId() public {
        vm.startPrank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);
        vm.expectRevert("Batch ID already exists");
        productBatch.createProduct(HASH_2, BATCH);
        vm.stopPrank();
    }

    // ── Transfer ────────────────────────────────────────────────────────────

    function test_ManufacturerToSupplier() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        vm.prank(manufacturer);
        productBatch.transferProduct(HASH_1, supplier);

        assertEq(productBatch.getProduct(HASH_1).currentOwner, supplier);
    }

    function test_SupplierToWarehouse() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        vm.prank(manufacturer);
        productBatch.transferProduct(HASH_1, supplier);

        vm.prank(supplier);
        productBatch.transferProduct(HASH_1, warehouse);

        assertEq(productBatch.getProduct(HASH_1).currentOwner, warehouse);
    }

    function test_WarehouseToRetailer() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);
        vm.prank(manufacturer);
        productBatch.transferProduct(HASH_1, supplier);
        vm.prank(supplier);
        productBatch.transferProduct(HASH_1, warehouse);
        vm.prank(warehouse);
        productBatch.transferProduct(HASH_1, retailer);

        assertEq(productBatch.getProduct(HASH_1).currentOwner, retailer);
    }

    function test_RevertIf_InvalidTransferPath_ManufacturerToWarehouse() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        vm.prank(manufacturer);
        vm.expectRevert("Invalid transfer path");
        productBatch.transferProduct(HASH_1, warehouse);
    }

    function test_RevertIf_InvalidTransferPath_ManufacturerToRetailer() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        vm.prank(manufacturer);
        vm.expectRevert("Invalid transfer path");
        productBatch.transferProduct(HASH_1, retailer);
    }

    function test_RevertIf_NotOwner() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        vm.prank(supplier); // supplier doesn't own it yet
        vm.expectRevert("Not the current owner");
        productBatch.transferProduct(HASH_1, warehouse);
    }

    // ── Events ──────────────────────────────────────────────────────────────

    function test_EmitsProductCreated() public {
        vm.prank(manufacturer);
        vm.expectEmit(true, true, false, false);
        emit ProductCreated(HASH_1, manufacturer, BATCH, block.timestamp);
        productBatch.createProduct(HASH_1, BATCH);
    }

    function test_EmitsOwnershipTransferred() public {
        vm.prank(manufacturer);
        productBatch.createProduct(HASH_1, BATCH);

        vm.prank(manufacturer);
        vm.expectEmit(true, true, true, false);
        emit OwnershipTransferred(HASH_1, manufacturer, supplier, block.timestamp);
        productBatch.transferProduct(HASH_1, supplier);
    }
}
