/**
 * WordPress dependencies
 */
import { useState, useEffect, createPortal, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useResizeObserver } from '@wordpress/compose';

const className = 'editor-styles-wrapper';

function IframeContent( { doc, head, children } ) {
	useEffect( () => {
		const { defaultView } = doc;
		const { frameElement } = defaultView;

		doc.body.className = className;
		// Necessary for the resize listener to work correctly.
		doc.body.style.position = 'absolute';
		doc.body.style.right = '0';
		doc.body.style.left = '0';
		// Body style must be overridable by themes.
		doc.head.innerHTML =
			'<style>body{margin:0}</style>' +
			'<style>.wp-block[data-align="full"],.wp-block.alignfull{max-width:100vw!important;width:100vw!important;}</style>' +
			head;
		doc.dir = document.dir;

		Array.from( document.body.classList ).forEach( ( name ) => {
			if ( name.startsWith( 'admin-color-' ) ) {
				doc.body.classList.add( name );
			}
		} );

		// Search the document for stylesheets targetting the editor canvas.
		Array.from( document.styleSheets ).forEach( ( styleSheet ) => {
			try {
				// May fail for external styles.
				// eslint-disable-next-line no-unused-expressions
				styleSheet.cssRules;
			} catch ( e ) {
				return;
			}

			const { ownerNode, cssRules } = styleSheet;

			if ( ! cssRules ) {
				return;
			}

			const isMatch = Array.from( cssRules ).find(
				( { selectorText } ) =>
					selectorText &&
					( selectorText.includes( `.${ className }` ) ||
						selectorText.includes( `.wp-block` ) )
			);

			if ( isMatch && ! doc.getElementById( ownerNode.id ) ) {
				doc.head.appendChild( ownerNode.cloneNode( true ) );
			}
		} );

		function bubbleEvent( event ) {
			const prototype = Object.getPrototypeOf( event );
			const constructorName = prototype.constructor.name;
			const Constructor = window[ constructorName ];

			const init = {};

			for ( const key in event ) {
				init[ key ] = event[ key ];
			}

			if ( event.view && event instanceof event.view.MouseEvent ) {
				const rect = frameElement.getBoundingClientRect();
				init.clientX += rect.left;
				init.clientY += rect.top;
			}

			const newEvent = new Constructor( event.type, init );
			const cancelled = ! frameElement.dispatchEvent( newEvent );

			if ( cancelled ) {
				event.preventDefault();
			}
		}

		const eventTypes = [ 'keydown', 'keypress', 'dragover' ];

		eventTypes.forEach( ( name ) => {
			doc.addEventListener( name, bubbleEvent );
		} );

		return () => {
			eventTypes.forEach( ( name ) => {
				doc.removeEventListener( name, bubbleEvent );
			} );
		};
	}, [] );

	return createPortal( children, doc.body );
}

export default function Iframe( { children, head, style = {}, ...props } ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ contentDocument, setContentDocument ] = useState();
	const ref = useRef();

	function setDocumentIfReady( doc ) {
		const { readyState } = doc;

		if ( readyState === 'interactive' || readyState === 'complete' ) {
			setContentDocument( doc );
		}
	}

	useEffect( () => {
		setDocumentIfReady( ref.current.contentDocument );
	}, [] );

	function setRef( newRef ) {
		ref.current = newRef;

		if ( newRef ) {
			setDocumentIfReady( newRef.contentDocument );
		}
	}

	return (
		<iframe
			{ ...props }
			style={ {
				display: 'block',
				width: '100%',
				height: sizes.height + 'px',
				minHeight: '100%',
				...style,
			} }
			ref={ setRef }
			tabIndex="0"
			title={ __( 'Editor canvas' ) }
			name="editor-canvas"
			onLoad={ () => {
				// Document is not immediately loaded in Firefox.
				setDocumentIfReady( ref.current.contentDocument );
			} }
		>
			{ contentDocument && (
				<IframeContent doc={ contentDocument } head={ head }>
					{ children }
					{ resizeListener }
				</IframeContent>
			) }
		</iframe>
	);
}
