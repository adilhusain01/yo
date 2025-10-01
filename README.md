# TAAS Protocol - Trust-as-a-Service Smart Contract

A decentralized escrow system for rental agreements on the TON blockchain, built with Blueprint framework and Tact smart contract language.

## Overview

TAAS (Trust-as-a-Service) Protocol enables trustless rental agreements where security deposits are automatically staked to generate yield during the rental term. The protocol ensures both landlords and tenants benefit from a transparent, automated escrow system.

## Key Features

### 🔒 **Trustless Escrow System**
- Automated deposit management
- Smart contract-enforced terms
- Multi-party agreement validation

### 💰 **Yield Generation**
- Security deposits are automatically staked
- 5% APY yield generation (configurable)
- Principal returned to tenant, yield to landlord

### 🎛️ **Administrative Controls**
- Owner-controlled pause/unpause functionality
- Agreement cancellation (before deposit)
- Event emissions for tracking

### 📊 **Comprehensive Tracking**
- Agreement status management
- Creation timestamps
- Event logging for all major actions

## Agreement Lifecycle

```
1. Draft (0) → Landlord creates agreement
2. Accepted (1) → Tenant accepts terms
3. DepositReceived (2) → Deposit received by contract
4. DepositStaked (3) → Deposit automatically staked for yield
5. Completed (4) → Term ended, funds distributed
6. Cancelled (5) → Agreement cancelled (only before deposit)
```

## Smart Contract Architecture

### Core Contract: `EscrowRegistry`

**Initialization:**
The contract is initialized with a unique ID that allows for multiple contract instances:
```tact
init(id: Int) {
    self.id = id;
    // ... other initialization
}
```

**State Variables:**
- `id`: Unique identifier for the contract instance (uint32)
- `agreementCounter`: Total number of agreements created
- `agreements`: Map of agreement ID to Agreement struct
- `yieldAdapter`: Address of yield generation service (default set)
- `jettonMaster`: Address of USDT/stablecoin contract (default set)
- `owner`: Contract owner address
- `paused`: Emergency pause state

### Message Types

#### `CreateAgreement`
Creates a new rental agreement.
```typescript
{
  tenant: Address;
  depositAmount: bigint;
  rentAmount: bigint;
  startDate: bigint;
  termLength: bigint;
}
```

#### `AcceptAgreement`
Tenant accepts the agreement terms.
```typescript
{
  agreementId: bigint;
}
```

#### `DepositReceived`
Triggered when deposit is received (keeper bot).
```typescript
{
  agreementId: bigint;
  amount: bigint;
}
```

#### `ClaimAtTermEnd`
Processes agreement completion and fund distribution.
```typescript
{
  agreementId: bigint;
}
```

#### `CancelAgreement`
Cancels agreement before deposit is made.
```typescript
{
  agreementId: bigint;
}
```

#### `SetPaused`
Emergency pause control (owner only).
```typescript
{
  paused: boolean;
}
```

### Getter Methods

- `getAgreement(agreementId)`: Get specific agreement details
- `getAgreementCounter()`: Get total agreement count
- `getContractInfo()`: Get contract metadata and statistics

## Installation & Setup

### Prerequisites

```bash
npm install -g @ton/blueprint
```

### Clone and Install

```bash
git clone <repository-url>
cd taas-protocol/contract
npm install
```

## Development Commands

### Build Contract
```bash
npm run build
# or
npx blueprint build
```

### Run Tests
```bash
npm test
```

### Run Demo
```bash
npm run demo
```

### Deploy Contract
```bash
npm run deploy
# or
npx blueprint run deployTaas
```

## Testing

The project includes comprehensive test suites:

### Basic Functionality Tests (`Taas.spec.ts`)
- Contract deployment
- Agreement creation and acceptance
- Deposit processing and staking
- Term completion and claiming
- Error handling and validation

### Enhanced Features Tests (`Enhanced.spec.ts`)
- Contract information retrieval
- Parameter validation
- Agreement cancellation
- Pause/unpause functionality
- Ownership controls
- Timestamp tracking

### Run All Tests
```bash
npm test
```

Expected output:
```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

## Demo Workflow

Run the interactive demo to see the complete protocol workflow:

```bash
npm run demo
```

The demo demonstrates:
1. Contract deployment
2. Agreement creation by landlord
3. Agreement acceptance by tenant
4. Deposit processing and staking
5. Term completion and fund distribution

## Contract Deployment

### Testnet Deployment

1. Configure your wallet in Blueprint
2. Update yield adapter and jetton master addresses in deployment script
3. Run deployment:

```bash
npx blueprint run deployTaas --testnet
```

### Mainnet Deployment

```bash
npx blueprint run deployTaas --mainnet
```

## Security Features

### Input Validation
- Positive amounts required for deposits and rent
- Future start dates only
- Non-zero term lengths
- Address validation

### Access Controls
- Only tenants can accept agreements
- Only parties can cancel agreements
- Only owner can pause contract
- Time-locked claim mechanisms

### Emergency Controls
- Contract pause functionality
- Agreement cancellation (before deposit)
- Owner-controlled emergency stops

## Gas Costs

Typical gas costs for operations:

- Deploy Contract: ~0.05 TON
- Create Agreement: ~0.05 TON
- Accept Agreement: ~0.05 TON
- Process Deposit: ~0.05 TON
- Claim at Term End: ~0.05 TON

## Integration Examples

### Frontend Integration

```typescript
import { EscrowRegistry } from './build/Taas/Taas_EscrowRegistry';
import { toNano } from '@ton/core';

// Initialize contract with unique ID
const contractId = 1n; // Choose unique ID for your deployment
const escrowRegistry = provider.open(
  await EscrowRegistry.fromInit(contractId)
);

// Create agreement
await escrowRegistry.send(
  landlord.getSender(),
  { value: toNano('0.05') },
  {
    $$type: 'CreateAgreement',
    tenant: tenantAddress,
    depositAmount: toNano('1000'),
    rentAmount: toNano('100'),
    startDate: BigInt(Math.floor(Date.now() / 1000)),
    termLength: BigInt(365 * 24 * 60 * 60),
  }
);

// Get contract info including ID
const info = await escrowRegistry.getGetContractInfo();
console.log('Contract ID:', info.id);
```

### Event Monitoring

The contract emits events for:
- `AgreementCreated`
- `AgreementAccepted`
- `DepositStaked`
- `AgreementCompleted`

## Configuration

### Environment Variables

Create a `.env` file:

```env
YIELD_ADAPTER_ADDRESS=EQ...
JETTON_MASTER_ADDRESS=EQ...
OWNER_MNEMONIC="your wallet mnemonic"
```

### Network Configuration

Update `tact.config.json` for different networks:

```json
{
  "projects": [
    {
      "name": "Taas",
      "path": "./contracts/taas.tact",
      "output": "./build",
      "options": {
        "debug": true
      }
    }
  ]
}
```

## Roadmap

### Phase 1 ✅
- [x] Basic escrow functionality
- [x] Agreement lifecycle management
- [x] Yield generation mechanism
- [x] Comprehensive testing

### Phase 2 🚧
- [ ] Multi-token support
- [ ] Advanced yield strategies
- [ ] Insurance mechanisms
- [ ] Dispute resolution

### Phase 3 📋
- [ ] Mobile app integration
- [ ] Property verification oracles
- [ ] Credit scoring system
- [ ] DAO governance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Create an issue on GitHub
- Join our Telegram community
- Read the documentation

---

**Built with 💚 on TON Blockchain using Blueprint Framework**
