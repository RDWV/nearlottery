import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";

const THIRTY_TGAS = "30000000000000";
const NO_DEPOSIT = "0";

export class Wallet {
  constructor({ contractId }) {
    this.contractId = contractId;
    this.walletSelector = null;
    this.wallet = null;
    this.accountId = null;
  }

  async startUp() {
    this.walletSelector = await setupWalletSelector({
      network: "testnet",
      modules: [setupMyNearWallet()],
    });

    const isSignedIn = this.walletSelector.isSignedIn();

    if (isSignedIn) {
      this.wallet = await this.walletSelector.wallet();
      this.accountId = this.walletSelector.store.getState().accounts[0].accountId;
    }

    return isSignedIn;
  }

  async signIn() {
    const modal = setupModal(this.walletSelector, {
      contractId: this.contractId,
    });
    modal.show();
  }

  signOut() {
    this.wallet.signOut();
    this.wallet = null;
    this.accountId = null;
    window.location.reload();
  }

  async createLottery(ticketPrice) {
    return await this.wallet.signAndSendTransaction({
      signerId: this.accountId,
      receiverId: this.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "create_lottery",
            args: { ticket_price: ticketPrice.toString() },
            gas: THIRTY_TGAS,
            deposit: NO_DEPOSIT,
          },
        },
      ],
    });
  }

  async buyTicket(lotteryId, ticketPrice) {
    return await this.wallet.signAndSendTransaction({
      signerId: this.accountId,
      receiverId: this.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "buy_ticket",
            args: { lottery_id: lotteryId },
            gas: THIRTY_TGAS,
            deposit: ticketPrice,
          },
        },
      ],
    });
  }

  async endLottery(lotteryId) {
    return await this.wallet.signAndSendTransaction({
      signerId: this.accountId,
      receiverId: this.contractId,
      actions: [
        {
          type: "FunctionCall",
          params: {
            methodName: "end_lottery",
            args: { lottery_id: lotteryId },
            gas: THIRTY_TGAS,
            deposit: NO_DEPOSIT,
          },
        },
      ],
    });
  }

  async getLottery(lotteryId) {
    return await this.wallet.viewMethod({
      contractId: this.contractId,
      method: "get_lottery",
      args: { lottery_id: lotteryId },
    });
  }

  async getParticipants(lotteryId) {
    return await this.wallet.viewMethod({
      contractId: this.contractId,
      method: "get_participants",
      args: { lottery_id: lotteryId },
    });
  }
} 