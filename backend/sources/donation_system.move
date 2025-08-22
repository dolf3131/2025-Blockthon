module donation_system::donation_system {
    use sui::object::{ID, UID};
    use sui::tx_context::TxContext;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::Clock;
    use sui::transfer;
    use std::string::String;

    const ECampaignNotActive: u64 = 0;
    const EInvalidDonationAmount: u64 = 1;
    const ECampaignEnded: u64 = 2;
    const ENotOrganizer: u64 = 3;
    const EWithdrawalNotAllowed: u64 = 4;

    // Moved CampaignCreated to the top
    public struct CampaignCreated has copy, drop {
        campaign_id: ID,
        admin_cap_id: ID,
        organizer: address,
    }

    public struct CampaignAdminCap has key, store {
        id: UID,
        campaign_id: ID
    }

    public struct Campaign has key, store {
        id: UID,
        organizer: address,
        name: String,
        description: String,
        goal: u64,
        raised: u64, // Removed public(package)
        funds: Balance<SUI>, // Removed public(package)
        start_time: u64,
        end_time: u64,
        is_active: bool,
        reports: vector<FundUsageReport>,
    }

    public struct FundUsageReport has store {
        report_time: u64,
        description: String,
        amount: u64,
    }

    public struct DonationInfo has copy, drop {
        campaign_id: ID,
        donor: address,
        amount: u64,
    }

    public struct CampaignStore has key {
        id: UID,
        campaigns: Table<ID, Campaign>,
    }

    public struct Donation has key, store {
        id: UID,
        campaign_id: ID,
        donor: address,
        amount: u64,
        donation_time: u64,
    }

    public struct DonationStore has key {
        id: UID,
        donations: Table<ID, Donation>,
    }

    public struct OrganizerProfile has key, store {
        id: UID,
        organizer: address,
        name: String,
        bio: String,
    }

    public struct DonorProfile has key, store {
        id: UID,
        donor: address,
        name: String,
        donation_history: vector<ID>,
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(CampaignStore {
            id: sui::object::new(ctx),
            campaigns: table::new(ctx),
        });
        transfer::share_object(DonationStore {
            id: sui::object::new(ctx),
            donations: table::new(ctx),
        });
    }

    public entry fun create_campaign(
        store: &mut CampaignStore,
        name: String,
        description: String,
        goal: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = sui::tx_context::sender(ctx);
        let campaign = Campaign {
            id: sui::object::new(ctx),
            organizer: sender,
            name,
            description,
            goal,
            raised: 0,
            funds: balance::zero(),
            start_time: sui::clock::timestamp_ms(clock),
            end_time: sui::clock::timestamp_ms(clock) + 1000 * 60 * 60 * 24 * 30, // 30 days
            is_active: true,
            reports: vector[],
        };
        let campaign_id = sui::object::id(&campaign);
        let admin_cap = CampaignAdminCap {
            id: sui::object::new(ctx),
            campaign_id: campaign_id,
        };
        let admin_cap_id = sui::object::id(&admin_cap);
        table::add(&mut store.campaigns, campaign_id, campaign);
        transfer::transfer(admin_cap, sender);

        event::emit(CampaignCreated {
            campaign_id,
            admin_cap_id,
            organizer: sender,
        });
    }

    public entry fun update_campaign_goal(
        store: &mut CampaignStore,
        cap: &CampaignAdminCap,
        new_goal: u64
    ) {
        let campaign = table::borrow_mut(&mut store.campaigns, cap.campaign_id);
        campaign.goal = new_goal;
    }

    public entry fun add_fund_usage_report(
        store: &mut CampaignStore,
        cap: &CampaignAdminCap,
        description: String,
        amount: u64,
        clock: &Clock
    ) {
        let campaign = table::borrow_mut(&mut store.campaigns, cap.campaign_id);
        assert!(campaign.is_active, ECampaignNotActive);

        let report = FundUsageReport {
            report_time: sui::clock::timestamp_ms(clock),
            description,
            amount
        };
        campaign.reports.push_back(report);
    }

    public entry fun end_campaign(store: &mut CampaignStore, cap: &CampaignAdminCap) {
        let campaign = table::borrow_mut(&mut store.campaigns, cap.campaign_id);
        campaign.is_active = false;
    }

    public entry fun donate(
        store: &mut CampaignStore,
        donations: &mut DonationStore,
        campaign_id: ID,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount > 0, EInvalidDonationAmount);
        let campaign = table::borrow_mut(&mut store.campaigns, campaign_id);
        assert!(campaign.is_active, ECampaignNotActive);
        let current_time = sui::clock::timestamp_ms(clock);
        assert!(current_time < campaign.end_time, ECampaignEnded);

        let donation_balance = coin::into_balance(payment);
        balance::join(&mut campaign.funds, donation_balance);
        campaign.raised = campaign.raised + amount;
        let sender = sui::tx_context::sender(ctx);

        let donation = Donation {
            id: sui::object::new(ctx),
            campaign_id,
            donor: sender,
            amount,
            donation_time: current_time,
        };
        table::add(&mut donations.donations, sui::object::id(&donation), donation);

        event::emit(DonationInfo {
            campaign_id,
            donor: sender,
            amount,
        });
    }

    public entry fun withdraw_funds(
        store: &mut CampaignStore,
        cap: &CampaignAdminCap,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let campaign = table::borrow_mut(&mut store.campaigns, cap.campaign_id);
        let sender = sui::tx_context::sender(ctx);
        assert!(sender == campaign.organizer, ENotOrganizer);
        assert!(!campaign.is_active, EWithdrawalNotAllowed);

        let funds = balance::split(&mut campaign.funds, amount);
        transfer::public_transfer(coin::from_balance(funds, ctx), sender);
    }

    public entry fun create_organizer_profile(name: String, bio: String, ctx: &mut TxContext) {
        let sender = sui::tx_context::sender(ctx);
        let profile = OrganizerProfile {
            id: sui::object::new(ctx),
            organizer: sender,
            name,
            bio,
        };
        transfer::transfer(profile, sender);
    }

    public entry fun update_organizer_profile(profile: &mut OrganizerProfile, name: String, bio: String) {
        profile.name = name;
        profile.bio = bio;
    }

    public entry fun create_donor_profile(name: String, ctx: &mut TxContext) {
        let sender = sui::tx_context::sender(ctx);
        let profile = DonorProfile {
            id: sui::object::new(ctx),
            donor: sender,
            name,
            donation_history: vector[], 
        };
        transfer::transfer(profile, sender);
    }

    public entry fun update_donor_profile(profile: &mut DonorProfile, name: String) {
        profile.name = name;
    }

    public fun get_campaign_details(store: &CampaignStore, id: ID): &Campaign {
        table::borrow(&store.campaigns, id)
    }

    public fun get_donation_details(store: &DonationStore, id: ID): &Donation {
        table::borrow(&store.donations, id)
    }

    public fun get_organizer_profile(profile: &OrganizerProfile): (address, String, String) {
        (profile.organizer, profile.name, profile.bio)
    }

    public fun get_donor_profile(profile: &DonorProfile): (address, String, vector<ID>) {
        (profile.donor, profile.name, profile.donation_history)
    }

    // Public getters for Campaign fields accessed by tests
    public(package) fun campaign_raised(c: &Campaign): u64 { c.raised }
    public(package) fun campaign_funds(c: &Campaign): &Balance<SUI> { &c.funds }
    public(package) fun campaign_admin_cap_id(cap: &CampaignAdminCap): ID { cap.campaign_id } // New getter
}
