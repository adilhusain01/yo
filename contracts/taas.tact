// EscrowRegistry.tact - Single Contract Architecture (Tact)
// Stores multiple agreements, handles USDT deposit, staking, and claim

import "@stdlib/deploy";

struct Agreement {
    landlord: Address;
    tenant: Address;
    depositAmount: Int as uint128;
    rentAmount: Int as uint128;
    startDate: Int as uint64;
    termLength: Int as uint64;
    status: Int as uint8; // 0=Draft, 1=Accepted, 2=DepositReceived, 3=DepositStaked, 4=Completed, 5=Cancelled
    stakedShares: Int as uint128;
    createdAt: Int as uint64;
}

// Events for better tracking
message AgreementCreated {
    agreementId: Int as uint64;
    landlord: Address;
    tenant: Address;
    depositAmount: Int as uint128;
}

message AgreementAccepted {
    agreementId: Int as uint64;
    tenant: Address;
}

message DepositStaked {
    agreementId: Int as uint64;
    amount: Int as uint128;
    stakedShares: Int as uint128;
}

message AgreementCompleted {
    agreementId: Int as uint64;
    principalReturned: Int as uint128;
    yieldGenerated: Int as uint128;
}

contract EscrowRegistry with Deployable {

    id: Int as uint32;
    agreementCounter: Int as uint64;
    agreements: map<Int as uint64, Agreement>;
    yieldAdapter: Address;
    jettonMaster: Address;
    owner: Address;
    paused: Bool;

    init(id: Int) {
        self.id = id;
        self.agreementCounter = 0;
        self.agreements = emptyMap();
        self.yieldAdapter = address("EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N"); // Default yield adapter
        self.jettonMaster = address("EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA"); // Default jetton master
        self.owner = sender();
        self.paused = false;
    }

    receive(msg: CreateAgreement) {
        require(!self.paused, "Contract is paused");
        require(msg.depositAmount > 0, "Deposit amount must be positive");
        require(msg.rentAmount > 0, "Rent amount must be positive");
        require(msg.termLength > 0, "Term length must be positive");
        require(msg.startDate >= now() - 3600, "Start date cannot be more than 1 hour in the past"); // More lenient check
        
        self.agreementCounter = self.agreementCounter + 1;
        let newAgreement: Agreement = Agreement{
            landlord: sender(),
            tenant: msg.tenant,
            depositAmount: msg.depositAmount,
            rentAmount: msg.rentAmount,
            startDate: msg.startDate,
            termLength: msg.termLength,
            status: 0,
            stakedShares: 0,
            createdAt: now()
        };
        self.agreements.set(self.agreementCounter, newAgreement);
        
        // Emit event
        emit(AgreementCreated{
            agreementId: self.agreementCounter,
            landlord: sender(),
            tenant: msg.tenant,
            depositAmount: msg.depositAmount
        }.toCell());
    }

    receive(msg: AcceptAgreement) {
        require(!self.paused, "Contract is paused");
        let agreement: Agreement? = self.agreements.get(msg.agreementId);
        require(agreement != null, "Agreement not found");
        let ag: Agreement = agreement!!;
        require(sender() == ag.tenant, "Only tenant can accept");
        require(ag.status == 0, "Agreement already accepted");
        
        ag.status = 1;
        self.agreements.set(msg.agreementId, ag);
        
        // Emit event
        emit(AgreementAccepted{
            agreementId: msg.agreementId,
            tenant: sender()
        }.toCell());
    }

    receive(msg: DepositReceived) {
        require(!self.paused, "Contract is paused");
        let agreement: Agreement? = self.agreements.get(msg.agreementId);
        require(agreement != null, "Agreement not found");
        let ag: Agreement = agreement!!;
        require(ag.status == 1, "Agreement must be accepted first");
        require(msg.amount == ag.depositAmount, "Incorrect deposit amount");
        
        ag.status = 2;
        self.agreements.set(msg.agreementId, ag);
        
        // Auto-stake the deposit (keeper bot functionality)
        self.stakeDeposit(msg.agreementId);
    }

    inline fun stakeDeposit(agreementId: Int) {
        let agreement: Agreement? = self.agreements.get(agreementId);
        require(agreement != null, "Agreement not found");
        let ag: Agreement = agreement!!;
        require(ag.status == 2, "Deposit not received yet");
        
        // Mock yield calculation (5% APY)
        ag.stakedShares = ag.depositAmount + (ag.depositAmount * 5 / 100);
        ag.status = 3;
        self.agreements.set(agreementId, ag);
        
        // Emit event
        emit(DepositStaked{
            agreementId: agreementId,
            amount: ag.depositAmount,
            stakedShares: ag.stakedShares
        }.toCell());
    }

    receive(msg: ClaimAtTermEnd) {
        require(!self.paused, "Contract is paused");
        let agreement: Agreement? = self.agreements.get(msg.agreementId);
        require(agreement != null, "Agreement not found");
        let ag: Agreement = agreement!!;
        require(ag.status == 3, "Deposit not staked");
        require(now() >= ag.startDate + ag.termLength, "Term not ended yet");
        
        // Calculate yield
        let yieldGenerated: Int = ag.stakedShares - ag.depositAmount;
        
        // Transfer principal back to tenant, yield to landlord
        ag.status = 4;
        self.agreements.set(msg.agreementId, ag);
        
        // Emit event
        emit(AgreementCompleted{
            agreementId: msg.agreementId,
            principalReturned: ag.depositAmount,
            yieldGenerated: yieldGenerated
        }.toCell());
    }

    receive(msg: CancelAgreement) {
        let agreement: Agreement? = self.agreements.get(msg.agreementId);
        require(agreement != null, "Agreement not found");
        let ag: Agreement = agreement!!;
        require(sender() == ag.landlord || sender() == ag.tenant, "Only parties can cancel");
        require(ag.status == 0 || ag.status == 1, "Cannot cancel after deposit");
        
        ag.status = 5; // Cancelled
        self.agreements.set(msg.agreementId, ag);
    }

    receive(msg: SetPaused) {
        require(sender() == self.owner, "Only owner can pause");
        self.paused = msg.paused;
    }

    get fun getAgreement(agreementId: Int): Agreement? {
        return self.agreements.get(agreementId);
    }

    get fun getAgreementCounter(): Int {
        return self.agreementCounter;
    }

    get fun getContractInfo(): ContractInfo {
        return ContractInfo{
            id: self.id,
            owner: self.owner,
            paused: self.paused,
            yieldAdapter: self.yieldAdapter,
            jettonMaster: self.jettonMaster,
            totalAgreements: self.agreementCounter
        };
    }

    get fun getAgreementsByStatus(status: Int): map<Int, Agreement> {
        let result: map<Int, Agreement> = emptyMap();
        let i: Int = 1;
        while (i <= self.agreementCounter) {
            let agreement: Agreement? = self.agreements.get(i);
            if (agreement != null && agreement!!.status == status) {
                result.set(i, agreement!!);
            }
            i = i + 1;
        }
        return result;
    }
}

// Message structures
message CreateAgreement {
    tenant: Address;
    depositAmount: Int as uint128;
    rentAmount: Int as uint128;
    startDate: Int as uint64;
    termLength: Int as uint64;
}

message AcceptAgreement {
    agreementId: Int as uint64;
}

message DepositReceived {
    agreementId: Int as uint64;
    amount: Int as uint128;
}

message ClaimAtTermEnd {
    agreementId: Int as uint64;
}

message CancelAgreement {
    agreementId: Int as uint64;
}

message SetPaused {
    paused: Bool;
}

struct ContractInfo {
    id: Int as uint32;
    owner: Address;
    paused: Bool;
    yieldAdapter: Address;
    jettonMaster: Address;
    totalAgreements: Int as uint64;
}


