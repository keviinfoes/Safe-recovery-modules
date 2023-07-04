const SecretRecoveryModule = artifacts.require("SecretRecoveryModule")
const SafeProxyFactory = artifacts.require("SafeProxyFactory")
const Safe = artifacts.require("Safe")

contract('SecretRecoveryModule_test', async accounts => {
	let recoveryModule
	let safeProxy
	let CALL
	let sig
	before(async() => {
		recoveryModule = await SecretRecoveryModule.deployed()
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
		let add_module = await safeProxy.contract.methods.enableModule(recoveryModule.address).encodeABI()
		await safeProxy.execTransaction(safeProxy.address, 0, add_module, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[0]})
		let enabled = await safeProxy.isModuleEnabled(recoveryModule.address)
		assert(enabled == true, "module not enabled")
	})
	describe('Test secret module', function () {
		it("Should set boundaries", async () => {
			let secret1 = web3.utils.toHex("Hello world");
			let secret2 = web3.utils.toHex("More secret than hello world");
			let hash1 = await recoveryModule.getHash(safeProxy.address, secret1)
			let hash2 = await recoveryModule.getHash(safeProxy.address, secret2)
			//web3 function same as onchain getHash
			//web3.utils.soliditySha3(accounts[0], secret1))
			sig = "0x" + "000000000000000000000000" + accounts[0].replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
			let set_boundaries = await recoveryModule.contract.methods.setBoundaries(1800, accounts[1], [hash1, hash2], [900, 1800]).encodeABI() 
			await safeProxy.execTransaction(recoveryModule.address, 0, set_boundaries, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[0]})
			//check boundries
			let boundries = await recoveryModule.getBoundaries(safeProxy.address)
			assert(boundries.delay == 1800, "setBoundaries: false delay")
			assert(boundries.guardian == accounts[1], "setBoundaries: false guardian")
			assert(boundries.secret[0] == hash1, "setBoundaries: false secret")
			assert(boundries.reduction[0] == 900, "setBoundaries: false reduction")	
			assert(boundries.secret[1] == hash2, "setBoundaries: false secret")
			assert(boundries.reduction[1] == 1800, "setBoundaries: false reduction")	
		})
		it("Should fail non guardian recovery", async () => {
			try {
				await recoveryModule.guardianRecover(safeProxy.address, accounts[1])
				assert.fail("The transaction should have thrown an error");
			} catch (err) {
				assert.include(err.message, "sender not guardian", "The error message should contain 'sender not guardian'");
			}
		})
		it("Should start guardian recovery", async () => {
			await recoveryModule.guardianRecover(safeProxy.address, accounts[2], {from: accounts[1]})
			let recover = await recoveryModule.recover(safeProxy.address)
			assert(recover.caller == accounts[2], "setBoundaries: false caller")	
		})
		it("Should fail reduce delay", async () => {
			try {
				let false_secret = web3.utils.toHex("false secret");
				await recoveryModule.delayReduce(safeProxy.address, 0, false_secret)
				assert.fail("The transaction should have thrown an error");
			} catch (err) {
				assert.include(err.message, "false proof", "The error message should contain 'false proof'");
			}
		})
		it("Should reduce delay", async () => {
			let recover_before = await recoveryModule.recover(safeProxy.address)
			let secret = web3.utils.toHex("Hello world");
			await recoveryModule.delayReduce(safeProxy.address, 0, secret)
			let recover_after = await recoveryModule.recover(safeProxy.address)
			let reduced = recover_before.deadline - recover_after.deadline
			assert(reduced == 900, "delayReduce: false reduction")	
			assert(recover_after.reduced == true, "delayReduce: reduction not stored")	
		})
		it("Should remove active recovery", async () => {
			sig = "0x" + "000000000000000000000000" + accounts[0].replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
			let reset_recover = await recoveryModule.contract.methods.resetRecover().encodeABI() 
			await safeProxy.execTransaction(recoveryModule.address, 0, reset_recover, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[0]})
			let recover = await recoveryModule.recover(safeProxy.address)
			assert(parseInt(recover.caller, 16) == 0, "resetRecover: caller not reset")	 
		})
		it("Should execute recovery", async () => {
			//Start new recovery by guardian
			await recoveryModule.guardianRecover(safeProxy.address, accounts[2], {from: accounts[1]})
			//reduce delay to zero with secret
			let recover_before = await recoveryModule.recover(safeProxy.address)
			let secret = web3.utils.toHex("More secret than hello world");
			await recoveryModule.delayReduce(safeProxy.address, 1, secret)
			let recover_after = await recoveryModule.recover(safeProxy.address)
			let reduced = recover_before.deadline - recover_after.deadline
			assert(reduced == 1800, "execute: false reduction")	
			let change_owner = await safeProxy.contract.methods.swapOwner("0x0000000000000000000000000000000000000001", accounts[0], accounts[2]).encodeABI() 
			await recoveryModule.execute(safeProxy.address, change_owner, 0, {from: accounts[2]})
			let owner = await safeProxy.getOwners()
			assert(owner[0] == accounts[2], "execute: owner not set")	
		})
		it("Should set secret used when used before recovery", async () => {
			//reset active recovery
			sig = "0x" + "000000000000000000000000" + accounts[2].replace('0x', '') + "0000000000000000000000000000000000000000000000000000000000000000" + "01"
			let reset_recover = await recoveryModule.contract.methods.resetRecover().encodeABI() 
			await safeProxy.execTransaction(recoveryModule.address, 0, reset_recover, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[2]})
			//reset boundaries
			let secret = web3.utils.toHex("Reduce before recovery");
			let hash = await recoveryModule.getHash(safeProxy.address, secret)
			let set_boundaries = await recoveryModule.contract.methods.setBoundaries(1800, accounts[1], [hash], [1800]).encodeABI() 
			await safeProxy.execTransaction(recoveryModule.address, 0, set_boundaries, CALL, 0, 0, 0, "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", sig, {from: accounts[2]})
			//perform reduce call before guadrian recovery 
			await recoveryModule.delayReduce(safeProxy.address, 0, secret)
			let recover = await recoveryModule.recover(safeProxy.address)
			assert(recover.deadline == 0, "used: false deadline")
			assert(recover.reduced == false, "used: secret false reduce")	
			let used = await recoveryModule.used(hash)
			assert(used == true, "used: secret reveal not set as used")	
		})
	
	})
})





