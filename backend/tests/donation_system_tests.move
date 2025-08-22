#[test_only]
module donation_system::donation_system_tests {
    use sui::test_scenario::{Self, Scenario, next_tx, take_shared, return_shared, ctx, take_from_sender};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::object::{ID};
    use std::string;
    use sui::balance;

    // Import the module to test
    use donation_system::donation_system::{Self, CampaignStore, DonationStore, CampaignAdminCap, CampaignCreated};

    const ADMIN: address = @0x1;
    const DONOR_1: address = @0x2;
    const CAMPAIGN_GOAL: u64 = 10_000;
    const DONATION_AMOUNT: u64 = 5_000;
    const WITHDRAW_AMOUNT: u64 = 4_000;

    // Helper to initialize the scenario and the contract
    fun setup_scenario(): (Scenario, Clock) {
        let mut scenario = test_scenario::begin(ADMIN);
        let clock = clock::create_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        // donation_system::init(ctx(&mut scenario)); // Removed explicit init call
        
        (scenario, clock)
    }

    #[test]
    fun test_create_donate_withdraw() {
        let (mut scenario, mut clock) = setup_scenario();

        // 1. Create a campaign
        next_tx(&mut scenario, ADMIN);
        let mut store = take_shared<CampaignStore>(&scenario);
        
        donation_system::create_campaign(
            &mut store,
            string::utf8(b"Test Campaign"),
            string::utf8(b"For testing"),
            CAMPAIGN_GOAL, // Fixed typo here
            &clock,
            ctx(&mut scenario)
        );
        
        // Removed event-based assertion due to take_last_event unavailability
        // let event = take_last_event<CampaignCreated>(&mut scenario);
        // let campaign_id = event.campaign_id;
        // let admin_cap_id = event.admin_cap_id;
        
        // Assuming only one CampaignAdminCap is sent to ADMIN
        let admin_cap_obj = take_from_sender<CampaignAdminCap>(&scenario); // Changed to take_from_sender
        let campaign_id = donation_system::campaign_admin_cap_id(&admin_cap_obj); // Get campaign_id from the cap using getter
        
        return_shared(store);

        // 2. Donate to the campaign
        next_tx(&mut scenario, DONOR_1);
        let mut store = take_shared<CampaignStore>(&scenario);
        let mut donation_store = take_shared<DonationStore>(&scenario);
        let payment = coin::mint_for_testing<SUI>(DONATION_AMOUNT, ctx(&mut scenario));

        clock::set_for_testing(&mut clock, 50);

        donation_system::donate(
            &mut store,
            &mut donation_store,
            campaign_id,
            payment,
            &clock,
            ctx(&mut scenario)
        );

        let campaign = donation_system::get_campaign_details(&store, campaign_id);
        assert!(donation_system::campaign_raised(campaign) == DONATION_AMOUNT, 0);

        return_shared(store);
        return_shared(donation_store);

        // 3. End the campaign and withdraw funds
        next_tx(&mut scenario, ADMIN);
        let mut store = take_shared<CampaignStore>(&scenario);
        // let admin_cap_obj = take_object_from_sender_by_id<CampaignAdminCap>(&scenario, admin_cap_id); // Removed
        
        donation_system::end_campaign(&mut store, &admin_cap_obj);
        
        donation_system::withdraw_funds(
            &mut store,
            &admin_cap_obj,
            WITHDRAW_AMOUNT,
            ctx(&mut scenario)
        );

        let campaign = donation_system::get_campaign_details(&store, campaign_id);
        assert!(balance::value(donation_system::campaign_funds(campaign)) == DONATION_AMOUNT - WITHDRAW_AMOUNT, 1);

        test_scenario::return_to_sender(&scenario, admin_cap_obj);
        return_shared(store);

        // Cleanup
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}