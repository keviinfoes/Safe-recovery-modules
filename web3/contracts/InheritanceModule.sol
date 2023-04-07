// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.8.0;

import "./Enum.sol";
import "./IERC20.sol";

interface GnosisSafe {
    /// @dev Allows a Module to execute a Safe transaction without any further confirmations.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(address to, uint256 value, bytes calldata data, Enum.Operation operation)
        external
        returns (bool success);
}

contract InheritanceModule {
    string public constant NAME = "Inheritance Module";
    string public constant VERSION = "0.1.0";

    struct Heir {
        address heir;
        uint16 share;
    }

    mapping(address => uint16) public totalShare;
    mapping(address => mapping(address => uint16)) public totalWithdrawnShare;
    mapping(address => Heir[]) public heirs;
    mapping(address => mapping(address => mapping(address => uint16))) public heirWithdrawnShare;
    mapping(address => uint256) public deadline;
    
    function setInheritance(address[] memory _heirs, uint16[] memory shares, uint256 _deadline) public {
        setHeirs(_heirs, shares);
        setDeadline(_deadline);
    }

    function setHeirs(address[] memory _heirs, uint16[] memory shares) public {    
        require(block.timestamp < deadline[msg.sender] || deadline[msg.sender] == 0, "SMH - inheritance active");
        require(_heirs.length == shares.length, "SMH - length does not match");
        //Clear previous heirs
        delete heirs[msg.sender];
        //Set new heirs
        for (uint256 i; i < _heirs.length; i++) {
            Heir memory _heir = Heir(_heirs[i], shares[i]);   
            heirs[msg.sender].push(_heir);
            totalShare[msg.sender] += shares[i];
        }
        require(totalShare[msg.sender] == 10000 , "SMH - total main share not 10000");
    }

    function setDeadline(uint256 _deadline) public {
        require(totalShare[msg.sender] > 0, "UD - no heirs");
        require(block.timestamp < deadline[msg.sender] || deadline[msg.sender] == 0, "UD - inheritance active");
        require(_deadline >= block.timestamp, "UD - deadline in the past");
        deadline[msg.sender] = _deadline;
    }

    function execute(address safe, uint256 index, address token) public {
        Heir memory _heir = heirs[safe][index];
        require(block.timestamp >= deadline[safe] && deadline[safe] != 0, "HE - before deadline");
        require(_heir.heir == msg.sender, "HE - no heir");
        //Get share for individual heir
        require(_heir.share > heirWithdrawnShare[safe][token][_heir.heir], "HE - heir withdraw overflow ]");
        uint16 heirShares = _heir.share - heirWithdrawnShare[safe][token][_heir.heir];
        heirWithdrawnShare[safe][token][_heir.heir] += _heir.share;
        //Get total shares for token
        require(totalShare[safe] > totalWithdrawnShare[safe][token], "HE - totalwithdraw overflow");
        uint16 totalShares = totalShare[safe] - totalWithdrawnShare[safe][token];
        totalWithdrawnShare[safe][token] += _heir.share;
        //Transfer the token share
        if (token == address(0)) {
            uint256 balance = safe.balance;
            uint256 amount = balance * heirShares / totalShares;
            require(amount > 0, "HE - no inheritance ETH");
            // solium-disable-next-line security/no-send
            require(GnosisSafe(safe).execTransactionFromModule(_heir.heir, amount, "", Enum.Operation.Call), "HE - could not execute ether transfer");
        } else {
            uint256 balance = IERC20(token).balanceOf(safe);
            uint256 amount = balance * heirShares / totalShares;
            require(amount > 0, "HE - no inheritance token");
            bytes memory data = abi.encodeWithSignature("transfer(address,uint256)", _heir.heir, amount);
            require(GnosisSafe(safe).execTransactionFromModule(token, 0, data, Enum.Operation.Call), "HE - could not execute token transfer");
        }
    }
}
