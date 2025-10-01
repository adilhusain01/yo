import { Address } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { TonClient } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';

async function testAgreementFetching() {
    console.log('🧪 Testing Agreement Fetching from Contract...\n');

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
        console.log('📊 Getting contract info...');
        const contractInfo = await contract.getGetContractInfo();
        
        console.log('✅ Contract Info:');
        console.log('  ID:', contractInfo.id.toString());
        console.log('  Owner:', contractInfo.owner.toString());
        console.log('  Paused:', contractInfo.paused);
        console.log('  Total Agreements:', contractInfo.totalAgreements.toString());
        
        // Try to fetch individual agreements
        console.log('\n📋 Fetching individual agreements...');
        for (let i = 1n; i <= contractInfo.totalAgreements; i++) {
            try {
                console.log(`\nAttempting to fetch Agreement #${i}...`);
                const agreement = await contract.getGetAgreement(i);
                
                if (agreement) {
                    console.log(`✅ Agreement #${i} found:`);
                    console.log('  Landlord:', agreement.landlord.toString());
                    console.log('  Tenant:', agreement.tenant.toString());
                    console.log('  Deposit:', agreement.depositAmount.toString());
                    console.log('  Rent:', agreement.rentAmount.toString());
                    console.log('  Status:', agreement.status.toString());
                    console.log('  Start Date:', new Date(Number(agreement.startDate) * 1000).toISOString());
                } else {
                    console.log(`❌ Agreement #${i} returned null`);
                }
            } catch (err) {
                console.log(`❌ Error fetching Agreement #${i}:`, err instanceof Error ? err.message : String(err));
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAgreementFetching();