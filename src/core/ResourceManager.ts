/**
 * Resource Manager
 * Handles resource tracking, production, consumption, and spoilage
 */

import type { ResourceAmounts, ResourceCapacity } from './Resources';
import { createEmptyResources, createDefaultCapacity, addResources, subtractResources, clampToCapacity, canAfford } from './Resources';

export class ResourceManager {
    private resources: ResourceAmounts;
    private capacity: ResourceCapacity;
    private hasStorage: boolean = false;

    constructor(initialResources?: Partial<ResourceAmounts>) {
        this.resources = { ...createEmptyResources(), ...initialResources };
        this.capacity = createDefaultCapacity();
    }

    public getResources(): Readonly<ResourceAmounts> {
        return { ...this.resources };
    }

    public getCapacity(): Readonly<ResourceCapacity> {
        return { ...this.capacity };
    }

    public setCapacity(newCapacity: Partial<ResourceCapacity>): void {
        this.capacity = { ...this.capacity, ...newCapacity };
        // Clamp current resources to new capacity
        this.resources = clampToCapacity(this.resources, this.capacity);
    }

    public setHasStorage(hasStorage: boolean): void {
        this.hasStorage = hasStorage;
    }

    public canAfford(cost: Partial<ResourceAmounts>): boolean {
        return canAfford(this.resources, cost);
    }

    public subtract(cost: Partial<ResourceAmounts>): boolean {
        if (!this.canAfford(cost)) {
            return false;
        }
        this.resources = subtractResources(this.resources, cost);
        return true;
    }

    public add(addition: Partial<ResourceAmounts>): void {
        this.resources = addResources(this.resources, addition);
        this.resources = clampToCapacity(this.resources, this.capacity);
    }

    /**
     * Apply food spoilage at end of turn
     * 20% spoilage without storage, 10% with storage
     */
    public applySpoilage(): number {
        const spoilageRate = this.hasStorage ? 0.10 : 0.20;
        const spoiled = Math.floor(this.resources.food * spoilageRate);
        this.resources.food -= spoiled;
        return spoiled;
    }

    /**
     * Process annual resource consumption
     * @param population Number of people to feed
     * @returns true if population survived, false if starvation
     */
    public consumeAnnualFood(population: number): boolean {
        const foodNeeded = population; // 1 food per person per year
        this.resources.food -= foodNeeded;

        // Check for starvation
        if (this.resources.food < 0) {
            this.resources.food = 0;
            return false; // Starvation occurred
        }
        return true;
    }

    /**
     * Add production from buildings
     */
    public addProduction(production: Partial<ResourceAmounts>): void {
        this.add(production);
    }
}
