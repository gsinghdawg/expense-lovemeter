
/// <reference types="vite/client" />

// Declare the Stripe Buy Button custom element
declare namespace JSX {
  interface IntrinsicElements {
    'stripe-buy-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      'buy-button-id': string;
      'publishable-key': string;
    }, HTMLElement>;
  }
}
