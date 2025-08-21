module donation_system::donation {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::event;
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::display;
    use sui::package::{Self, claim};

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

    public struct NftId has store, copy, drop {
        nft_id: ID,
    }

    public struct UserProfile has key, store {
        id: UID,
        owner: address,
        nfts: vector<NftId>,
    }

    // Define the One-Time Witness struct
    public struct DONATION has drop {}

    // Updated init function for DonationNFT
    fun init(otw: DONATION, ctx: &mut TxContext) {
        let keys = vector<String>[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"project_url"),
        ];

        let values = vector<String>[
            string::utf8(b"Donation NFT for "),
            string::utf8(b"A commemorative NFT for your generous donation to "),
            string::utf8(b"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlncmh0PSIyMDAiIGZpbGw9InJlZCIvPjwvc3ZnPg=="), // Placeholder image URL
            string::utf8(b"https://example.com/"), // Placeholder project URL
        ];

        let publisher = package::claim(otw, ctx); // Get publisher using claim

        let mut display = display::new_with_fields<DonationNFT>( // Made display mutable
            &publisher,
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);
        transfer::public_share_object(display);
        package::burn_publisher(publisher); // Burn the publisher object
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

    public entry fun create_user_profile(ctx: &mut TxContext) {
        let profile = UserProfile {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            nfts: vector[],
        };
        transfer::transfer(profile, tx_context::sender(ctx));
    }

    public fun get_user_nfts(profile: &UserProfile): vector<NftId> {
        profile.nfts
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
        user_profile: &mut UserProfile,
        campaign: &mut DonationCampaign,
        donation: Coin<SUI>,
        message: String,
        clock: &Clock,
        ctx: &mut TxContext
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

        let nft_id = NftId {
            nft_id: object::id(&nft)
        };

        vector::push_back(&mut user_profile.nfts, nft_id);

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