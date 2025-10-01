import { toNano, Address } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('🏠 Creating TAAS Rental Agreement...\n');

    // Contract address from your NEW deployment with fixed date validation
    const contractAddress = Address.parse("EQBnzEx5yLpxf-bz_cHCmWM7JRG-CFTiVnsNmAjhTAWkNkT9");
    
    // Agreement parameters
    const tenantAddress = Address.parse("EQCXfRt4PmytefQwbWEPfj4pRlKrXXF1u5QOfE3_kWDNNsNX"); // Fixed: EQ instead of 0Q
    const depositAmount = toNano('0.5'); // 0.5 TON
    const rentAmount = toNano('0.1');    // 0.1 TON
    const startDate = BigInt(Math.floor(Date.now() / 1000) + 600); // Start 10 minutes from now to ensure it's in future
    const termLength = BigInt(365 * 24 * 60 * 60); // 1 year in seconds

    // Connect to the deployed contract
    const escrowRegistry = provider.open(EscrowRegistry.fromAddress(contractAddress));

    console.log('📋 Agreement Details:');
    console.log('  Tenant Address:', tenantAddress.toString());
    console.log('  Deposit Amount:', '0.5 TON');
    console.log('  Rent Amount:', '0.1 TON');
    console.log('  Start Date:', new Date(Number(startDate) * 1000).toISOString());
    console.log('  Term Length:', '1 year');
    console.log('  Landlord (You):', provider.sender().address?.toString());
    console.log();

    // Validate parameters before sending
    console.log('🔍 Validating parameters...');
    console.log('  Deposit > 0:', depositAmount > 0n);
    console.log('  Rent > 0:', rentAmount > 0n);
    console.log('  Term length > 0:', termLength > 0n);
    console.log('  Start date in future:', startDate > BigInt(Math.floor(Date.now() / 1000)));
    console.log();

    // Create the agreement
    console.log('📝 Creating agreement...');
    const result = await escrowRegistry.send(
        provider.sender(),
        {
            value: toNano('0.2'), // Increased gas fee
        },
        {
            $$type: 'CreateAgreement',
            tenant: tenantAddress,
            depositAmount: depositAmount,
            rentAmount: rentAmount,
            startDate: startDate,
            termLength: termLength,
        }
    );

    console.log('✅ Agreement creation transaction sent!');
    console.log('Transaction hash:', result);

    // Wait a moment for the transaction to be processed
    console.log('\n⏳ Waiting for transaction to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        // Get the updated agreement counter
        const agreementCounter = await escrowRegistry.getGetAgreementCounter();
        console.log('📊 Total agreements in contract:', agreementCounter.toString());

        if (agreementCounter > 0n) {
            // Get the latest agreement (should be the one we just created)
            const latestAgreement = await escrowRegistry.getGetAgreement(agreementCounter);
            
            if (latestAgreement) {
                console.log('\n🎉 Agreement created successfully!');
                console.log('Agreement Details:');
                console.log('  Agreement ID:', agreementCounter.toString());
                console.log('  Landlord:', latestAgreement.landlord.toString());
                console.log('  Tenant:', latestAgreement.tenant.toString());
                console.log('  Deposit Amount:', (Number(latestAgreement.depositAmount) / 1e9).toFixed(2), 'TON');
                console.log('  Rent Amount:', (Number(latestAgreement.rentAmount) / 1e9).toFixed(2), 'TON');
                console.log('  Status:', getStatusName(Number(latestAgreement.status)));
                console.log('  Created At:', new Date(Number(latestAgreement.createdAt) * 1000).toISOString());
                
                console.log('\n📱 Next Steps:');
                console.log('1. Share agreement ID', agreementCounter.toString(), 'with tenant');
                console.log('2. Tenant needs to accept the agreement');
                console.log('3. Tenant sends deposit to trigger staking');
                console.log('4. Funds will be automatically staked for yield generation');
                
                console.log('\n🔗 View on TONScan:');
                console.log('https://testnet.tonscan.org/address/' + contractAddress.toString());
            }
        }
    } catch (error) {
        console.log('⚠️ Could not retrieve agreement details immediately.');
        console.log('The agreement may still be processing. Please check the contract later.');
        console.log('Error:', error);
    }

    console.log('\n✨ Agreement creation completed!');
}

function getStatusName(status: number): string {
    switch (status) {
        case 0: return 'Draft (Waiting for tenant acceptance)';
        case 1: return 'Accepted (Waiting for deposit)';
        case 2: return 'Deposit Received (Processing staking)';
        case 3: return 'Deposit Staked (Earning yield)';
        case 4: return 'Completed (Funds distributed)';
        case 5: return 'Cancelled';
        default: return 'Unknown';
    }
}