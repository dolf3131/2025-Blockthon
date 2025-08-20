#[test_only]
module donation_system::donation_tests {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::test_scenario::{Self, next_tx, ctx};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};

    use donation_system::donation::{Self, DonationCampaign};

    const BENEFICIARY: address = @0xBEEF;
    const DONOR: address = @0xFACE;
    const RANDOM_PERSON: address = @0xDEAD;
    
    const CAMPAIGN_NAME: vector<u8> = b"Test Campaign";
    const CAMPAIGN_DESC: vector<u8> = b"A campaign for testing purposes.";
    const ORGANIZER_NAME: vector<u8> = b"Test Org";
    const CAMPAIGN_GOAL: u64 = 10000;
    const DONATION_AMOUNT: u64 = 10000;
    const DEADLINE: u64 = 100; // Example deadline
    const DONATION_MESSAGE: vector<u8> = b"Happy to donate!";

    fun create_test_campaign(scenario: &mut test_scenario::Scenario) {
        next_tx(scenario, BENEFICIARY);
        donation::create_campaign(
            string::utf8(CAMPAIGN_NAME),
            string::utf8(CAMPAIGN_DESC),
            string::utf8(ORGANIZER_NAME),
            BENEFICIARY,
            CAMPAIGN_GOAL,
            DEADLINE,
            ctx(scenario)
        );
    }

    #[test]
    fun test_donation_and_withdrawal() {
        let mut scenario = test_scenario::begin(BENEFICIARY);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));

        // Create Campaign
        create_test_campaign(&mut scenario);

        // Donate
        next_tx(&mut scenario, DONOR);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        let coin = coin::mint_for_testing<SUI>(DONATION_AMOUNT, ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 50); // Advance time, but before deadline
        donation::donate(&mut campaign, coin, string::utf8(DONATION_MESSAGE), &clock, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        // Withdraw
        next_tx(&mut scenario, BENEFICIARY);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        donation::withdraw(&mut campaign, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = donation::ENotCampaignOwner)]
    fun test_withdraw_by_random_fails() {
        let mut scenario = test_scenario::begin(BENEFICIARY);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));

        // Create Campaign
        create_test_campaign(&mut scenario);

        // Donate to meet the goal
        next_tx(&mut scenario, DONOR);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        let coin = coin::mint_for_testing<SUI>(CAMPAIGN_GOAL, ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 50);
        donation::donate(&mut campaign, coin, string::utf8(DONATION_MESSAGE), &clock, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        // Attempt to withdraw by a random person
        next_tx(&mut scenario, RANDOM_PERSON);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        donation::withdraw(&mut campaign, ctx(&mut scenario));
        test_scenario::return_shared(campaign);
        
        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }
}