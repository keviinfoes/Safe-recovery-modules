// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.7.0 <0.8.0;
pragma abicoder v2;

import "./safe-wallet/Safe.sol";

contract SecretRecoveryModule {
    string public constant NAME = "Secret Recovery Module";
    string public constant VERSION = "0.1.0";

    struct Boundaries { 
        uint256 delay;
        address guardian;
        bytes32[] secret;
        uint256[] reduction;
    }

    struct Recover {
        address caller;
        uint256 deadline;
        bool reduced;
    }

    mapping(address => Boundaries) public boundaries;
    mapping(address => Recover) public recover;
    mapping(bytes32 => bool) public used;

    event Boundary(address indexed safe, uint256 indexed delay, address indexed guardian);
    event Recovery(address indexed safe, address indexed caller, uint256 indexed deadline);
    event Reduce(address indexed safe, uint256 indexed deadline, bytes32 indexed secret);

    function getBoundaries(address safe) public view returns (Boundaries memory) {
        return boundaries[safe];
    }

    function getHash(address safe, bytes memory proof) public pure returns(bytes32 check) {
        check = keccak256(abi.encodePacked(safe, proof));
    }

    //Notice: guardian address can be a multisig allowing multiple guardians
    //Notice: reuse of a hash is possible however does not allow a restore, only one restore per hash
    function setBoundaries(uint256 _delay, address _guardian, bytes32[] memory _secret, uint256[] memory _reduction) public {
        require(_secret.length == _reduction.length, "setRecovery: mismatch in length");
        boundaries[msg.sender] = Boundaries(_delay, _guardian, _secret, _reduction);
        emit Boundary(msg.sender, _delay, _guardian);
    }

    //Notice: recover with _caller address(0) no effect -> only sets deadline, which has no further effect
    function guardianRecover(address safe, address _caller) public {
        require(msg.sender == boundaries[safe].guardian, "guardianRestore: sender not guardian");
        require(recover[safe].caller == address(0), "guardianRestore: caller already set");
        recover[safe].caller = _caller;
        recover[safe].deadline = block.timestamp + boundaries[safe].delay;
        emit Recovery(safe, recover[safe].caller, recover[safe].deadline);
    }

    //Notice: only one reduced delay per recovery
    function delayReduce(address safe, uint256 index, bytes memory proof) public {
        bytes32 check = getHash(safe, proof);
        require(used[check] == false, "secretReduce: secret already used");
        require(check == boundaries[safe].secret[index], "secretReduce: false proof");
        used[check] = true;
        if(!recover[safe].reduced){
            if(recover[safe].deadline > boundaries[safe].reduction[index]) {
                recover[safe].deadline -= boundaries[safe].reduction[index];
                recover[safe].reduced = true;
            } else if(recover[safe].deadline != 0) {
                recover[safe].deadline = block.timestamp;
                recover[safe].reduced = true;
            }
        }   
        emit Reduce(safe, recover[safe].deadline, check);
    }

    function resetRecover() public {
        recover[msg.sender] = Recover(address(0), 0, false);
        emit Recovery(msg.sender, address(0), 0);
    }

    function execute(address payable safe, bytes calldata command, Enum.Operation operation) public {
        require(msg.sender == recover[safe].caller, "Execute: sender not approved");
        require(block.timestamp >= recover[safe].deadline, "Execute: before deadline");
        require(Safe(safe).execTransactionFromModule(safe, 0, command, operation), "Execute: failed operation");     
    }
}




