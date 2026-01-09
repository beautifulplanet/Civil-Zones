/**
 * Civil Zones - Lore Events
 * Story events and milestone tracking
 */

import type { 
    LoreEventId, 
    LoreEvent, 
    LoreIllustration, 
    LoreSeen 
} from './types.js';

// ═══════════════════════════════════════════════════════════════════
// LORE EVENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

/** All lore events in the game */
export const LORE_EVENTS: Record<LoreEventId, LoreEvent> = {
    GAME_START: {
        title: 'The Dream',
        text: 'Early man had a dream one night... a vision of something greater than mere survival. He saw his descendants building, thriving, creating. And so, with nothing but hope and hunger, he left his people and began to wander...',
        illustration: 'wanderer'
    },
    FIRST_WELL: {
        title: 'Fresh Water!',
        text: 'Digging far enough revealed what the wise ones spoke of - underground rivers! Fresh water bubbled up from the earth. No longer would the tribe be slaves to rivers and lakes. Now they could make water appear wherever they chose!',
        illustration: 'well'
    },
    FIRST_RESIDENTIAL: {
        title: 'A Proper Shelter',
        text: 'Now THIS is proper living! No more sleeping under stars with wolves howling. Four walls and a roof - what luxury! The tribe looked upon their creation with pride. "We are no longer wanderers," they declared. "We are SETTLERS."',
        illustration: 'hut'
    },
    FIRST_HUNTING_GROUND: {
        title: 'The Hunting Grounds',
        text: 'The wise hunter knows: chase the deer, catch one meal. Let the deer come to you, catch a hundred! And so the first hunting ground was established - a place where prey would wander in, never to wander out.',
        illustration: 'hunting'
    },
    FIRST_ROAD: {
        title: 'The Beaten Path',
        text: 'Why walk through thorns when you can walk on dirt? The tribe\'s smartest member (whose name has been lost to time, but was probably "Ook" or "Ug") packed down the earth to make travel easier. Revolutionary!',
        illustration: 'road'
    },
    FIRST_KILL: {
        title: 'The First Hunt',
        text: 'Blood! Meat! VICTORY! The beast fell before the tribe\'s mighty hunter. Tonight they would feast, and tomorrow... they would hunt again. The way of the predator had begun.',
        illustration: 'hunt_success'
    },
    FIRST_SETTLEMENT: {
        title: 'A Settlement is Born',
        text: 'No more wandering. No more running. This patch of earth... THIS belongs to us! The tribe drove stakes into the ground and declared themselves FOUNDERS. History was about to begin.',
        illustration: 'settlement'
    },
    FIRST_STORAGE: {
        title: 'The Storage Pit',
        text: 'The brilliant idea came from watching squirrels hide nuts. "What if WE buried our food?" And lo, the storage pit was invented. Now surplus wouldn\'t rot in the sun - it would rot underground! Progress!',
        illustration: 'storage'
    },
    FIRST_COMMERCIAL: {
        title: 'Trading Post',
        text: 'One day, Ook had three fish. Ug had three berries. Both wanted variety. After much grunting and gesturing, they discovered TRADE! The economy was born, and Ook\'s descendants would one day invent taxes.',
        illustration: 'trading'
    },
    FIRST_NOMAD: {
        title: 'A Stranger Approaches',
        text: 'From the mist emerged another... a fellow wanderer! Heart pounding, spear raised, our ancestor faced a choice. Friend or foe? The stranger raised a hand in peace. Today, the tribe grows stronger.',
        illustration: 'nomad'
    },
    FIRST_TURTLE: {
        title: 'Beach Bounty',
        text: 'Upon the sandy shores, a strange shelled creature waddled slowly. "What manner of rock moves on its own?" wondered the hunter. Turns out, it was delicious. The beach would never go hungry again.',
        illustration: 'turtle'
    },
    FLOOD_WARNING: {
        title: 'The Waters Rise',
        text: 'The elders spoke of this - the great waters that swallow the land. "Build high," they warned. "The sea remembers, and the sea returns." Perhaps it was time to seek higher ground...',
        illustration: 'flood'
    },
    FIRST_BERRY: {
        title: 'The Berry Bush',
        text: 'Red and plump, the berries glistened in the sun. The hungry wanderer reached out... Would they bring life or death? 90% of the time, it\'s fine! The other 10%... well, that\'s how we learned which ones NOT to eat.',
        illustration: 'berry'
    }
};

// ═══════════════════════════════════════════════════════════════════
// LORE EVENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Get a lore event by ID */
export function getLoreEvent(eventId: LoreEventId): LoreEvent | undefined {
    return LORE_EVENTS[eventId];
}

/** Check if a lore event has been seen */
export function hasSeenLore(loreSeen: LoreSeen, eventId: LoreEventId): boolean {
    return loreSeen[eventId] === true;
}

/** Mark a lore event as seen */
export function markLoreSeen(loreSeen: LoreSeen, eventId: LoreEventId): LoreSeen {
    return {
        ...loreSeen,
        [eventId]: true
    };
}

/** Check if lore should be shown (enabled and not seen) */
export function shouldShowLore(
    loreEnabled: boolean,
    loreSeen: LoreSeen,
    eventId: LoreEventId
): boolean {
    if (!loreEnabled) return false;
    if (hasSeenLore(loreSeen, eventId)) return false;
    return true;
}

/** Get all unseen lore events */
export function getUnseenLore(loreSeen: LoreSeen): LoreEventId[] {
    const allEvents = Object.keys(LORE_EVENTS) as LoreEventId[];
    return allEvents.filter(id => !hasSeenLore(loreSeen, id));
}

/** Get count of seen lore events */
export function getSeenLoreCount(loreSeen: LoreSeen): number {
    return Object.values(loreSeen).filter(Boolean).length;
}

/** Get total lore event count */
export function getTotalLoreCount(): number {
    return Object.keys(LORE_EVENTS).length;
}

/** Get lore progress as percentage */
export function getLoreProgress(loreSeen: LoreSeen): number {
    const total = getTotalLoreCount();
    if (total === 0) return 100;
    return Math.round((getSeenLoreCount(loreSeen) / total) * 100);
}

// ═══════════════════════════════════════════════════════════════════
// LORE TRIGGER HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Check and trigger first kill lore */
export function checkFirstKillLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FIRST_KILL'),
        eventId: 'FIRST_KILL'
    };
}

/** Check and trigger first turtle lore */
export function checkFirstTurtleLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FIRST_TURTLE'),
        eventId: 'FIRST_TURTLE'
    };
}

/** Check and trigger first nomad lore */
export function checkFirstNomadLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FIRST_NOMAD'),
        eventId: 'FIRST_NOMAD'
    };
}

/** Check and trigger first berry lore */
export function checkFirstBerryLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FIRST_BERRY'),
        eventId: 'FIRST_BERRY'
    };
}

/** Check and trigger first well lore */
export function checkFirstWellLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FIRST_WELL'),
        eventId: 'FIRST_WELL'
    };
}

/** Check and trigger first settlement lore */
export function checkFirstSettlementLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FIRST_SETTLEMENT'),
        eventId: 'FIRST_SETTLEMENT'
    };
}

/** Check and trigger game start lore */
export function checkGameStartLore(
    loreSeen: LoreSeen, 
    year: number
): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'GAME_START') && year === 0,
        eventId: 'GAME_START'
    };
}

/** Check and trigger flood warning lore */
export function checkFloodWarningLore(loreSeen: LoreSeen): { 
    shouldShow: boolean; 
    eventId: LoreEventId 
} {
    return {
        shouldShow: !hasSeenLore(loreSeen, 'FLOOD_WARNING'),
        eventId: 'FLOOD_WARNING'
    };
}

// ═══════════════════════════════════════════════════════════════════
// ILLUSTRATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Get all illustration types */
export function getAllIllustrations(): LoreIllustration[] {
    return [
        'wanderer', 'well', 'hut', 'hunting', 'road',
        'hunt_success', 'settlement', 'storage', 'trading',
        'nomad', 'turtle', 'flood', 'berry'
    ];
}

/** Check if illustration type is valid */
export function isValidIllustration(type: string): type is LoreIllustration {
    return getAllIllustrations().includes(type as LoreIllustration);
}
