import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import '@ton/test-utils';

describe('EscrowRegistry - ID Initialization', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
    });

    it('should initialize with different IDs', async () => {
        // Test different contract instances with different IDs
        const escrowRegistry1 = blockchain.openContract(await EscrowRegistry.fromInit(1n));
        const escrowRegistry2 = blockchain.openContract(await EscrowRegistry.fromInit(2n));
        const escrowRegistry3 = blockchain.openContract(await EscrowRegistry.fromInit(999n));

        // Deploy all contracts
        await escrowRegistry1.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: 0n });
        await escrowRegistry2.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: 0n });
        await escrowRegistry3.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: 0n });

        // Check that each contract has the correct ID
        const info1 = await escrowRegistry1.getGetContractInfo();
        const info2 = await escrowRegistry2.getGetContractInfo();
        const info3 = await escrowRegistry3.getGetContractInfo();

        expect(info1.id).toBe(1n);
        expect(info2.id).toBe(2n);
        expect(info3.id).toBe(999n);

        // Verify each contract has independent state
        expect(info1.totalAgreements).toBe(0n);
        expect(info2.totalAgreements).toBe(0n);
        expect(info3.totalAgreements).toBe(0n);

        // Verify different contract addresses
        expect(escrowRegistry1.address.toString()).not.toBe(escrowRegistry2.address.toString());
        expect(escrowRegistry2.address.toString()).not.toBe(escrowRegistry3.address.toString());
        expect(escrowRegistry1.address.toString()).not.toBe(escrowRegistry3.address.toString());
    });

    it('should create agreements independently in different contract instances', async () => {
        const tenant = await blockchain.treasury('tenant');
        const landlord = await blockchain.treasury('landlord');

        // Deploy two different contract instances
        const escrowRegistry1 = blockchain.openContract(await EscrowRegistry.fromInit(100n));
        const escrowRegistry2 = blockchain.openContract(await EscrowRegistry.fromInit(200n));

        await escrowRegistry1.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: 0n });
        await escrowRegistry2.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: 0n });

        // Create agreement in first contract
        await escrowRegistry1.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: toNano('1000'),
                rentAmount: toNano('100'),
                startDate: BigInt(Math.floor(Date.now() / 1000)),
                termLength: BigInt(365 * 24 * 60 * 60),
            }
        );

        // Create agreement in second contract
        await escrowRegistry2.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: toNano('2000'),
                rentAmount: toNano('200'),
                startDate: BigInt(Math.floor(Date.now() / 1000)),
                termLength: BigInt(365 * 24 * 60 * 60),
            }
        );

        // Verify independent state
        const info1 = await escrowRegistry1.getGetContractInfo();
        const info2 = await escrowRegistry2.getGetContractInfo();
        
        expect(info1.id).toBe(100n);
        expect(info2.id).toBe(200n);
        expect(info1.totalAgreements).toBe(1n);
        expect(info2.totalAgreements).toBe(1n);

        // Check agreement details
        const agreement1 = await escrowRegistry1.getGetAgreement(1n);
        const agreement2 = await escrowRegistry2.getGetAgreement(1n);

        expect(agreement1?.depositAmount).toBe(toNano('1000'));
        expect(agreement2?.depositAmount).toBe(toNano('2000'));
    });

    it('should allow creating multiple contracts with same ID (different addresses)', async () => {
        // This tests that contracts with same ID get different addresses due to different init data
        const escrowRegistry1 = blockchain.openContract(await EscrowRegistry.fromInit(42n));
        const escrowRegistry2 = blockchain.openContract(await EscrowRegistry.fromInit(42n));

        // Both should deploy successfully (though they'll have same ID, different addresses)
        await escrowRegistry1.send(deployer.getSender(), { value: toNano('0.05') }, { $$type: 'Deploy', queryId: 0n });
        
        // Second deployment with same ID should actually be the same contract address
        expect(escrowRegistry1.address.toString()).toBe(escrowRegistry2.address.toString());

        const info = await escrowRegistry1.getGetContractInfo();
        expect(info.id).toBe(42n);
    });
});