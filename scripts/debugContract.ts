import { toNano, Address } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('🔍 Debug: Testing Contract Interaction...\n');

    // Contract address from your NEW deployment with fixed date validation
    const contractAddress = Address.parse("EQBnzEx5yLpxf-bz_cHCmWM7JRG-CFTiVnsNmAjhTAWkNkT9");
    
    // Connect to the deployed contract
    const escrowRegistry = provider.open(EscrowRegistry.fromAddress(contractAddress));

    // First, let's check if we can read from the contract
    console.log('📊 Reading contract state...');
    try {
        const contractInfo = await escrowRegistry.getGetContractInfo();
        console.log('✅ Contract is accessible');
        console.log('  ID:', contractInfo.id.toString());
        console.log('  Owner:', contractInfo.owner.toString());
        console.log('  Paused:', contractInfo.paused);
        console.log('  Total Agreements:', contractInfo.totalAgreements.toString());
        
        // Check if contract is paused
        if (contractInfo.paused) {
            console.log('❌ Contract is PAUSED - cannot create agreements');
            return;
        }
        
        // Check ownership
        const senderAddress = provider.sender().address?.toString();
        console.log('  Your address:', senderAddress);
        console.log();
        
    } catch (error) {
        console.log('❌ Cannot read contract state:', error);
        return;
    }

    // Test with minimal parameters first
    console.log('🧪 Testing with minimal parameters...');
    
    const tenantAddress = Address.parse("EQCXfRt4PmytefQwbWEPfj4pRlKrXXF1u5QOfE3_kWDNNsNX");
    const depositAmount = toNano('0.001'); // Very small amount for testing
    const rentAmount = toNano('0.001');    // Very small amount for testing
    const startDate = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 minutes from now
    const termLength = BigInt(3600); // 1 hour for testing

    console.log('Parameters:');
    console.log('  Tenant:', tenantAddress.toString());
    console.log('  Deposit:', (Number(depositAmount) / 1e9), 'TON');
    console.log('  Rent:', (Number(rentAmount) / 1e9), 'TON');
    console.log('  Start:', new Date(Number(startDate) * 1000).toISOString());
    console.log('  Term:', Number(termLength), 'seconds');
    console.log();

    // Validate all requirements
    console.log('🔍 Parameter validation:');
    console.log('  Deposit > 0:', depositAmount > 0n ? '✅' : '❌');
    console.log('  Rent > 0:', rentAmount > 0n ? '✅' : '❌');
    console.log('  Term length > 0:', termLength > 0n ? '✅' : '❌');
    console.log('  Start date in future:', startDate > BigInt(Math.floor(Date.now() / 1000)) ? '✅' : '❌');
    console.log();

    try {
        console.log('📤 Sending CreateAgreement transaction...');
        const result = await escrowRegistry.send(
            provider.sender(),
            {
                value: toNano('0.2'), // Higher gas fee
                bounce: true, // Enable bounce to see errors
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

        console.log('✅ Transaction sent successfully!');
        console.log('Result:', result);

        // Wait for processing
        console.log('\n⏳ Waiting 10 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Check if agreement was created
        const newCounter = await escrowRegistry.getGetAgreementCounter();
        console.log('📊 New agreement counter:', newCounter.toString());

        if (newCounter > 0n) {
            console.log('🎉 SUCCESS! Agreement created!');
            const agreement = await escrowRegistry.getGetAgreement(newCounter);
            if (agreement) {
                console.log('Agreement details:');
                console.log('  ID:', newCounter.toString());
                console.log('  Status:', agreement.status.toString());
            }
        } else {
            console.log('⚠️ No agreement found - transaction may have failed');
        }

    } catch (error) {
        console.log('❌ Transaction failed:', error);
        
        // Additional debugging
        if (error instanceof Error) {
            console.log('Error message:', error.message);
            console.log('Error details:', error.toString());
        }
    }

    console.log('\n🔗 Check transaction on TONScan:');
    console.log('https://testnet.tonscan.org/address/' + contractAddress.toString());
}