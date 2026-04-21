import { describe, test, expect } from 'bun:test'
import { getDefaultBuddyData } from '../core/storage'

describe('getDefaultBuddyData', () => {
	test('returns v2 data with correct structure', async () => {
		const data = await getDefaultBuddyData()
		expect(data.version).toBe(2)
		expect(data.party.length).toBe(6)
		expect(data.party[0]).toBeTruthy()
		expect(data.boxes.length).toBe(8)
		expect(data.boxes[0]!.slots.length).toBe(30)
		expect(data.bag.items).toEqual([])
		expect(data.stats.battlesWon).toBe(0)
		expect(data.stats.battlesLost).toBe(0)
	})

	test('has one creature matching party[0]', async () => {
		const data = await getDefaultBuddyData()
		expect(data.creatures.length).toBe(1)
		expect(data.creatures[0]!.id).toBe(data.party[0]!)
	})

	test('creature has v2 fields', async () => {
		const data = await getDefaultBuddyData()
		const creature = data.creatures[0]!
		expect(creature.nature).toBeTruthy()
		expect(creature.moves.length).toBe(4)
		expect(creature.ability).toBeTruthy()
		expect(creature.heldItem).toBeNull()
		expect(creature.pokeball).toBe('pokeball')
	})
})
