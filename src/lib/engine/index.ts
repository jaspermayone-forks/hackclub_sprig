import { playTune } from './tune'
import { normalizeGameError } from './error'
import { bitmaps, NormalizedError } from '../state'
import type { PlayTuneRes } from 'sprig'
import { textToTune } from 'sprig/base'
import { webEngine } from 'sprig/web'
import * as Babel from "@babel/standalone"
import TransformDetectInfiniteLoop, { BuildDuplicateFunctionDetector } from '../custom-babel-transforms'

interface RunResult {
	error: NormalizedError | null
	cleanup: () => void
}

export function runGame(code: string, canvas: HTMLCanvasElement, onPageError: (error: NormalizedError) => void): RunResult {
	const game = webEngine(canvas)

	const tunes: PlayTuneRes[] = []
	const timeouts: number[] = []
	const intervals: number[] = []

	const errorListener = (event: ErrorEvent) => {
		onPageError(normalizeGameError({ kind: 'page', error: event.error }))
	}
	window.addEventListener('error', errorListener)

	const cleanup = () => {
		game.cleanup()
		tunes.forEach(tune => tune.end())
		timeouts.forEach(clearTimeout)
		intervals.forEach(clearInterval)
		window.removeEventListener('error', errorListener)
	}

	const api = {
		...game.api,
		setTimeout: (fn: TimerHandler, ms: number) => {
			const timer = setTimeout(fn, ms)
			timeouts.push(timer)
			return timer
		},
		setInterval: (fn: TimerHandler, ms: number) => {
			const timer = setInterval(fn, ms)
			intervals.push(timer)
			return timer
		},
		setLegend: (..._bitmaps: [string, string][]) => {
			// this is bad; but for some reason i could not do _bitmaps === [undefined]
			// @ts-ignore
			if(JSON.stringify(_bitmaps) === "[null]") {
				// @ts-ignore
				bitmaps.value = [[]];
				throw new Error('The sprites passed into setLegend each need to be in square brackets, like setLegend([player, bitmap`...`]).')
			} else {
				bitmaps.value = _bitmaps;
			}
			return game.api.setLegend(...bitmaps.value)
		},
		playTune: (text: string, n: number) => {
			const tune = textToTune(text)
			const playTuneRes = playTune(tune, n)
			tunes.push(playTuneRes)
			return playTuneRes
		}
	}

	const engineAPIKeys = Object.keys(api);
	try {
		const transformResult = Babel.transform(code, {
			plugins: [TransformDetectInfiniteLoop, BuildDuplicateFunctionDetector(engineAPIKeys)],
			retainLines: true
		})

		const fn = new Function(...engineAPIKeys, transformResult.code!)
		fn(...Object.values(api))
		return { error: null, cleanup }
	} catch (error: any) {
		// if there's an error code, it's most likely a babel error of some kind 
		// other errors do not have an error code attached
		if (!error.code) {
			const normalizedError = normalizeGameError({ kind: "runtime", error });
			normalizedError!.line! += 1;
			return { error: normalizedError, cleanup };
		} 
		return {
			error: {
				raw: error,
				description: error.message,
				line: error.loc.line,
				column: error.loc.column
			},
			cleanup
		}
	}
}

export function runGameHeadless(code: string): void {
	const game = webEngine(document.createElement('canvas'))

	const api = {
		...game.api,
		setTimeout: () => {},
		setInterval: () => {},
		setLegend: (..._bitmaps: [string, string][]) => {
			// this is bad; but for some reason i could not do _bitmaps === [undefined]
			if(JSON.stringify(_bitmaps) === "[null]") { 
				// @ts-ignore
				bitmaps.value = [[]];
				throw new Error('The sprites passed into setLegend each need to be in square brackets, like setLegend([player, bitmap`...`]).');
			} else 
				bitmaps.value = _bitmaps
			return game.api.setLegend(..._bitmaps)
		},
		playTune: () => {}
	}

	code = `"use strict";\n${code}`
	try {
		const fn = new Function(...Object.keys(api), code)
		fn(...Object.values(api))
	} catch {}

	game.cleanup()
}
