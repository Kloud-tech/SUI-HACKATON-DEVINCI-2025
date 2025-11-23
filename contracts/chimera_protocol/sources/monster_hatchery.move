module game::monster_hatchery {
    use game::cim_currency::CIM_CURRENCY;
    use std::string::{Self as string, String};
    use std::vector;
    use sui::balance::{Self as balance, Balance};
    use sui::clock::{Self as clock, Clock};
    use sui::coin::{Self as coin, Coin};
    use sui::display;
    use sui::object::{Self as object, UID};
    use sui::transfer;
    use sui::tx_context::{Self as tx_context, TxContext};

    const PRICE_COMMON: u64 = 100;
    const PRICE_RARE: u64 = 500;
    const PRICE_EPIC: u64 = 1_000;
    const PRICE_LEGENDARY: u64 = 5_000;

    const RARITY_COMMON: u8 = 1;
    const RARITY_RARE: u8 = 2;
    const RARITY_EPIC: u8 = 3;
    const RARITY_LEGENDARY: u8 = 4;

    const ENotEnoughMoney: u64 = 0;
    const EUnknownRarity: u64 = 1;

    // --- NFT STRUCTS ---

    // Pas d'image pour l'œuf, mais on garde un label lisible
    public struct Egg has key, store {
        id: UID,
        rarity: u8,
        rarity_label: String,
    }

    // Monstre avec image URL (générée par ton backend IA)
    public struct Monster has key, store {
        id: UID,
        name: String,
        rarity: u8,
        rarity_label: String,
        strength: u64,
        agility: u64,
        intelligence: u64,
        level: u8,
        experience: u64,
        image_url: String,
    }

    public struct Shop has key {
        id: UID,
        profits: Balance<CIM_CURRENCY>,
    }

    // --- INIT SHOP ---

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Shop {
            id: object::new(ctx),
            profits: balance::zero<CIM_CURRENCY>(),
        });
    }

    // --- BUY EGG ---

    #[allow(lint(self_transfer))]
    public fun buy_egg(
        shop: &mut Shop,
        payment: &mut Coin<CIM_CURRENCY>,
        rarity_choice: u8,
        ctx: &mut TxContext,
    ) {
        let price = price_for_rarity(rarity_choice);
        assert!(coin::value(payment) >= price, ENotEnoughMoney);

        let paid = coin::split(payment, price, ctx);
        balance::join(&mut shop.profits, coin::into_balance(paid));

        transfer::public_transfer(
            Egg {
                id: object::new(ctx),
                rarity: rarity_choice,
                rarity_label: rarity_label(rarity_choice),
            },
            tx_context::sender(ctx),
        );
    }

    // --- HATCH EGG -> MONSTER AVEC URL IA ---

    #[allow(lint(self_transfer))]
    public fun hatch_egg(
        egg: Egg,
        clk: &Clock,
        monster_name: vector<u8>,
        monster_image_url: vector<u8>, // URL générée par ton backend IA
        ctx: &mut TxContext,
    ) {
        let Egg { id, rarity, rarity_label } = egg;
        object::delete(id);

        let timestamp = clock::timestamp_ms(clk);
        let random_bonus = (timestamp % 10) as u64;
        let (base_str, base_agi, base_int) = base_stats(rarity);

        transfer::public_transfer(
            Monster {
                id: object::new(ctx),
                name: string::utf8(monster_name),
                rarity,
                rarity_label,
                strength: base_str + random_bonus,
                agility: base_agi + random_bonus,
                intelligence: base_int + random_bonus,
                level: 1,
                experience: 0,
                image_url: string::utf8(monster_image_url),
            },
            tx_context::sender(ctx),
        );
    }

    // --- GETTERS / BATTLE INTEGRATION ---

    public fun get_name(monster: &Monster): String {
        monster.name
    }

    // Utilisé par monster_battle.move
    public(package) fun update_stats_after_battle(
        monster: &mut Monster,
        xp_gain: u64,
    ) {
        monster.experience = monster.experience + xp_gain;
        while (monster.experience >= 100) {
            monster.level = monster.level + 1;
            monster.experience = monster.experience - 100;
            specialize(monster);
        }
    }


    // --- HELPERS ---

    fun price_for_rarity(rarity: u8): u64 {
        if (rarity == RARITY_COMMON) {
            PRICE_COMMON
        } else if (rarity == RARITY_RARE) {
            PRICE_RARE
        } else if (rarity == RARITY_EPIC) {
            PRICE_EPIC
        } else if (rarity == RARITY_LEGENDARY) {
            PRICE_LEGENDARY
        } else {
            abort EUnknownRarity
        }
    }

    fun base_stats(rarity: u8): (u64, u64, u64) {
        if (rarity == RARITY_COMMON) {
            (5, 5, 5)
        } else if (rarity == RARITY_RARE) {
            (15, 15, 15)
        } else if (rarity == RARITY_EPIC) {
            (30, 30, 30)
        } else {
            (60, 60, 60)
        }
    }

    fun specialize(monster: &mut Monster) {
        if (monster.strength >= monster.agility
            && monster.strength >= monster.intelligence
        ) {
            monster.strength = monster.strength + 3;
            monster.agility = monster.agility + 1;
        } else if (monster.agility > monster.strength
            && monster.agility >= monster.intelligence
        ) {
            monster.strength = monster.strength + 1;
            monster.agility = monster.agility + 3;
        } else {
            monster.agility = monster.agility + 1;
            monster.intelligence = monster.intelligence + 3;
        }
    }

    fun rarity_label(rarity: u8): String {
        if (rarity == RARITY_COMMON) {
            string::utf8(b"Common Tier")
        } else if (rarity == RARITY_RARE) {
            string::utf8(b"Rare Tier")
        } else if (rarity == RARITY_EPIC) {
            string::utf8(b"Epic Tier")
        } else {
            string::utf8(b"Legendary Tier")
        }
    }
}
