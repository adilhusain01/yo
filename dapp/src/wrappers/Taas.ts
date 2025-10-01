import {
    Cell,
    Address,
    beginCell,
    contractAddress,
    ContractProvider,
    Sender,
    Contract,
    SendMode,
} from '@ton/core';

// Import from the generated file
import { 
    Taas as GeneratedTaas
} from '../build/Taas/Taas_Taas.js';

export type TaasConfig = {};

export function taasConfigToCell(config: TaasConfig): Cell {
    return beginCell().endCell();
}

export class Taas implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Taas(address);
    }

    static async createFromConfig(config: TaasConfig, code: Cell, workchain = 0) {
        const data = taasConfigToCell(config);
        const init = { code, data };
        return new Taas(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async send(provider: ContractProvider, via: Sender, value: bigint) {
        const generated = new GeneratedTaas(this.address, this.init);
        return await generated.send(provider, via, { value }, null);
    }
}