//const BN = require('bn.js')
const InheritanceModule = artifacts.require("InheritanceModule")

contract('InheritanceModule_test', async accounts => {
	let inheritance
	before(async() => {
		inheritance = await InheritanceModule.deployed()
	})
	describe('Test inheritance module', function () {
		it("Should store inheritance", async () => {
			let currentBlock = await web3.eth.getBlock("latest")
			let increase_deadline = 36
			let heirs = ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"]
			let share = [5000, 5000]
			await inheritance.setInheritance(heirs, share, currentBlock.timestamp + increase_deadline)
			let stored_heirs = await inheritance.heirs(accounts[0], 0)
			assert(stored_heirs.heir == heirs[0], "heir not stored")
			assert(stored_heirs.share == share[0], "share not stored")
			let totalshare = await inheritance.totalShare(accounts[0])
			assert(totalshare == 10000, "share not stored")
			let deadline = await inheritance.deadline(accounts[0])
			assert(deadline == currentBlock.timestamp + increase_deadline, "deadline not stored")
		})


		//Add execute success test - using mock safe
	})
})





