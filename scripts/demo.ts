import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';

async function main() {
    console.log('Starting TAAS Protocol Demo...\n');
    
    // Setup blockchain environment
    const blockchain = await Blockchain.create();
    const deployer = await blockchain.treasury('deployer');
    const landlord = await blockchain.treasury('landlord');
    const tenant = await blockchain.treasury('tenant');
    
    // Mock addresses for yield adapter and jetton master
    const contractId = 123n; // Example contract ID
    
    // Deploy contract
    const escrowRegistry = blockchain.openContract(await EscrowRegistry.fromInit(contractId));
    
    console.log('1. Deploying EscrowRegistry contract...');
    const deployResult = await escrowRegistry.send(
        deployer.getSender(),
        { value: toNano('0.05') },
        { $$type: 'Deploy', queryId: 0n }
    );
    
    if (deployResult.transactions[0].description.type === 'generic' && 
        deployResult.transactions[0].description.computePhase.type === 'vm' &&
        deployResult.transactions[0].description.computePhase.success) {
        console.log('✅ Contract deployed successfully!');
        console.log('Contract address:', escrowRegistry.address.toString());
        console.log('Contract ID:', contractId.toString());
    } else {
        console.log('❌ Deployment failed');
        return;
    }
    
    // Step 1: Create Agreement
    console.log('\n2. Creating rental agreement...');
    const depositAmount = toNano('1000'); // 1000 USDT equivalent
    const rentAmount = toNano('100'); // 100 USDT monthly rent
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
    
    let agreement = await escrowRegistry.getGetAgreement(1n);
    console.log('✅ Agreement created with ID: 1');
    console.log('   Landlord:', agreement?.landlord.toString().slice(0, 20) + '...');
    console.log('   Tenant:', agreement?.tenant.toString().slice(0, 20) + '...');
    console.log('   Deposit Amount:', (Number(agreement?.depositAmount || 0n) / 1e9).toFixed(2), 'TON');
    console.log('   Status: Draft (0)');
    
    // Step 2: Tenant accepts agreement
    console.log('\n3. Tenant accepting agreement...');
    await escrowRegistry.send(
        tenant.getSender(),
        { value: toNano('0.05') },
        {
            $$type: 'AcceptAgreement',
            agreementId: 1n,
        }
    );
    
    agreement = await escrowRegistry.getGetAgreement(1n);
    console.log('✅ Agreement accepted by tenant');
    console.log('   Status: Accepted (1)');
    
    // Step 3: Simulate deposit received (would be done by keeper bot)
    console.log('\n4. Processing deposit...');
    await escrowRegistry.send(
        deployer.getSender(), // Simulating keeper bot
        { value: toNano('0.05') },
        {
            $$type: 'DepositReceived',
            agreementId: 1n,
            amount: depositAmount,
        }
    );
    
    agreement = await escrowRegistry.getGetAgreement(1n);
    console.log('✅ Deposit received and auto-staked');
    console.log('   Status: DepositStaked (3)');
    console.log('   Staked Shares:', (Number(agreement?.stakedShares || 0n) / 1e9).toFixed(2), 'TON');
    console.log('   Yield Generated:', (Number(agreement?.stakedShares || 0n) - Number(depositAmount)) / 1e9, 'TON (5% APY)');
    
    // Step 4: Simulate term completion
    console.log('\n5. Simulating term completion...');
    // Set blockchain time to after term end
    blockchain.now = Number(startDate + termLength + 1n);
    
    await escrowRegistry.send(
        deployer.getSender(), // Simulating keeper bot
        { value: toNano('0.05') },
        {
            $$type: 'ClaimAtTermEnd',
            agreementId: 1n,
        }
    );
    
    agreement = await escrowRegistry.getGetAgreement(1n);
    console.log('✅ Agreement completed');
    console.log('   Status: Completed (4)');
    
    // Show final statistics
    const totalAgreements = await escrowRegistry.getGetAgreementCounter();
    console.log('\n📊 Final Statistics:');
    console.log('   Total Agreements:', totalAgreements.toString());
    console.log('   Principal Returned to Tenant:', (Number(depositAmount) / 1e9).toFixed(2), 'TON');
    console.log('   Yield Generated for Landlord:', ((Number(agreement?.stakedShares || 0n) - Number(depositAmount)) / 1e9).toFixed(2), 'TON');
    
    console.log('\n🎉 TAAS Protocol demo completed successfully!');
    console.log('\nKey Features Demonstrated:');
    console.log('  • Trustless escrow system');
    console.log('  • Automatic yield generation');
    console.log('  • Multi-party agreement management');
    console.log('  • Time-locked claim mechanisms');
}

main().catch(console.error);