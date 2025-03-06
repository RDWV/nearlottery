use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{UnorderedMap, Vector};
use near_sdk::json_types::U128;
use near_sdk::{env, near_bindgen, AccountId, Balance, Promise};

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Lottery {
    owner: AccountId,
    ticket_price: Balance,
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
            lotteries: UnorderedMap::new(b"l"),
            lottery_count: 0,
        }
    }
}

#[near_bindgen]
impl Contract {
    #[payable]
    pub fn create_lottery(&mut self, ticket_price: U128) -> u64 {
        let lottery = Lottery {
            owner: env::predecessor_account_id(),
            ticket_price: ticket_price.0,
            participants: Vector::new(format!("p{}", self.lottery_count).as_bytes()),
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
        assert_eq!(
            env::attached_deposit(),
            lottery.ticket_price,
            "Attached deposit must equal ticket price"
        );

        lottery.participants.push(&env::predecessor_account_id());
        self.lotteries.insert(&lottery_id, &lottery);
    }

    pub fn end_lottery(&mut self, lottery_id: u64) -> AccountId {
        let mut lottery = self.lotteries.get(&lottery_id).expect("Lottery not found");
        assert!(lottery.is_active, "Lottery is already ended");
        assert!(lottery.participants.len() > 0, "No participants in the lottery");

        let random_index = self.get_random_number(lottery.participants.len());
        let winner = lottery.participants.get(random_index).unwrap();
        
        let total_amount = lottery.ticket_price * lottery.participants.len() as u128;
        Promise::new(winner.clone()).transfer(total_amount);

        lottery.is_active = false;
        lottery.winner = Some(winner.clone());
        self.lotteries.insert(&lottery_id, &lottery);

        winner
    }

    // View methods
    pub fn get_lottery(&self, lottery_id: u64) -> Option<(AccountId, U128, bool, Option<AccountId>, u64)> {
        if let Some(lottery) = self.lotteries.get(&lottery_id) {
            Some((
                lottery.owner,
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
} 