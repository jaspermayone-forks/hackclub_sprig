import type { EditorView } from '@codemirror/view'
import { Signal, signal } from '@preact/signals'
import { IoColorPalette, IoImage, IoMap, IoMusicalNotes } from 'react-icons/io5'
import type { FromTo } from './codemirror/util'

import BitmapEditor from '../components/subeditors/bitmap-editor'
import ColorPickerEditor from '../components/subeditors/color-picker'
import MapEditor from '../components/subeditors/map-editor'
import SequencerEditor from '../components/subeditors/sequencer'
import type { Game, SessionInfo } from './game-saving/account'

// Error handling
export interface NormalizedError {
	raw: unknown
	description: string
	line?: number | null
	column?: number | null
}

// Editor types
export interface EditorProps {
	text: Signal<string>
}
export const editors = {
	bitmap: {
		label: 'bitmap',
		icon: IoImage,
		modalContent: BitmapEditor,
		fullsizeModal: true,
		needsBitmaps: false
	},
	sequencer: {
		label: 'tune',
		icon: IoMusicalNotes,
		modalContent: SequencerEditor,
		fullsizeModal: true,
		needsBitmaps: false
	},
	map: {
		label: 'map',
		icon: IoMap,
		modalContent: MapEditor,
		fullsizeModal: true,
		needsBitmaps: true
	},
	palette: {
		label: 'color',
		icon: IoColorPalette,
		modalContent: ColorPickerEditor,
		fullsizeModal: false,
		needsBitmaps: false
	}
}
export type EditorKind = keyof typeof editors
export const editorKinds = Object.keys(editors) as EditorKind[]

export interface OpenEditor {
	kind: EditorKind
	editRange: FromTo
	text: string
}

// Persistence
export type PersistenceState = ({
	kind: 'IN_MEMORY'
	showInitialWarning: boolean
} | {
	kind: 'PERSISTED'
	cloudSaveState: 'SAVED' | 'SAVING' | 'ERROR'
	game: 'LOADING' | Game,
	tutorial?: string[] | undefined,
	tutorialIndex?: number | undefined
} | {
	kind: 'SHARED'
	name: string
	authorName: string
	code: string,
	tutorial?: string[] | undefined
	tutorialName?: string | undefined
	tutorialIndex?: number | undefined
}) & {
	session: SessionInfo | null
	stale: boolean
}

export const codeMirror = signal<EditorView | null>(null)
export const muted = signal<boolean>(false)
export const errorLog = signal<NormalizedError[]>([])
export const openEditor = signal<OpenEditor | null>(null)
export const bitmaps = signal<[string, string][]>([])
export const editSessionLength = signal<Date>(new Date());

export type ThemeType = "dark" | "light" | "busker";
export const theme = signal<ThemeType>("dark");
type Theme = {
	navbarIcon: string,
	accent: string,
	accentDark: string,
	fgMutedOnAccent: string,
	background: string,
	color: string
	copyContainerText: string
};

const baseTheme: Theme = {
	navbarIcon: "/SPRIGDINO.png",
	accent: "#078969",
	accentDark: "#136853",
	fgMutedOnAccent: "#8fcabb",
	background: "#2f2f2f",
	color: "black",
	copyContainerText: "white",
};

export const themes: Partial<Record<ThemeType, Theme>> = {
	"dark": {
		...baseTheme,
		background: "#2f2f2f",
	},
	"light": {
		...baseTheme,
		background: "#fafed7",
		copyContainerText: "black"
	},
	"busker": {
		...baseTheme,
		navbarIcon: "/PENNY_HEAD.png",
		accent: "#FFAE06",
	 	accentDark: "#ff9d00",
		fgMutedOnAccent: "#6d83ff",
		background: "#3E29ED",
	}
};

export const switchTheme = (themeType: ThemeType) => {
	theme.value = themeType;
	
	// store the new theme value in local storage
	localStorage.setItem("theme", themeType);

	const themeValue = themes[themeType];
	// set the document values
	const documentStyle = document.body.style;
	documentStyle.background = themeValue.background;
	document.documentElement.style.setProperty(`--accent`, themeValue.accent);
	document.documentElement.style.setProperty(`--accent-dark`, themeValue.accentDark);
	document.documentElement.style.setProperty(`--fg-muted-on-accent`, themeValue.fgMutedOnAccent);
	documentStyle.color = themeValue.color;
	
	// change the color of the text in elements having .copy-container style
	// These includes pages such as 'Gallery' and 'Your Games'
	const copyContainer = document.querySelector(".copy-container") as HTMLDivElement;
	if (copyContainer) {
		copyContainer.style.color = themeValue.copyContainerText;
	}
}