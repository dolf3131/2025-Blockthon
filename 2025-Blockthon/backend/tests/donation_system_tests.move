#[test_only]
module donation_system::donation_tests {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::test_scenario::{Self, next_tx, ctx};

    use donation_system::donation::{Self, DonationCampaign};

    const BENEFICIARY: address = @0xBEEF;
    const DONOR: address = @0xFACE;
    const RANDOM_PERSON: address = @0xDEAD;
    const CAMPAIGN_GOAL: u64 = 10000;
    const DONATION_AMOUNT: u64 = 10000;

    #[test]
    fun test_donation_and_withdrawal() {
        let mut scenario = test_scenario::begin(BENEFICIARY);

        // Create Campaign
        next_tx(&mut scenario, BENEFICIARY);
        donation::create_campaign(BENEFICIARY, CAMPAIGN_GOAL, ctx(&mut scenario));

        // Donate
        next_tx(&mut scenario, DONOR);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        let coin = coin::mint_for_testing<SUI>(DONATION_AMOUNT, ctx(&mut scenario));
        donation::donate(&mut campaign, coin, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        // Withdraw
        next_tx(&mut scenario, BENEFICIARY);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        donation::withdraw(&mut campaign, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = donation::ENotCampaignOwner)]
    fun test_withdraw_by_random_fails() {
        let mut scenario = test_scenario::begin(BENEFICIARY);

        next_tx(&mut scenario, BENEFICIARY);
        donation::create_campaign(BENEFICIARY, CAMPAIGN_GOAL, ctx(&mut scenario));

        next_tx(&mut scenario, DONOR);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        let coin = coin::mint_for_testing<SUI>(CAMPAIGN_GOAL, ctx(&mut scenario));
        donation::donate(&mut campaign, coin, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        next_tx(&mut scenario, RANDOM_PERSON);
        let mut campaign = test_scenario::take_shared<DonationCampaign>(&scenario);
        donation::withdraw(&mut campaign, ctx(&mut scenario));
        test_scenario::return_shared(campaign);

        test_scenario::end(scenario);
    }
}
