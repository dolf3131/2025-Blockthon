module donation_system::donation {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::event;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use std::string::{String};
    use sui::object::{Self, ID, UID};

    // === Errors ===
    const ENotCampaignOwner: u64 = 0;
    const ECampaignInactive: u64 = 1;
    const EGoalNotMet: u64 = 2;
    const ECampaignFinished: u64 = 3;

    // === Objects ===
    public struct DonationCampaign has key, store {
        id: UID,
        name: String,
        description: String,
        organizer_name: String,
        beneficiary: address,
        goal: u64,
        donated_amount: u64,
        deadline: u64,
        vault: Balance<SUI>,
        active: bool
    }

    public struct DonationNFT has key, store {
        id: UID,
        campaign_id: ID,
        donor_address: address,
        amount_donated: u64,
        timestamp_ms: u64,
        campaign_name: String,
    }

    // === Events ===
    public struct CampaignCreated has copy, drop {
        campaign_id: ID,
        name: String,
        description: String,
        organizer_name: String,
        beneficiary: address,
        goal: u64,
        deadline: u64,
    }

    public struct Donated has copy, drop {
        campaign_id: ID,
        amount: u64,
        message: String,
    }

    public struct Withdrawn has copy, drop {
        campaign_id: ID,
        amount: u64,
    }

    // === Public Functions ===
    public entry fun create_campaign(
        name: String,
        description: String,
        organizer_name: String,
        beneficiary: address,
        goal: u64,
        deadline: u64,
        ctx: &mut TxContext
    ) {
        let campaign = DonationCampaign {
            id: object::new(ctx),
            name,
            description,
            organizer_name,
            beneficiary,
            goal,
            donated_amount: 0,
            deadline,
            vault: balance::zero(),
            active: true,
        };

        event::emit(CampaignCreated {
            campaign_id: object::id(&campaign),
            name: campaign.name,
            description: campaign.description,
            organizer_name: campaign.organizer_name,
            beneficiary,
            goal,
            deadline,
        });

        // Share the campaign object so anyone can donate.
        transfer::share_object(campaign);
    }

    public entry fun donate(
        campaign: &mut DonationCampaign,
        donation: Coin<SUI>,
        message: String,
        clock: &Clock,
        ctx: &mut TxContext // Changed _ctx to ctx
    ) {
        assert!(campaign.active, ECampaignInactive);
        assert!(clock::timestamp_ms(clock) < campaign.deadline, ECampaignFinished);

        let amount = coin::value(&donation);
        campaign.donated_amount = campaign.donated_amount + amount;

        balance::join(&mut campaign.vault, coin::into_balance(donation));

        // Mint and transfer NFT to donor
        let nft = DonationNFT {
            id: object::new(ctx),
            campaign_id: object::id(campaign),
            donor_address: tx_context::sender(ctx),
            amount_donated: amount,
            timestamp_ms: clock::timestamp_ms(clock),
            campaign_name: campaign.name,
        };
        transfer::public_transfer(nft, tx_context::sender(ctx));

        event::emit(Donated {
            campaign_id: object::id(campaign),
            amount,
            message,
        });
    }

    public entry fun withdraw(
        campaign: &mut DonationCampaign,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == campaign.beneficiary, ENotCampaignOwner);
        assert!(campaign.donated_amount >= campaign.goal, EGoalNotMet);

        let total_amount = balance::value(&campaign.vault);
        let new_balance = balance::split(&mut campaign.vault, total_amount);
        let funds = coin::from_balance(new_balance, ctx);
        
        transfer::public_transfer(funds, campaign.beneficiary);

        campaign.active = false;

        event::emit(Withdrawn {
            campaign_id: object::id(campaign),
            amount: total_amount,
        });
    }

    // === Getter Functions ===

    public fun donated_amount(campaign: &DonationCampaign): u64 {
        campaign.donated_amount
    }

    public fun goal(campaign: &DonationCampaign): u64 {
        campaign.goal
    }

    public fun beneficiary(campaign: &DonationCampaign): address {
        campaign.beneficiary
    }

    public fun is_active(campaign: &DonationCampaign): bool {
        campaign.active
    }
}