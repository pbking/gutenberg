/**
 * WordPress dependencies
 */
import {
	PostTitle,
	VisualEditorGlobalKeyboardShortcuts,
} from '@wordpress/editor';
import {
	WritingFlow,
	BlockList,
	__unstableUseBlockSelectionClearer as useBlockSelectionClearer,
	__unstableUseTypewriter as useTypewriter,
	__unstableUseClipboardHandler as useClipboardHandler,
	__unstableUseTypingObserver as useTypingObserver,
	__unstableUseScrollMultiSelectionIntoView as useScrollMultiSelectionIntoView,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalUseResizeCanvas as useResizeCanvas,
	__unstableUseCanvasClickRedirect as useCanvasClickRedirect,
	__unstableUseEditorStyles as useEditorStyles,
	Iframe,
} from '@wordpress/block-editor';
import { Popover, DropZoneProvider } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import { useSelect } from '@wordpress/data';

function Canvas( { settings } ) {
	const ref = useRef();

	useScrollMultiSelectionIntoView( ref );
	useBlockSelectionClearer( ref );
	useTypewriter( ref );
	useClipboardHandler( ref );
	useTypingObserver( ref );
	useCanvasClickRedirect( ref );
	useEditorStyles( ref, settings.styles );

	const hasMetaBoxes = useSelect(
		( select ) => select( 'core/edit-post' ).hasMetaBoxes(),
		[]
	);

	// Add a constant padding for the typewritter effect. When typing at the
	// bottom, there needs to be room to scroll up.
	useEffect( () => {
		if ( hasMetaBoxes ) {
			ref.current.style.paddingBottom = '';
			return;
		}

		ref.current.style.paddingBottom = '40vh';
	}, [ hasMetaBoxes ] );

	return (
		<div tabIndex="-1" ref={ ref }>
			<DropZoneProvider>
				<WritingFlow>
					<div className="edit-post-visual-editor__post-title-wrapper">
						<PostTitle />
					</div>
					<BlockList />
				</WritingFlow>
			</DropZoneProvider>
		</div>
	);
}

export default function VisualEditor( { settings } ) {
	const deviceType = useSelect( ( select ) => {
		return select( 'core/edit-post' ).__experimentalGetPreviewDeviceType();
	}, [] );
	const desktopCanvasStyles = { height: '100%' };
	const resizedCanvasStyles = useResizeCanvas( deviceType );

	return (
		<div className="edit-post-visual-editor" style={ { height: '100%' } }>
			<VisualEditorGlobalKeyboardShortcuts />
			<Popover.Slot name="block-toolbar" />
			<Iframe
				style={ resizedCanvasStyles || desktopCanvasStyles }
				head={ window.__editorStyles.html }
			>
				<Canvas settings={ settings } />
			</Iframe>
			<__experimentalBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => (
					<BlockInspectorButton onClick={ onClose } />
				) }
			</__experimentalBlockSettingsMenuFirstItem>
		</div>
	);
}
