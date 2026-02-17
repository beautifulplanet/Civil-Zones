/**
 * Warning System
 * Handles all warning messages and visual feedback for survival mechanics
 * Clean, isolated module - no dependencies on game state
 */

export interface Warning {
    readonly message: string;
    readonly color: string;
    readonly priority: 'info' | 'warning' | 'danger' | 'critical';
    readonly flash: boolean;  // Should the message flash?
}

/**
 * Get thirst warning based on current thirst level (0-100)
 * Per game-data-spec.md Section 3.1 Tutorial System
 */
export function getThirstWarning(thirst: number): Warning | null {
    if (thirst <= 10) {
        return {
            message: 'CRITICAL: Find water NOW!',
            color: '#FF0000',
            priority: 'critical',
            flash: true
        };
    }
    if (thirst <= 30) {
        return {
            message: 'Dehydration warning!',
            color: '#FF4400',
            priority: 'danger',
            flash: true
        };
    }
    if (thirst <= 50) {
        return {
            message: 'Thirst intensifies',
            color: '#FF8800',
            priority: 'warning',
            flash: false
        };
    }
    if (thirst <= 70) {
        return {
            message: 'You feel thirsty',
            color: '#FFCC00',
            priority: 'info',
            flash: false
        };
    }
    return null;
}

/**
 * Get food warning based on current food level
 */
export function getFoodWarning(food: number): Warning | null {
    if (food <= 10) {
        return {
            message: 'STARVATION IMMINENT!',
            color: '#FF0000',
            priority: 'critical',
            flash: true
        };
    }
    if (food <= 50) {
        return {
            message: 'Hunger pangs',
            color: '#FFAA00',
            priority: 'warning',
            flash: false
        };
    }
    return null;
}

/**
 * Get danger warning for any resource at critical level
 */
export function getDangerWarning(thirst: number, food: number): Warning | null {
    const thirstPercent = thirst / 100;
    const foodPercent = food / 300; // Max food capacity

    if (thirstPercent <= 0.1 || foodPercent <= 0.1) {
        return {
            message: 'DANGER!',
            color: '#FF0000',
            priority: 'critical',
            flash: true
        };
    }
    return null;
}

/**
 * Get combat result message
 */
export function getCombatMessage(success: boolean, reward: number): Warning {
    if (success) {
        return {
            message: `Hunt successful! +${reward} food`,
            color: '#44FF44',
            priority: 'info',
            flash: false
        };
    }
    return {
        message: 'Attack missed!',
        color: '#FFAA00',
        priority: 'warning',
        flash: false
    };
}

/**
 * Get recruitment result message
 */
export function getRecruitmentMessage(success: boolean, hostile: boolean, damage?: number): Warning {
    if (success) {
        return {
            message: 'Nomad joined your tribe!',
            color: '#44FF44',
            priority: 'info',
            flash: false
        };
    }
    if (hostile) {
        return {
            message: `Hostile encounter! Lost ${damage} population`,
            color: '#FF4444',
            priority: 'danger',
            flash: true
        };
    }
    return {
        message: 'Nomad fled',
        color: '#AAAAAA',
        priority: 'info',
        flash: false
    };
}
