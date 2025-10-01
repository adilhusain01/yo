import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import '@ton/test-utils';

describe('EscrowRegistry - Enhanced Features', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let landlord: SandboxContract<TreasuryContract>;
    let tenant: SandboxContract<TreasuryContract>;
    let escrowRegistry: SandboxContract<EscrowRegistry>;
    
    const yieldAdapterAddr = Address.parse("EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N");
    const jettonMasterAddr = Address.parse("EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA");

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        escrowRegistry = blockchain.openContract(await EscrowRegistry.fromInit(2n)); // Initialize with ID = 2

        deployer = await blockchain.treasury('deployer');
        landlord = await blockchain.treasury('landlord');
        tenant = await blockchain.treasury('tenant');

        await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            { $$type: 'Deploy', queryId: 0n }
        );
    });

    it('should get contract info', async () => {
        const contractInfo = await escrowRegistry.getGetContractInfo();
        
        expect(contractInfo.id).toBe(2n); // Check the ID we initialized with
        expect(contractInfo.owner.toString()).toBe(deployer.address.toString());
        expect(contractInfo.paused).toBe(false);
        expect(contractInfo.totalAgreements).toBe(0n);
    });

    it('should validate agreement creation parameters', async () => {
        // Test with zero deposit amount
        const result1 = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: 0n,
                rentAmount: toNano('100'),
                startDate: BigInt(Math.floor(Date.now() / 1000)),
                termLength: BigInt(365 * 24 * 60 * 60),
            }
        );

        expect(result1.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });

        // Test with zero rent amount
        const result2 = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: toNano('1000'),
                rentAmount: 0n,
                startDate: BigInt(Math.floor(Date.now() / 1000)),
                termLength: BigInt(365 * 24 * 60 * 60),
            }
        );

        expect(result2.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });

        // Test with zero term length
        const result3 = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: toNano('1000'),
                rentAmount: toNano('100'),
                startDate: BigInt(Math.floor(Date.now() / 1000)),
                termLength: 0n,
            }
        );

        expect(result3.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });
    });

    it('should allow agreement cancellation', async () => {
        // Create agreement
        await escrowRegistry.send(
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

        // Landlord cancels agreement
        const cancelResult = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CancelAgreement',
                agreementId: 1n,
            }
        );

        expect(cancelResult.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: true,
        });

        const agreement = await escrowRegistry.getGetAgreement(1n);
        expect(agreement?.status).toBe(5n); // Cancelled status
    });

    it('should not allow cancellation after deposit', async () => {
        // Create and accept agreement
        await escrowRegistry.send(
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

        await escrowRegistry.send(
            tenant.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'AcceptAgreement',
                agreementId: 1n,
            }
        );

        // Process deposit
        await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'DepositReceived',
                agreementId: 1n,
                amount: toNano('1000'),
            }
        );

        // Try to cancel (should fail)
        const cancelResult = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CancelAgreement',
                agreementId: 1n,
            }
        );

        expect(cancelResult.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });
    });

    it('should allow owner to pause and unpause contract', async () => {
        // Pause contract
        const pauseResult = await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetPaused',
                paused: true,
            }
        );

        expect(pauseResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowRegistry.address,
            success: true,
        });

        // Try to create agreement when paused (should fail)
        const createResult = await escrowRegistry.send(
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

        expect(createResult.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });

        // Unpause contract
        await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetPaused',
                paused: false,
            }
        );

        // Now create agreement should work
        const createResult2 = await escrowRegistry.send(
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

        expect(createResult2.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: true,
        });
    });

    it('should not allow non-owner to pause contract', async () => {
        const pauseResult = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'SetPaused',
                paused: true,
            }
        );

        expect(pauseResult.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });
    });

    it('should track agreement creation time', async () => {
        const beforeTime = Math.floor(Date.now() / 1000);
        
        await escrowRegistry.send(
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

        const afterTime = Math.floor(Date.now() / 1000);
        const agreement = await escrowRegistry.getGetAgreement(1n);
        
        expect(Number(agreement?.createdAt || 0n)).toBeGreaterThanOrEqual(beforeTime);
        expect(Number(agreement?.createdAt || 0n)).toBeLessThanOrEqual(afterTime);
    });
});