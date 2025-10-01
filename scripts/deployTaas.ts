import { toNano } from '@ton/core';
import { EscrowRegistry } from '../build/Taas/Taas_EscrowRegistry';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Initialize with a unique ID - you can change this for different deployments
    const contractId = BigInt(Math.floor(Math.random() * 1000000)); // Random ID for demo
    
    const escrowRegistry = provider.open(await EscrowRegistry.fromInit(contractId));

    await escrowRegistry.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    await provider.waitForDeploy(escrowRegistry.address);

    console.log('EscrowRegistry deployed at:', escrowRegistry.address);
    console.log('Contract ID:', contractId);
    
    // Verify deployment by checking initial state
    const contractInfo = await escrowRegistry.getGetContractInfo();
    console.log('Contract Info:');
    console.log('  ID:', contractInfo.id.toString());
    console.log('  Owner:', contractInfo.owner.toString());
    console.log('  Paused:', contractInfo.paused);
    console.log('  Total Agreements:', contractInfo.totalAgreements.toString());
    
    console.log('Deployment completed successfully!');
}
