import { Address } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('📊 Checking TAAS Contract Status...\n');

    // Contract address from your deployment
    const contractAddress = Address.parse("EQAYHGMUAd0BqzWUJs9Tn8DY4nNPBU_zVlDdInLD9g9CNAFu");
    
    // Connect to the deployed contract
    const escrowRegistry = provider.open(EscrowRegistry.fromAddress(contractAddress));

    try {
        // Get contract info
        const contractInfo = await escrowRegistry.getGetContractInfo();
        console.log('🏢 Contract Information:');
        console.log('  Contract ID:', contractInfo.id.toString());
        console.log('  Owner:', contractInfo.owner.toString());
        console.log('  Paused:', contractInfo.paused);
        console.log('  Total Agreements:', contractInfo.totalAgreements.toString());
        console.log();

        // Get agreement counter
        const agreementCounter = await escrowRegistry.getGetAgreementCounter();
        console.log('📈 Agreement Counter:', agreementCounter.toString());

        if (agreementCounter > 0n) {
            console.log('\n📋 Existing Agreements:');
            
            for (let i = 1n; i <= agreementCounter; i++) {
                const agreement = await escrowRegistry.getGetAgreement(i);
                
                if (agreement) {
                    console.log(`\n  Agreement #${i}:`);
                    console.log('    Landlord:', agreement.landlord.toString());
                    console.log('    Tenant:', agreement.tenant.toString());
                    console.log('    Deposit:', (Number(agreement.depositAmount) / 1e9).toFixed(2), 'TON');
                    console.log('    Rent:', (Number(agreement.rentAmount) / 1e9).toFixed(2), 'TON');
                    console.log('    Status:', getStatusName(Number(agreement.status)));
                    console.log('    Created:', new Date(Number(agreement.createdAt) * 1000).toISOString());
                    
                    if (agreement.stakedShares > 0n) {
                        console.log('    Staked Shares:', (Number(agreement.stakedShares) / 1e9).toFixed(2), 'TON');
                        const yieldAmount = Number(agreement.stakedShares) - Number(agreement.depositAmount);
                        console.log('    Generated Yield:', (yieldAmount / 1e9).toFixed(2), 'TON');
                    }
                }
            }
        } else {
            console.log('\n📝 No agreements found yet.');
            console.log('   - Transaction may still be processing');
            console.log('   - Check again in a few moments');
        }

        console.log('\n🔗 View contract on TONScan:');
        console.log('https://testnet.tonscan.org/address/' + contractAddress.toString());

    } catch (error) {
        console.error('❌ Error checking contract status:', error);
    }
}

function getStatusName(status: number): string {
    switch (status) {
        case 0: return 'Draft (Waiting for tenant acceptance)';
        case 1: return 'Accepted (Waiting for deposit)';
        case 2: return 'Deposit Received (Processing staking)';
        case 3: return 'Deposit Staked (Earning yield)';
        case 4: return 'Completed (Funds distributed)';
        case 5: return 'Cancelled';
        default: return `Unknown (${status})`;
    }
}