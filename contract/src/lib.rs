use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap, Vector};
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, Promise, BorshStorageKey, NearToken, Gas};
use near_sdk::serde_json;

#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKey {
    Lotteries,
    Participants { lottery_id: u64 },
}

#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub enum TokenType {
    NEAR,
    FT(AccountId),  // Account ID of the FT contract
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Lottery {
    owner: AccountId,
    token_type: TokenType,
    ticket_price: u128,
    participants: Vector<AccountId>,
    is_active: bool,
    winner: Option<AccountId>,
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract {
    lotteries: UnorderedMap<u64, Lottery>,
    lottery_count: u64,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            lotteries: UnorderedMap::new(StorageKey::Lotteries),
            lottery_count: 0,
        }
    }
}

#[near_bindgen]
impl Contract {
    #[payable]
    pub fn create_lottery(&mut self, ticket_price: U128, token_account_id: Option<AccountId>) -> u64 {
        let token_type = match token_account_id {
            Some(account_id) => TokenType::FT(account_id),
            None => TokenType::NEAR,
        };

        let lottery = Lottery {
            owner: env::predecessor_account_id(),
            token_type,
            ticket_price: ticket_price.0,
            participants: Vector::new(StorageKey::Participants {
                lottery_id: self.lottery_count,
            }),
            is_active: true,
            winner: None,
        };
        
        self.lotteries.insert(&self.lottery_count, &lottery);
        let lottery_id = self.lottery_count;
        self.lottery_count += 1;
        lottery_id
    }

    #[payable]
    pub fn buy_ticket(&mut self, lottery_id: u64) {
        let mut lottery = self.lotteries.get(&lottery_id).expect("Lottery not found");
        assert!(lottery.is_active, "Lottery is not active");

        match &lottery.token_type {
            TokenType::NEAR => {
                assert_eq!(
                    env::attached_deposit(),
                    NearToken::from_yoctonear(lottery.ticket_price),
                    "Attached deposit must equal ticket price"
                );
            },
            TokenType::FT(_) => {
                // For FT, we'll verify the transfer through a callback
                assert_eq!(
                    env::attached_deposit(),
                    NearToken::from_yoctonear(0),
                    "No deposit needed for FT tickets"
                );
            }
        }

        lottery.participants.push(&env::predecessor_account_id());
        self.lotteries.insert(&lottery_id, &lottery);
    }

    pub fn end_lottery(&mut self, lottery_id: u64) -> AccountId {
        let mut lottery = self.lotteries.get(&lottery_id).expect("Lottery not found");
        assert!(lottery.is_active, "Lottery is already ended");
        assert!(lottery.participants.len() > 0, "No participants in the lottery");

        let random_index = self.get_random_number(lottery.participants.len());
        let winner = lottery.participants.get(random_index).unwrap();
        
        match &lottery.token_type {
            TokenType::NEAR => {
                let total_amount = lottery.ticket_price * u128::try_from(lottery.participants.len()).unwrap();
                Promise::new(winner.clone()).transfer(NearToken::from_yoctonear(total_amount));
            },
            TokenType::FT(token_account) => {
                // For FT, we need to call the FT contract to transfer tokens
                let total_amount = lottery.ticket_price * u128::try_from(lottery.participants.len()).unwrap();
                self.ft_transfer(token_account.clone(), winner.clone(), total_amount.into());
            }
        }

        lottery.is_active = false;
        lottery.winner = Some(winner.clone());
        self.lotteries.insert(&lottery_id, &lottery);

        winner
    }

    // View methods
    pub fn get_lottery(&self, lottery_id: u64) -> Option<(AccountId, String, U128, bool, Option<AccountId>, u64)> {
        if let Some(lottery) = self.lotteries.get(&lottery_id) {
            let token_type_str = match lottery.token_type {
                TokenType::NEAR => "NEAR".to_string(),
                TokenType::FT(account_id) => account_id.to_string(),
            };
            Some((
                lottery.owner,
                token_type_str,
                U128(lottery.ticket_price),
                lottery.is_active,
                lottery.winner,
                lottery.participants.len(),
            ))
        } else {
            None
        }
    }

    pub fn get_participants(&self, lottery_id: u64) -> Vec<AccountId> {
        let lottery = self.lotteries.get(&lottery_id).expect("Lottery not found");
        let mut participants = Vec::new();
        for i in 0..lottery.participants.len() {
            participants.push(lottery.participants.get(i).unwrap());
        }
        participants
    }

    // Helper methods
    fn get_random_number(&self, max: u64) -> u64 {
        let random_seed = env::random_seed();
        let mut random_number: u64 = 0;
        for i in 0..8 {
            random_number = (random_number << 8) | (random_seed[i] as u64);
        }
        random_number % max
    }

    fn ft_transfer(&self, token_contract: AccountId, recipient: AccountId, amount: U128) {
        Promise::new(token_contract)
            .function_call(
                "ft_transfer".to_string(),
                serde_json::json!({
                    "receiver_id": recipient,
                    "amount": amount.0.to_string()
                })
                .to_string()
                .into_bytes(),
                NearToken::from_yoctonear(1), // attached deposit for storage
                Gas::from_tgas(30)
            );
    }
} 