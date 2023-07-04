const Migrations = artifacts.require("Migrations");
const InheritanceModule = artifacts.require("InheritanceModule");
const SecretRecoveryModule = artifacts.require("SecretRecoveryModule");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(InheritanceModule);
  deployer.deploy(SecretRecoveryModule);

};
