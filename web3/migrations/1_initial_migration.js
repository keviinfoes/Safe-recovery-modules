const Migrations = artifacts.require("Migrations");
const InheritanceModule = artifacts.require("InheritanceModule");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(InheritanceModule);
};
