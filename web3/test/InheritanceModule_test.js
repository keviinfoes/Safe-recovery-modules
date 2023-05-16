//const BN = require('bn.js')
const InheritanceModule = artifacts.require("InheritanceModule")
const SafeProxyFactory = artifacts.require("SafeProxyFactory")
const Safe = artifacts.require("Safe")
const timeMachine = require('ganache-time-traveler');

contract('InheritanceModule_test', async accounts => {
	let inheritance
	let safeProxy
	let CALL
	let sig
	before(async() => {
		inheritance = await InheritanceModule.deployed()
		// deploy mock safe
		let safe = await Safe.new()
		let safeFactory = await SafeProxyFactory.new()
		let data = await safeFactory.createProxyWithNonce(safe.address, "0x", 0)
		safeProxy = await Safe.at(data.logs[0].args.proxy)
		//setup mock safe
		await safeProxy.setup(
			[accounts[0]], 
			1, 
			"0x0000000000000000000000000000000000000000", 
			"0x",
			"0x0000000000000000000000000000000000000000",
			"0x0000000000000000000000000000000000000000",
			0,
			"0x0000000000000000000000000000000000000000"
		)
		let threshold = await safeProxy.getThreshold()
		assert(threshold == 1, "safe not setup")
		//add module to safe
		CALL = 0
		sig = "0x" + "000000000000000000000000" + accounts[0].replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
		let add_module = await safeProxy.contract.methods.enableModule(inheritance.address).encodeABI()
		await safeProxy.execTransaction(safeProxy.address, 0, add_module, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[0]})
		let enabled = await safeProxy.isModuleEnabled(inheritance.address)
		assert(enabled == true, "module not enabled")
	})
	describe('Test inheritance module', function () {
		it("Should store inheritance", async () => {
			let currentBlock = await web3.eth.getBlock("latest")
			let increase_deadline = 36 //seconds
			let heirs = ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"]
			await inheritance.setInheritance(heirs, currentBlock.timestamp + increase_deadline)
			let stored_heirs_0 = await inheritance.heirs(accounts[0], 0)
			let stored_heirs_1 = await inheritance.heirs(accounts[0], 1)
			assert(stored_heirs_0 == heirs[0], "heirs not stored")
			assert(stored_heirs_1 == heirs[1], "heirs not stored")
			let deadline = await inheritance.deadline(accounts[0])
			assert(deadline == currentBlock.timestamp + increase_deadline, "deadline not stored")
		})
		it("Should remove inheritance", async () => {
			await inheritance.removeInheritance()
			try {
				await inheritance.heirs(accounts[0],0)
				assert.fail("The transaction should have thrown an error");
			} catch (err) {
				assert.include(err.message, "revert", "The error message should contain 'revert'");
			}
			let deadline = await inheritance.deadline(accounts[0])
			assert(deadline == 0, "deadline not removed")
		})
		it("Should execute inheritance", async () => {
			//call module setInheritance to set heirs
			let currentBlock = await web3.eth.getBlock("latest")
			let increase_deadline = 36 //seconds
			let heirs = [accounts[1], accounts[2]]
			let add_heirs = await inheritance.contract.methods.setInheritance(heirs, currentBlock.timestamp + increase_deadline).encodeABI()
			await safeProxy.execTransaction(inheritance.address, 0, add_heirs, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[0]})
			//check hairs
			let heir_0 = await inheritance.heirs.call(safeProxy.address, 0)
			let heir_1 = await inheritance.heirs.call(safeProxy.address, 1)
			assert(heir_0 == accounts[1], "heirs not stored")
			assert(heir_1 == accounts[2], "heirs not stored")
			let deadline = await inheritance.deadline(safeProxy.address)
			assert(deadline == currentBlock.timestamp + increase_deadline, "deadline not stored")
			//first check fail before deadline
			try {
				await inheritance.execute(safeProxy.address)
				assert.fail("The transaction should have thrown an error");
			} catch (err) {
				assert.include(err.message, "status 0", "The error message should contain 'status 0'");
			}
			//forward time 
			await timeMachine.advanceTimeAndBlock(37)
			//check success after deadline
			await inheritance.execute(safeProxy.address)
			let threshold = await safeProxy.getThreshold()
			assert(threshold == heirs.length, "threshold not equal to heirs") 
			let owners = await safeProxy.getOwners()
			assert(owners[0] == accounts[2], "heirs not set as owners") 
			assert(owners[1] == accounts[1], "heirs not set as owners") 
		})
	})
})





