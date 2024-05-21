import { createEditorState, initialExtensions, diagnosticsFromErrorLog } from '../lib/codemirror/init'
import { useEffect, useRef, useState } from 'preact/hooks'
import { StateEffect } from '@codemirror/state'
import styles from './codemirror.module.css'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { theme, errorLog } from '../lib/state'
import { Diagnostic, setDiagnosticsEffect } from '@codemirror/lint'

interface CodeMirrorProps {
	class?: string | undefined
	initialCode?: string
	onCodeChange?: () => void
	onRunShortcut?: () => void
	onEditorView?: (editor: EditorView) => void
}

export default function CodeMirror(props: CodeMirrorProps) {
	const parent = useRef<HTMLDivElement>(null)
	const [editorRef, setEditorRef] = useState<EditorView>();

	// Alert the parent to code changes (not reactive)
	const onCodeChangeRef = useRef(props.onCodeChange)
	useEffect(() => { onCodeChangeRef.current = props.onCodeChange }, [props.onCodeChange])

	// Run button
	const onRunShortcutRef = useRef(props.onRunShortcut)
	useEffect(() => { onRunShortcutRef.current = props.onRunShortcut }, [props.onRunShortcut])

	let lastCode: string | undefined = props.initialCode ?? ''
	// serves to restore config before dark mode was added
	const restoreInitialConfig = () => initialExtensions(() => {
		if (editorRef?.state.doc.toString() === lastCode) return
		lastCode = editorRef?.state.doc.toString()
		onCodeChangeRef.current?.()
	}, () => onRunShortcutRef.current?.());

	const setEditorTheme = () => {
		if (theme.value === "dark") {
			editorRef?.dispatch({
				effects: StateEffect.appendConfig.of(oneDark)
			});
		} else editorRef?.dispatch({
			effects: StateEffect.reconfigure.of(restoreInitialConfig())
		});
	};


	useEffect(() => {
		if (!parent.current) throw new Error('Oh golly! The editor parent ref is null')

		const editor = new EditorView({
			state: createEditorState(props.initialCode ? props.initialCode : '', () => {
				if (editor.state.doc.toString() === lastCode) return
				lastCode = editor.state.doc.toString()
				onCodeChangeRef.current?.()
			}, () => onRunShortcutRef.current?.()),
			parent: parent.current,
		})

		setEditorRef(editor);
		props.onEditorView?.(editor)
	}, [])

	useEffect(() => {
		setEditorTheme();
	}, [theme.value, editorRef]);

	useEffect(() => {
		errorLog.subscribe(value => {
			const diagnostics = diagnosticsFromErrorLog(editorRef as EditorView, value);
			editorRef?.dispatch({
				effects: setDiagnosticsEffect.of(diagnostics as Diagnostic[])
			});
		});
	}, [editorRef]);

	return (
		<div class={`${styles.container} ${props.class ?? ''}`} ref={parent} />
	)
}
