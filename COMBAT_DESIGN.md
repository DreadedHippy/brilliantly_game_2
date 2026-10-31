# Starting combat balance

Arojinle's seven-screen tutorial includes a spell-affinity lesson and ends with **Practice with Arojinle**. The practice uses his existing elder sprite and guides exactly four actions: melee, defend, cast any starter spell, then answer trivia correctly. Other commands are disabled and rejected by the scene until their step. Arojinle has 100 practice HP and gentle 4-damage responses (2 when defended); the sequence ends as a completed lesson, without defeating him. During the final trivia step he waits: wrong, skipped or expired answers grant no SP and allow another question without further damage. Correct answers restore the usual capped SP. Leaving returns to the trail, replay starts fresh, and completion never clears the masquerade encounter or unlocks a stage.

These are initial tuning values, owned by `src/game/data/combat.ts`.

Hero: **120 HP, 40 SP**. The reference weapon is equipped as **Iron blade, level 1**: a broad leaf-shaped iron blade with a wooden handle and cord bindings, dealing **12 melee damage** for **0 SP**. The hero has **no shield**. Defend braces with the blade, halving the next enemy hit (rounding up) for no SP; it deals no counterattack damage.

Encounter 1 in Stage 1-1 contains the **Masquerade**, using the generated masked twin-sickle enemy idle: **100 HP**, **14 damage per response**, or **7** when defended. Approach and press E or choose Challenge Masquerade. Battles start at full HP/SP; returning to the map abandons the attempt, and retrying starts fresh. Defeat ends the battle. Victory clears encounter 1 for this session without completing the entire stage or unlocking encounters 2–4. Returning to the trail currently starts at the grove.

Damage values below are single-target base damage. Affinities label spells; elemental weaknesses, resistances, status effects and damage multipliers are not introduced in this balance pass. Only the four starter spells are usable. Later tiers are catalogue entries for future progression, with no automatic unlocks yet.

| Spell              | Affinity | Damage |  SP | Access         |
| ------------------ | -------- | -----: | --: | -------------- |
| Ember shot         | Fire     |     18 |   6 | Starter        |
| Storm spark        | Storm    |     22 |   8 | Starter        |
| Cutting gust       | Wind     |     14 |   4 | Starter        |
| Stone shard        | Earth    |     20 |   7 | Starter        |
| Flame lash         | Fire     |     30 |  11 | Locked, tier 2 |
| Thunderbolt        | Storm    |     36 |  14 | Locked, tier 2 |
| Wind lance         | Wind     |     26 |   9 | Locked, tier 2 |
| Boulder strike     | Earth    |     33 |  12 | Locked, tier 2 |
| Sunfire burst      | Fire     |     46 |  18 | Locked, tier 3 |
| Tempest arc        | Storm    |     54 |  22 | Locked, tier 3 |
| Cyclone blade      | Wind     |     40 |  15 | Locked, tier 3 |
| Faultline          | Earth    |     50 |  20 | Locked, tier 3 |
| Inferno crown      | Fire     |     68 |  28 | Locked, tier 4 |
| Skybreak           | Storm    |     80 |  34 | Locked, tier 4 |
| Hurricane edge     | Wind     |     60 |  24 | Locked, tier 4 |
| Mountain's verdict | Earth    |     74 |  31 | Locked, tier 4 |

Each valid melee, defend or spell action consumes one turn. If the enemy survives, it responds once. A killing hit prevents retaliation. An unaffordable, unknown or locked spell does not spend SP or a turn. HP never falls below zero.

Trivia is an optional turn action: one question, **12 seconds**, **+10 SP for a correct answer**, capped at 40. Wrong, skipped or expired answers give **0 SP**. The enemy then responds once. There is no timer on normal action selection. The deadline is checked again on answer submission, and leaving the scene cancels its timer. Arojinle teaches these current rules.

Verification: model tests cover costs, locks, damage, shieldless defense, lethal hits and trivia caps; browser tests cover the first encounter, its art, four spell buttons, deadline expiry, victory and session progression. Spell animation VFX and replacement weapon sprite artwork are separate asset work; the equipped weapon's current combat data follows the supplied reference.
