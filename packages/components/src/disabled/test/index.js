/**
 * External dependencies
 */
import TestUtils from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Disabled, { Disableable } from '../';

jest.mock( '@wordpress/dom', () => {
	const focus = jest.requireActual( '../../../../dom/src' ).focus;

	return {
		focus: {
			...focus,
			focusable: {
				...focus.focusable,
				find( context ) {
					// In JSDOM, all elements have zero'd widths and height.
					// This is a metric for focusable's `isVisible`, so find
					// and apply an arbitrary non-zero width.
					Array.from( context.querySelectorAll( '*' ) ).forEach(
						( element ) => {
							Object.defineProperties( element, {
								offsetWidth: {
									get: () => 1,
								},
							} );
						}
					);

					return focus.focusable.find( ...arguments );
				},
			},
		},
	};
} );

describe( 'Disabled', () => {
	let MutationObserver;

	beforeAll( () => {
		MutationObserver = window.MutationObserver;
		window.MutationObserver = function () {};
		window.MutationObserver.prototype = {
			observe() {},
			disconnect() {},
		};
	} );

	afterAll( () => {
		window.MutationObserver = MutationObserver;
	} );

	const Form = () => (
		<form>
			<input />
			<div contentEditable tabIndex="0" />
		</form>
	);

	// this is needed because TestUtils does not accept a stateless component.
	class DisabledComponent extends Component {
		render() {
			const { children } = this.props;

			return <Disabled>{ children }</Disabled>;
		}
	}

	it( 'will disable all fields', () => {
		const wrapper = TestUtils.renderIntoDocument(
			<DisabledComponent>
				<Form />
			</DisabledComponent>
		);

		const input = TestUtils.findRenderedDOMComponentWithTag(
			wrapper,
			'input'
		);
		const div = TestUtils.scryRenderedDOMComponentsWithTag(
			wrapper,
			'div'
		)[ 1 ];

		expect( input.hasAttribute( 'disabled' ) ).toBe( true );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'false' );
		expect( div.hasAttribute( 'tabindex' ) ).toBe( false );
		expect( div.hasAttribute( 'disabled' ) ).toBe( false );
	} );

	it( 'should cleanly un-disable via reconciliation', () => {
		// If this test suddenly starts failing, it means React has become
		// smarter about reusing children into grandfather element when the
		// parent is dropped, so we'd need to find another way to restore
		// original form state.
		// Using state for this test for easier manipulation of the child props.
		class MaybeDisable extends Component {
			constructor() {
				super( ...arguments );
				this.state = { isDisabled: true };
			}

			render() {
				return this.state.isDisabled ? (
					<Disabled>
						<Form />
					</Disabled>
				) : (
					<Form />
				);
			}
		}

		const wrapper = TestUtils.renderIntoDocument( <MaybeDisable /> );
		wrapper.setState( { isDisabled: false } );

		const input = TestUtils.findRenderedDOMComponentWithTag(
			wrapper,
			'input'
		);
		const div = TestUtils.findRenderedDOMComponentWithTag( wrapper, 'div' );

		expect( input.hasAttribute( 'disabled' ) ).toBe( false );
		expect( div.getAttribute( 'contenteditable' ) ).toBe( 'true' );
		expect( div.hasAttribute( 'tabindex' ) ).toBe( true );
	} );

	// Ideally, we'd have two more test cases here:
	//
	//  - it( 'will disable all fields on component render change' )
	//  - it( 'will disable all fields on sneaky DOM manipulation' )
	//
	// Alas, JSDOM does not support MutationObserver:
	//
	//  https://github.com/jsdom/jsdom/issues/639

	describe( 'Consumer', () => {
		class DisabledStatus extends Component {
			render() {
				return (
					<p>
						<Disabled.Consumer>
							{ ( isDisabled ) =>
								isDisabled ? 'Disabled' : 'Not disabled'
							}
						</Disabled.Consumer>
					</p>
				);
			}
		}

		test( "lets components know that they're disabled via context", () => {
			const wrapper = TestUtils.renderIntoDocument(
				<DisabledComponent>
					<DisabledStatus />
				</DisabledComponent>
			);
			const wrapperElement = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'p'
			);
			expect( wrapperElement.textContent ).toBe( 'Disabled' );
		} );

		test( "lets components know that they're not disabled via context", () => {
			const wrapper = TestUtils.renderIntoDocument( <DisabledStatus /> );
			const wrapperElement = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'p'
			);
			expect( wrapperElement.textContent ).toBe( 'Not disabled' );
		} );
	} );

	describe( 'Disableable', () => {
		class DisableableComponent extends Component {
			render() {
				const { children, disabled } = this.props;

				return (
					<Disableable disabled={ disabled }>
						{ children }
					</Disableable>
				);
			}
		}

		it( 'will not disable fields by default', () => {
			const wrapper = TestUtils.renderIntoDocument(
				<DisableableComponent>
					<Form />
				</DisableableComponent>
			);

			const input = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'input'
			);
			const div = TestUtils.scryRenderedDOMComponentsWithTag(
				wrapper,
				'div'
			)[ 0 ];

			expect( input.hasAttribute( 'disabled' ) ).toBe( false );
			expect( div.getAttribute( 'contenteditable' ) ).not.toBe( 'false' );
		} );

		it( 'will disable all fields if disabled prop is true', () => {
			const wrapper = TestUtils.renderIntoDocument(
				<DisableableComponent disabled>
					<Form />
				</DisableableComponent>
			);

			const input = TestUtils.findRenderedDOMComponentWithTag(
				wrapper,
				'input'
			);
			const div = TestUtils.scryRenderedDOMComponentsWithTag(
				wrapper,
				'div'
			)[ 1 ];

			expect( input.hasAttribute( 'disabled' ) ).toBe( true );
			expect( div.getAttribute( 'contenteditable' ) ).toBe( 'false' );
		} );
	} );
} );
