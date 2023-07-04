# Safe recovery modules
This repository contains custom SAFE recovery modules. 

## Modules
- Inheritance module
- Secret recovery module

### Inheritance module
The inheritance module allows a SAFE to set new owners (heirs) with a time delay. The time delayed heirs can be used for inheritance or as a back-up wallet. The back-up wallet can be stored less secure, for example in the cloud, as long as the owner check the SAFE within the delay. The user needs to update the deadline before it expires else the heirs are able to become owners of the safe. 

The heirs get proportional ownership, for example if 3 heirs are set then on execution the safe  

### Secret recovery module
Secret recovery allows use of guardians with significant delays (for example years), minimizing trust, while allowing a reduction of this delay by revealing known secrets. Multiple secrets can be added eacht with a custom reduction period. Allowing users to choose between low entropy secrets that are easy to remember (with a smal delay reduction) and high entropy secrets with significant delay reduction (hard to remember).

The secret is stored as an onchain hash. Where the hash is determined by keccak256(address safe, bytes source). By using the address of the safe in the hash the reveal of a secret for one safe can not result in knowing the secret of another safe even if the source is the same. 
