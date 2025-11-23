module game::monster_battle {
    use sui::event;
    use sui::object::{Self, ID};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use game::monster_hatchery::{Self, Monster};

    const ENotAuthorized: u64 = 999;
    const ESameMonster: u64 = 1000;

    // L'objet qui sait qui est l'arbitre officiel (TEE)
    public struct BattleConfig has key {
        id: UID,
        tee_address: address,
        next_request_id: u64
    }

    // Événement émis quand quelqu'un demande un combat
    public struct BattleRequest has copy, drop {
        request_id: u64,
        monster1_id: ID,
        monster2_id: ID,
        requester: address
    }

    // Un événement pour prévenir le site web
    public struct BattleEvent has copy, drop {
        request_id: u64,
        winner_id: ID,
        loser_id: ID,
        xp_gained: u64
    }

    fun init(ctx: &mut TxContext) {
        // Au déploiement, TON adresse devient l'adresse du TEE
        transfer::share_object(BattleConfig {
            id: object::new(ctx),
            tee_address: ctx.sender(),
            next_request_id: 0
        });
    }

    // Fonction appelée par les joueurs pour publier une demande de combat
    public entry fun request_battle(
        config: &mut BattleConfig,
        monster1: &Monster,
        monster2: &Monster,
        ctx: &mut TxContext
    ) {
        assert!(object::id(monster1) != object::id(monster2), ESameMonster);

        let request_id = config.next_request_id;
        config.next_request_id = request_id + 1;

        event::emit(BattleRequest {
            request_id,
            monster1_id: object::id(monster1),
            monster2_id: object::id(monster2),
            requester: ctx.sender()
        });
    }

    // La fonction que seul le script Python peut appeler
    public fun settle_battle(
        config: &BattleConfig, 
        winner: &mut Monster, 
        loser: &Monster, 
        xp_gain: u64,
        request_id: u64,
        ctx: &mut TxContext
    ) {
        // Sécurité : On vérifie la signature
        assert!(ctx.sender() == config.tee_address, ENotAuthorized);

        // On donne l'XP
        monster_hatchery::update_stats_after_battle(winner, xp_gain);

        // On prévient le monde
        event::emit(BattleEvent {
            request_id,
            winner_id: object::id(winner),
            loser_id: object::id(loser),
            xp_gained: xp_gain
        });
    }
}