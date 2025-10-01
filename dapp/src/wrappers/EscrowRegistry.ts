import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    SendMode,
    toNano
} from '@ton/core';

// Import from the generated file
import { 
    EscrowRegistry as GeneratedEscrowRegistry,
    CreateAgreement,
    AcceptAgreement,
    DepositReceived,
    ClaimAtTermEnd,
    CancelAgreement,
    SetPaused,
    Deploy,
    storeCreateAgreement,
    storeAcceptAgreement,
    storeDepositReceived,
    storeClaimAtTermEnd,
    storeCancelAgreement,
    storeSetPaused,
    storeDeploy,
    Agreement,
    ContractInfo
} from '../../build/Taas/Taas_EscrowRegistry';

export type EscrowRegistryConfig = {
    id: bigint;
};

export function escrowRegistryConfigToCell(config: EscrowRegistryConfig): Cell {
    return beginCell()
        .storeUint(config.id, 32)
        .endCell();
}

export class EscrowRegistry implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new EscrowRegistry(address);
    }

    static async createFromConfig(config: EscrowRegistryConfig, code: Cell, workchain = 0) {
        const data = escrowRegistryConfigToCell(config);
        const init = { code, data };
        return new EscrowRegistry(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint = 0n) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeDeploy({ $$type: 'Deploy', queryId }))
                .endCell(),
        });
    }

    async sendCreateAgreement(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        tenant: Address,
        depositAmount: bigint,
        rentAmount: bigint,
        startDate: bigint,
        termLength: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeCreateAgreement({
                    $$type: 'CreateAgreement',
                    tenant,
                    depositAmount,
                    rentAmount,
                    startDate,
                    termLength
                }))
                .endCell(),
        });
    }

    async sendAcceptAgreement(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        agreementId: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeAcceptAgreement({
                    $$type: 'AcceptAgreement',
                    agreementId
                }))
                .endCell(),
        });
    }

    async sendDepositReceived(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        agreementId: bigint,
        amount: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeDepositReceived({
                    $$type: 'DepositReceived',
                    agreementId,
                    amount
                }))
                .endCell(),
        });
    }

    async sendClaimAtTermEnd(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        agreementId: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeClaimAtTermEnd({
                    $$type: 'ClaimAtTermEnd',
                    agreementId
                }))
                .endCell(),
        });
    }

    async sendCancelAgreement(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        agreementId: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeCancelAgreement({
                    $$type: 'CancelAgreement',
                    agreementId
                }))
                .endCell(),
        });
    }

    async sendSetPaused(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        paused: boolean
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .store(storeSetPaused({
                    $$type: 'SetPaused',
                    paused
                }))
                .endCell(),
        });
    }

    // Get methods
    async getGetAgreement(provider: ContractProvider, agreementId: bigint): Promise<Agreement | null> {
        const generated = new GeneratedEscrowRegistry(this.address, this.init);
        return await generated.getGetAgreement(provider, agreementId);
    }

    async getGetAgreementCounter(provider: ContractProvider): Promise<bigint> {
        const generated = new GeneratedEscrowRegistry(this.address, this.init);
        return await generated.getGetAgreementCounter(provider);
    }

    async getGetContractInfo(provider: ContractProvider): Promise<ContractInfo> {
        const generated = new GeneratedEscrowRegistry(this.address, this.init);
        return await generated.getGetContractInfo(provider);
    }

    async getGetAgreementsByStatus(provider: ContractProvider, status: bigint): Promise<Dictionary<bigint, Agreement>> {
        const generated = new GeneratedEscrowRegistry(this.address, this.init);
        return await generated.getGetAgreementsByStatus(provider, status);
    }
}