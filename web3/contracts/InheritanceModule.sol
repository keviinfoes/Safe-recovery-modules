// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.8.0;

import "./safe-wallet/Safe.sol";

contract InheritanceModule {
    string public constant NAME = "Inheritance Module";
    string public constant VERSION = "0.1.0";

    mapping(address => address[]) public heirs;
    mapping(address => uint256) public deadline;
    
    function setInheritance(address[] memory _heirs, uint256 _deadline) public {
        setHeirs(_heirs);
        setDeadline(_deadline);
    }

    function removeInheritance() public {
        address[] memory zero;
        setHeirs(zero);
        deadline[msg.sender] = 0;
    }

    //Notice: heirs can't already be an owner of the safe
    function setHeirs(address[] memory _heirs) public {    
        //Check no double heirs - simplest by checking in ascending order
        address previous;
        uint256 index;
        while (index < _heirs.length) { 
            require(_heirs[index] > previous);
            index += 1;
        }
        //Store new heirs
        delete heirs[msg.sender];
        heirs[msg.sender] = _heirs;
    }

    function setDeadline(uint256 _deadline) public {
        require(_deadline > block.timestamp, "Deadline - deadline in the past");
        deadline[msg.sender] = _deadline;
    }

    function execute(address payable safe) public {
        require(deadline[safe] != 0, "Execute - no deadline");
        require(block.timestamp >= deadline[safe], "Execute - before deadline");
        require(heirs[safe].length > 0, "Execute - no deadline");
        //Swap current owners to heirs
        swapOwners(safe);
        //Set new threshold to require all new owners to sign
        bytes memory change_threhold = abi.encodeWithSignature("changeThreshold(uint256)", heirs[safe].length);
        require(Safe(safe).execTransactionFromModule(safe, 0, change_threhold, Enum.Operation.Call), "Execute - failed set threshold");
        //Remove inheritance after execution
        removeInheritance();
    }

    function swapOwners(address payable safe) internal {
        address[] memory owners = Safe(safe).getOwners();
        address[] memory _heirs = heirs[safe];     
        address prevOwner = address(0x1);     
        //remove owners
        for (uint256 i; i < owners.length - 1; i++) {  
            bytes memory remove_owner = abi.encodeWithSignature("removeOwner(address,address,uint256)", prevOwner, owners[i], 1);
            require(Safe(safe).execTransactionFromModule(safe, 0, remove_owner, Enum.Operation.Call), "Execute - failed remove owners"); 
        }
        //swap last owner first heir
        bytes memory swap_owner = abi.encodeWithSignature("swapOwner(address,address,address)", prevOwner, owners[owners.length - 1], _heirs[0]);
        require(Safe(safe).execTransactionFromModule(safe, 0, swap_owner, Enum.Operation.Call), "Execute - failed swap owners"); 
        //add rest of heirs
        for (uint i = 1; i < _heirs.length; i += 1) {  
            bytes memory add_owner = abi.encodeWithSignature("addOwnerWithThreshold(address,uint256)", _heirs[i], 1);
            require(Safe(safe).execTransactionFromModule(safe, 0, add_owner, Enum.Operation.Call), "Execute - failed add owners");        
        }
    }    
}
