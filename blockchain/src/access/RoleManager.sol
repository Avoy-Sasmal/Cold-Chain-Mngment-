// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RoleManager
 * @dev Manages stakeholder roles for the cold chain supply system.
 *      Admin assigns roles: MANUFACTURER, SUPPLIER, WAREHOUSE, RETAILER.
 */
contract RoleManager {

    address public admin;

    // Role 0=NONE, 1=MANUFACTURER, 2=SUPPLIER, 3=WAREHOUSE, 4=RETAILER
    enum Role {
        NONE,
        MANUFACTURER,
        SUPPLIER,
        WAREHOUSE,
        RETAILER
    }

    struct Stakeholder {
        string name;
        Role role;
        bool exists;
    }

    // wallet address → stakeholder details
    mapping(address => Stakeholder) public stakeholders;

    // list of all registered wallets
    address[] public stakeholderAddresses;

    event StakeholderCreated(
        address indexed stakeholder,
        string name,
        Role role
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not Admin");
        _;
    }

    modifier stakeholderNotExists(address _wallet) {
        require(
            !stakeholders[_wallet].exists,
            "Stakeholder already exists"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Admin creates a new stakeholder with a role
    function createStakeholder(
        address _wallet,
        string memory _name,
        Role _role
    )
        public
        onlyAdmin
        stakeholderNotExists(_wallet)
    {
        require(_wallet != address(0), "Invalid wallet");
        require(_role != Role.NONE, "Invalid role");

        stakeholders[_wallet] = Stakeholder({
            name: _name,
            role: _role,
            exists: true
        });

        stakeholderAddresses.push(_wallet);

        emit StakeholderCreated(_wallet, _name, _role);
    }

    /// @notice Returns the role of a wallet (0-4)
    function getRole(address _wallet) public view returns (Role) {
        return stakeholders[_wallet].role;
    }

    /// @notice Returns total number of registered stakeholders
    function getStakeholderCount() public view returns (uint256) {
        return stakeholderAddresses.length;
    }

    /// @notice Returns all registered stakeholder addresses
    function getAllStakeholders() public view returns (address[] memory) {
        return stakeholderAddresses;
    }
}