import { Address } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('📊 Checking TAAS Contract Agreements...\n');

    // Contract address from your NEW deployment
    const contractAddress = Address.parse("EQBnzEx5yLpxf-bz_cHCmWM7JRG-CFTiVnsNmAjhTAWkNkT9");
    
    // Connect to the deployed contract
    const escrowRegistry = provider.open(EscrowRegistry.fromAddress(contractAddress));

    try {
        const contractInfo = await escrowRegistry.getGetContractInfo();
        
        console.log('🏠 TAAS Escrow Registry Status:');
        console.log('  Contract ID:', contractInfo.id.toString());
        console.log('  Owner:', contractInfo.owner.toString());
        console.log('  Paused:', contractInfo.paused);
        console.log('  Total Agreements:', contractInfo.totalAgreements.toString());
        
        if (contractInfo.totalAgreements > 0) {
            console.log('\n✅ SUCCESS! Agreements have been created successfully!');
            console.log(`📈 ${contractInfo.totalAgreements} agreement(s) are now stored in the contract.`);
        } else {
            console.log('\n📋 No agreements created yet.');
        }
        
        console.log(`\n🔗 View contract on TONScan:`);
        console.log(`https://testnet.tonscan.org/address/${contractAddress.toString()}`);
        
    } catch (error) {
        console.error('❌ Error reading contract:', error);
    }
}