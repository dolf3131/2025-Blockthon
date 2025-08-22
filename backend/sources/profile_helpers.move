// backend/sources/profile_helpers.move
module donation_system::profile_helpers {
    use sui::object::{ID, UID};
    use sui::table::{Self, Table};
    use std::string::String;
    use sui::tx_context::TxContext; // Needed for object::new and sender
    use sui::object;

    public struct UserProfile has store {
        nfts: vector<NftId>,
        total_campaigns_created: u64,
        successful_campaigns: u64,
    }

    public struct Profiles has key, store {
        id: UID,
        profiles: Table<address, UserProfile>,
    }

    public struct NftId has store, copy, drop {
        nft_id: ID,
    }

    public fun init_profiles(ctx: &mut TxContext): Profiles {
        Profiles {
            id: object::new(ctx),
            profiles: table::new(ctx),
        }
    }

    public fun new_nft_id(id: ID): NftId {
        NftId { nft_id: id }
    }

    // Helper function to get or create a user profile
    fun get_or_create_user_profile(profiles: &mut Profiles, user_address: address, ctx: &mut TxContext): &mut UserProfile {
        if (!table::contains(&profiles.profiles, user_address)) {
            let user_profile = UserProfile {
                nfts: vector[],
                total_campaigns_created: 0,
                successful_campaigns: 0
            };
            table::add(&mut profiles.profiles, user_address, user_profile);
        };
        table::borrow_mut(&mut profiles.profiles, user_address)
    }

    public fun increment_total_campaigns_created(profiles: &mut Profiles, user_address: address, ctx: &mut TxContext) {
        let user_profile = get_or_create_user_profile(profiles, user_address, ctx);
        user_profile.total_campaigns_created = user_profile.total_campaigns_created + 1;
    }

    public fun add_nft_to_profile(profiles: &mut Profiles, user_address: address, nft_id: NftId, ctx: &mut TxContext) {
        let user_profile = get_or_create_user_profile(profiles, user_address, ctx);
        vector::push_back(&mut user_profile.nfts, nft_id);
    }

    public fun increment_successful_campaigns(profiles: &mut Profiles, user_address: address, ctx: &mut TxContext) {
        let user_profile = get_or_create_user_profile(profiles, user_address, ctx);
        user_profile.successful_campaigns = user_profile.successful_campaigns + 1;
    }

    public fun get_user_nfts(profiles_obj: &Profiles, user_address: address): vector<address> {
        let mut user_profile_nfts = vector::empty<address>();

        if (table::contains(&profiles_obj.profiles, user_address)) {
            let user_profile = table::borrow(&profiles_obj.profiles, user_address);
            let nfts_vec = &user_profile.nfts;

            let mut i = 0;
            let len = vector::length(nfts_vec);
            while (i < len) {
                let nft_id_struct = vector::borrow(nfts_vec, i);
                vector::push_back(&mut user_profile_nfts, object::id_to_address(&nft_id_struct.nft_id));
                i = i + 1;
            };
        };

        user_profile_nfts
    }

    public fun get_organizer_trust_score(profiles_obj: &Profiles, organizer_address: address): (u64, u64) {
        if (table::contains(&profiles_obj.profiles, organizer_address)) {
            let user_profile = table::borrow(&profiles_obj.profiles, organizer_address);
            return (user_profile.successful_campaigns, user_profile.total_campaigns_created)
        } else {
            return (0, 0) // No campaigns created yet
        }
    }
}
