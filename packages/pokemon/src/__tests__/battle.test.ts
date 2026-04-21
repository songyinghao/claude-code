import { describe, test, expect } from 'bun:test'
import { createBattle, executeTurn } from '../battle/engine'
import { settleBattle, applyMoveLearn, applyEvolution } from '../battle/settlement'
import { chooseAIMove } from '../battle/ai'
import type { Creature, BuddyData } from '../types'

function makeTestCreature(overrides: Partial<Creature> = {}): Creature {
	return {
		id: overrides.id ?? 'test-1',
		speciesId: overrides.speciesId ?? 'charmander',
		gender: overrides.gender ?? 'male',
		level: overrides.level ?? 50,
		xp: 0,
		totalXp: 0,
		nature: overrides.nature ?? 'adamant',
		ev: overrides.ev ?? { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
		iv: overrides.iv ?? { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
		moves: overrides.moves ?? [
			{ id: 'flamethrower', pp: 15, maxPp: 15 },
			{ id: 'airslash', pp: 15, maxPp: 15 },
			{ id: 'dragontail', pp: 10, maxPp: 10 },
			{ id: 'slash', pp: 20, maxPp: 20 },
		],
		ability: overrides.ability ?? 'blaze',
		heldItem: null,
		friendship: 70,
		isShiny: false,
		hatchedAt: Date.now(),
		pokeball: 'pokeball',
	}
}

function makeTestBuddyData(creatures: Creature[] = [makeTestCreature()]): BuddyData {
	return {
		version: 2,
		party: [creatures[0]!.id, null, null, null, null, null],
		boxes: [],
		creatures: creatures,
		eggs: [],
		dex: [],
		bag: { items: [] },
		stats: {
			totalTurns: 0,
			consecutiveDays: 0,
			lastActiveDate: '',
			totalEggsObtained: 0,
			totalEvolutions: 0,
			battlesWon: 0,
			battlesLost: 0,
		},
	}
}

describe('createBattle', () => {
	test('creates battle with valid initial state', () => {
		const creature = makeTestCreature()
		const init = createBattle([creature], 'squirtle', 50)
		expect(init.state).toBeDefined()
		expect(init.state.playerPokemon).toBeDefined()
		expect(init.state.opponentPokemon).toBeDefined()
		expect(init.state.finished).toBe(false)
	})

	test('player pokemon has correct species', () => {
		const creature = makeTestCreature()
		const init = createBattle([creature], 'bulbasaur', 30)
		expect(init.state.playerPokemon.speciesId).toBe('charmander')
		expect(init.state.opponentPokemon.speciesId).toBe('bulbasaur')
	})

	test('player pokemon has moves', () => {
		const creature = makeTestCreature()
		const init = createBattle([creature], 'squirtle', 50)
		expect(init.state.playerPokemon.moves.length).toBeGreaterThan(0)
	})
})

describe('executeTurn', () => {
	test('move action generates events', () => {
		const creature = makeTestCreature()
		const init = createBattle([creature], 'squirtle', 50)
		const initialEventCount = init.state.events.length

		const newState = executeTurn(init, { type: 'move', moveIndex: 0 })
		expect(newState.events.length).toBeGreaterThanOrEqual(initialEventCount)
	})

	test('battle eventually ends within 50 turns', () => {
		const creature = makeTestCreature({ level: 100, ev: { hp: 252, attack: 252, defense: 0, spAtk: 0, spDef: 0, speed: 252 } })
		const init = createBattle([creature], 'squirtle', 5)

		let state = init.state
		for (let i = 0; i < 50 && !state.finished; i++) {
			state = executeTurn(init, { type: 'move', moveIndex: 0 })
		}

		expect(state.finished).toBe(true)
	})
})

describe('settleBattle', () => {
	test('player win increments battlesWon', () => {
		const creature = makeTestCreature()
		const data: BuddyData = {
			version: 2,
			party: [creature.id, null, null, null, null, null],
			boxes: [],
			creatures: [creature],
			eggs: [],
			dex: [],
			bag: { items: [] },
			stats: {
				totalTurns: 0,
				consecutiveDays: 0,
				lastActiveDate: '',
				totalEggsObtained: 0,
				totalEvolutions: 0,
				battlesWon: 0,
				battlesLost: 0,
			},
		}
		const result = {
			winner: 'player' as const,
			turns: 5,
			xpGained: 0,
			evGained: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
			participantIds: [creature.id],
		}

		const settlement = settleBattle(data, result, 'squirtle', 20)
		expect(settlement.data.stats.battlesWon).toBe(1)
	})

	test('player loss returns unchanged data', () => {
		const creature = makeTestCreature()
		const data: BuddyData = {
			version: 2,
			party: [creature.id, null, null, null, null, null],
			boxes: [],
			creatures: [creature],
			eggs: [],
			dex: [],
			bag: { items: [] },
			stats: {
				totalTurns: 0,
				consecutiveDays: 0,
				lastActiveDate: '',
				totalEggsObtained: 0,
				totalEvolutions: 0,
				battlesWon: 0,
				battlesLost: 0,
			},
		}
		const result = {
			winner: 'opponent' as const,
			turns: 3,
			xpGained: 0,
			evGained: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
			participantIds: [creature.id],
		}

		const settlement = settleBattle(data, result, 'squirtle', 20)
		// Loss early-returns unchanged data
		expect(settlement.data.creatures[0]!.totalXp).toBe(creature.totalXp)
		expect(settlement.learnableMoves).toEqual([])
		expect(settlement.pendingEvolutions).toEqual([])
	})
})

describe('applyMoveLearn', () => {
	test('replaces move at given index', () => {
		const creature = makeTestCreature()
		const data: BuddyData = {
			version: 2,
			party: [creature.id, null, null, null, null, null],
			boxes: [],
			creatures: [creature],
			eggs: [],
			dex: [],
			bag: { items: [] },
			stats: {
				totalTurns: 0,
				consecutiveDays: 0,
				lastActiveDate: '',
				totalEggsObtained: 0,
				totalEvolutions: 0,
				battlesWon: 0,
				battlesLost: 0,
			},
		}
		const updated = applyMoveLearn(data, creature.id, 'fireblast', 3)
		expect(updated.creatures[0]!.moves[3]!.id).toBe('fireblast')
	})
})

describe('applyEvolution', () => {
	test('evolves charmander to charmeleon and increments counter', () => {
		const creature = makeTestCreature({ speciesId: 'charmander' })
		const data: BuddyData = {
			version: 2,
			party: [creature.id, null, null, null, null, null],
			boxes: [],
			creatures: [creature],
			eggs: [],
			dex: [],
			bag: { items: [] },
			stats: {
				totalTurns: 0,
				consecutiveDays: 0,
				lastActiveDate: '',
				totalEggsObtained: 0,
				totalEvolutions: 0,
				battlesWon: 0,
				battlesLost: 0,
			},
		}
		const updated = applyEvolution(data, creature.id, 'charmeleon')
		expect(updated.creatures[0]!.speciesId).toBe('charmeleon')
		expect(updated.stats.totalEvolutions).toBe(1)
	})
})

describe('chooseAIMove', () => {
	test('returns a valid move index', () => {
		const creature = makeTestCreature()
		const init = createBattle([creature], 'squirtle', 50)
		const aiPokemon = init.state.opponentPokemon
		const idx = chooseAIMove(aiPokemon)
		expect(idx).toBeGreaterThanOrEqual(0)
		expect(idx).toBeLessThan(aiPokemon.moves.length)
	})
})
