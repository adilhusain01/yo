import { Address } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { TonClient } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

async function diagnoseAgreementIssue() {
    console.log('🔍 Diagnosing Agreement Storage Issue...\n');

    try {
        // Contract address
        const contractAddress = Address.parse("EQBnzEx5yLpxf-bz_cHCmWM7JRG-CFTiVnsNmAjhTAWkNkT9");
        
        // Create client
        const endpoint = await getHttpEndpoint({ network: 'testnet' });
        const client = new TonClient({ endpoint });
        
        // Connect to contract
        const escrowRegistry = EscrowRegistry.fromAddress(contractAddress);
        const contract = client.open(escrowRegistry);
        
        // Get contract info
        console.log('📊 Contract Info:');
        const contractInfo = await contract.getGetContractInfo();
        console.log('  Total Agreements:', contractInfo.totalAgreements.toString());
        
        // Try to get counter using the getter method
        console.log('\n📊 Using getAgreementCounter:');
        const counter = await contract.getGetAgreementCounter();
        console.log('  Counter:', counter.toString());
        
        // Check if both values match
        if (contractInfo.totalAgreements === counter) {
            console.log('✅ Both methods return the same count');
        } else {
            console.log('❌ Mismatch between totalAgreements and counter');
        }
        
        // Try to see if we can understand the error better
        console.log('\n🔍 Detailed error analysis:');
        for (let i = 1n; i <= counter; i++) {
            try {
                console.log(`\n--- Testing Agreement ID ${i} ---`);
                const result = await contract.getGetAgreement(i);
                console.log('Result type:', typeof result);
                console.log('Result value:', result);
                
                if (result === null) {
                    console.log('❌ Agreement returned null');
                } else if (result === undefined) {
                    console.log('❌ Agreement returned undefined');
                } else {
                    console.log('✅ Agreement found:', result);
                }
            } catch (err) {
                console.log(`❌ Error details for Agreement ${i}:`);
                console.log('  Error type:', typeof err);
                console.log('  Error message:', err instanceof Error ? err.message : String(err));
                console.log('  Full error:', err);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

diagnoseAgreementIssue();