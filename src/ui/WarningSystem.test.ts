import { describe, it, expect } from 'vitest';
import {
    getThirstWarning,
    getFoodWarning,
    getDangerWarning,
    getCombatMessage,
    getRecruitmentMessage,
} from './WarningSystem';

describe('getThirstWarning', () => {
    it('returns critical at thirst <= 10', () => {
        const w = getThirstWarning(10);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('critical');
        expect(w!.flash).toBe(true);
        expect(w!.message).toContain('CRITICAL');
    });

    it('returns danger at thirst 11-30', () => {
        const w = getThirstWarning(30);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('danger');
    });

    it('returns warning at thirst 31-50', () => {
        const w = getThirstWarning(50);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('warning');
        expect(w!.flash).toBe(false);
    });

    it('returns info at thirst 51-70', () => {
        const w = getThirstWarning(70);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('info');
    });

    it('returns null when thirst > 70', () => {
        expect(getThirstWarning(71)).toBeNull();
        expect(getThirstWarning(100)).toBeNull();
    });
});

describe('getFoodWarning', () => {
    it('returns critical at food <= 10', () => {
        const w = getFoodWarning(10);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('critical');
        expect(w!.message).toContain('STARVATION');
    });

    it('returns warning at food 11-50', () => {
        const w = getFoodWarning(50);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('warning');
    });

    it('returns null when food > 50', () => {
        expect(getFoodWarning(51)).toBeNull();
        expect(getFoodWarning(300)).toBeNull();
    });
});

describe('getDangerWarning', () => {
    it('returns critical when thirst <= 10% (thirst value <= 10)', () => {
        const w = getDangerWarning(10, 300);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('critical');
    });

    it('returns critical when food <= 10% of 300 max (food <= 30)', () => {
        const w = getDangerWarning(100, 30);
        expect(w).not.toBeNull();
        expect(w!.priority).toBe('critical');
    });

    it('returns null when both above 10%', () => {
        expect(getDangerWarning(50, 100)).toBeNull();
    });
});

describe('getCombatMessage', () => {
    it('returns success message with reward', () => {
        const w = getCombatMessage(true, 25);
        expect(w.message).toContain('+25 food');
        expect(w.priority).toBe('info');
    });

    it('returns miss message on failure', () => {
        const w = getCombatMessage(false, 0);
        expect(w.message).toContain('missed');
        expect(w.priority).toBe('warning');
    });
});

describe('getRecruitmentMessage', () => {
    it('returns join message on success', () => {
        const w = getRecruitmentMessage(true, false);
        expect(w.message).toContain('joined');
        expect(w.priority).toBe('info');
    });

    it('returns hostile encounter message', () => {
        const w = getRecruitmentMessage(false, true, 3);
        expect(w.message).toContain('Hostile');
        expect(w.message).toContain('3');
        expect(w.priority).toBe('danger');
        expect(w.flash).toBe(true);
    });

    it('returns fled message for non-hostile failure', () => {
        const w = getRecruitmentMessage(false, false);
        expect(w.message).toContain('fled');
        expect(w.priority).toBe('info');
    });
});
