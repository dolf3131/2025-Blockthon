module donation_system::donation {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    
    use sui::event;
    
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    
    use sui::display;
    use sui::package;
    use sui::table::{Self, Table};
    use donation_system::profile_helpers::{Self, Profiles};

    // === Errors ===
    const ENotCampaignOwner: u64 = 0;
    const ECampaignInactive: u64 = 1;
    const EGoalNotMet: u64 = 2;
    const ECampaignFinished: u64 = 3;

    const PLATFORM_FEE_PERCENTAGE: u64 = 5;
    const PLATFORM_FEE_ADDRESS: address = @0xe2dde3ab1bfacae12b027588e0bd546eb1a295a80e993c9fbaed909318ecfdcd; // Placeholder for platform's address

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

    

    // Define the One-Time Witness struct
    public struct DONATION has drop {}

    // Updated init function for DonationNFT
    #[allow(lint(share_owned))]
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

        let publisher = package::claim(otw, ctx);

        let mut display = display::new_with_fields<DonationNFT>(
            &publisher,
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);
        sui::transfer::public_share_object(display);
        package::burn_publisher(publisher);

        sui::transfer::public_share_object(profile_helpers::init_profiles(ctx));
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

    public struct FundUsageReported has copy, drop {
        campaign_id: ID,
        reporter: address,
        report_title: String,
        report_description: String,
        spent_amount: u64,
        remaining_amount: u64,
        proof_url: String,
        timestamp_ms: u64,
    }

    // === Public Functions ===
    public entry fun create_campaign(
        profiles: &mut Profiles,
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

        profile_helpers::increment_total_campaigns_created(profiles, beneficiary, ctx);

        sui::transfer::share_object(campaign);
    }

    public entry fun donate(
        profiles: &mut Profiles,
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

        let sender = tx_context::sender(ctx);

        let nft = DonationNFT {
            id: object::new(ctx),
            campaign_id: object::id(campaign),
            donor_address: sender,
            amount_donated: amount,
            timestamp_ms: clock::timestamp_ms(clock),
            campaign_name: campaign.name,
        };

        let nft_id = profile_helpers::new_nft_id(object::id(&nft));
        profile_helpers::add_nft_to_profile(profiles, sender, nft_id, ctx);

        sui::transfer::public_transfer(nft, sender);

        event::emit(Donated {
            campaign_id: object::id(campaign),
            amount,
            message,
        });
    }

    public entry fun withdraw(
        profiles: &mut Profiles,
        campaign: &mut DonationCampaign,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == campaign.beneficiary, ENotCampaignOwner);
        assert!(campaign.donated_amount >= campaign.goal, EGoalNotMet);

        let total_amount = balance::value(&campaign.vault);
        let platform_fee_amount = total_amount * PLATFORM_FEE_PERCENTAGE / 100;
        let beneficiary_amount = total_amount - platform_fee_amount;

        let platform_funds = balance::split(&mut campaign.vault, platform_fee_amount);
        let beneficiary_funds = balance::split(&mut campaign.vault, beneficiary_amount);

        sui::transfer::public_transfer(coin::from_balance(platform_funds, ctx), PLATFORM_FEE_ADDRESS);
        sui::transfer::public_transfer(coin::from_balance(beneficiary_funds, ctx), campaign.beneficiary);

        campaign.active = false;

        profile_helpers::increment_successful_campaigns(profiles, campaign.beneficiary, ctx);

        event::emit(Withdrawn {
            campaign_id: object::id(campaign),
            amount: total_amount,
        });
    }

    public entry fun submit_fund_usage_report(
        campaign: &mut DonationCampaign,
        report_title: String,
        report_description: String,
        spent_amount: u64,
        remaining_amount: u64,
        proof_url: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == campaign.beneficiary, ENotCampaignOwner);

        event::emit(FundUsageReported {
            campaign_id: object::id(campaign),
            reporter: tx_context::sender(ctx),
            report_title,
            report_description,
            spent_amount,
            remaining_amount,
            proof_url,
            timestamp_ms: clock::timestamp_ms(clock),
        });
    }

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