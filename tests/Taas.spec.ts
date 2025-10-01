import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import '@ton/test-utils';

describe('EscrowRegistry', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let landlord: SandboxContract<TreasuryContract>;
    let tenant: SandboxContract<TreasuryContract>;
    let escrowRegistry: SandboxContract<EscrowRegistry>;
    
    // Mock addresses for yield adapter and jetton master
    const yieldAdapterAddr = Address.parse("EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N");
    const jettonMasterAddr = Address.parse("EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA");

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        escrowRegistry = blockchain.openContract(await EscrowRegistry.fromInit(1n)); // Initialize with ID = 1

        deployer = await blockchain.treasury('deployer');
        landlord = await blockchain.treasury('landlord');
        tenant = await blockchain.treasury('tenant');

        const deployResult = await escrowRegistry.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowRegistry.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and escrowRegistry are ready to use
        const counter = await escrowRegistry.getGetAgreementCounter();
        expect(counter).toBe(0n);
    });

    it('should create a new agreement', async () => {
        const depositAmount = toNano('1000'); // 1000 USDT equivalent
        const rentAmount = toNano('100'); // 100 USDT equivalent
        const startDate = BigInt(Math.floor(Date.now() / 1000)); // Current timestamp
        const termLength = BigInt(365 * 24 * 60 * 60); // 1 year in seconds

        const result = await escrowRegistry.send(
            landlord.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
            }
        );

        expect(result.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: true,
        });

        const counter = await escrowRegistry.getGetAgreementCounter();
        expect(counter).toBe(1n);

        const agreement = await escrowRegistry.getGetAgreement(1n);
        expect(agreement).toBeDefined();
        expect(agreement?.landlord.toString()).toBe(landlord.address.toString());
        expect(agreement?.tenant.toString()).toBe(tenant.address.toString());
        expect(agreement?.depositAmount).toBe(depositAmount);
        expect(agreement?.rentAmount).toBe(rentAmount);
        expect(agreement?.status).toBe(0n); // Draft status
    });

    it('should allow tenant to accept agreement', async () => {
        // First create an agreement
        const depositAmount = toNano('1000');
        const rentAmount = toNano('100');
        const startDate = BigInt(Math.floor(Date.now() / 1000));
        const termLength = BigInt(365 * 24 * 60 * 60);

        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
            }
        );

        // Tenant accepts the agreement
        const acceptResult = await escrowRegistry.send(
            tenant.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'AcceptAgreement',
                agreementId: 1n,
            }
        );

        expect(acceptResult.transactions).toHaveTransaction({
            from: tenant.address,
            to: escrowRegistry.address,
            success: true,
        });

        const agreement = await escrowRegistry.getGetAgreement(1n);
        expect(agreement?.status).toBe(1n); // Accepted status
    });

    it('should not allow non-tenant to accept agreement', async () => {
        // First create an agreement
        const depositAmount = toNano('1000');
        const rentAmount = toNano('100');
        const startDate = BigInt(Math.floor(Date.now() / 1000));
        const termLength = BigInt(365 * 24 * 60 * 60);

        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
            }
        );

        // Landlord tries to accept (should fail)
        const acceptResult = await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'AcceptAgreement',
                agreementId: 1n,
            }
        );

        expect(acceptResult.transactions).toHaveTransaction({
            from: landlord.address,
            to: escrowRegistry.address,
            success: false,
        });
    });

    it('should handle deposit received and auto-stake', async () => {
        // Create and accept agreement
        const depositAmount = toNano('1000');
        const rentAmount = toNano('100');
        const startDate = BigInt(Math.floor(Date.now() / 1000));
        const termLength = BigInt(365 * 24 * 60 * 60);

        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
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

        // Simulate deposit received
        const depositResult = await escrowRegistry.send(
            deployer.getSender(), // Simulating keeper bot
            { value: toNano('0.05') },
            {
                $$type: 'DepositReceived',
                agreementId: 1n,
                amount: depositAmount,
            }
        );

        expect(depositResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowRegistry.address,
            success: true,
        });

        const agreement = await escrowRegistry.getGetAgreement(1n);
        expect(agreement?.status).toBe(3n); // DepositStaked status
        
        // Check that staked shares include 5% yield
        const expectedShares = depositAmount + (depositAmount * 5n / 100n);
        expect(agreement?.stakedShares).toBe(expectedShares);
    });

    it('should not accept incorrect deposit amount', async () => {
        // Create and accept agreement
        const depositAmount = toNano('1000');
        const rentAmount = toNano('100');
        const startDate = BigInt(Math.floor(Date.now() / 1000));
        const termLength = BigInt(365 * 24 * 60 * 60);

        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
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

        // Try to deposit wrong amount
        const depositResult = await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'DepositReceived',
                agreementId: 1n,
                amount: toNano('500'), // Wrong amount
            }
        );

        expect(depositResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowRegistry.address,
            success: false,
        });
    });

    it('should handle claim at term end', async () => {
        // Create, accept, and stake agreement
        const depositAmount = toNano('1000');
        const rentAmount = toNano('100');
        const startDate = BigInt(Math.floor(Date.now() / 1000));
        const termLength = BigInt(60); // 1 minute for testing

        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
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

        await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'DepositReceived',
                agreementId: 1n,
                amount: depositAmount,
            }
        );

        // Advance time to end of term
        blockchain.now = Number(startDate + termLength + 1n);

        // Claim at term end
        const claimResult = await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'ClaimAtTermEnd',
                agreementId: 1n,
            }
        );

        expect(claimResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowRegistry.address,
            success: true,
        });

        const agreement = await escrowRegistry.getGetAgreement(1n);
        expect(agreement?.status).toBe(4n); // Completed status
    });

    it('should not allow claim before term end', async () => {
        // Create, accept, and stake agreement
        const depositAmount = toNano('1000');
        const rentAmount = toNano('100');
        const startDate = BigInt(Math.floor(Date.now() / 1000));
        const termLength = BigInt(365 * 24 * 60 * 60); // 1 year

        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant.address,
                depositAmount: depositAmount,
                rentAmount: rentAmount,
                startDate: startDate,
                termLength: termLength,
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

        await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'DepositReceived',
                agreementId: 1n,
                amount: depositAmount,
            }
        );

        // Try to claim before term end
        const claimResult = await escrowRegistry.send(
            deployer.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'ClaimAtTermEnd',
                agreementId: 1n,
            }
        );

        expect(claimResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrowRegistry.address,
            success: false,
        });
    });

    it('should handle multiple agreements', async () => {
        const tenant2 = await blockchain.treasury('tenant2');
        
        // Create first agreement
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

        // Create second agreement
        await escrowRegistry.send(
            landlord.getSender(),
            { value: toNano('0.05') },
            {
                $$type: 'CreateAgreement',
                tenant: tenant2.address,
                depositAmount: toNano('2000'),
                rentAmount: toNano('200'),
                startDate: BigInt(Math.floor(Date.now() / 1000)),
                termLength: BigInt(365 * 24 * 60 * 60),
            }
        );

        const counter = await escrowRegistry.getGetAgreementCounter();
        expect(counter).toBe(2n);

        const agreement1 = await escrowRegistry.getGetAgreement(1n);
        const agreement2 = await escrowRegistry.getGetAgreement(2n);

        expect(agreement1?.tenant.toString()).toBe(tenant.address.toString());
        expect(agreement2?.tenant.toString()).toBe(tenant2.address.toString());
        expect(agreement1?.depositAmount).toBe(toNano('1000'));
        expect(agreement2?.depositAmount).toBe(toNano('2000'));
    });
});
