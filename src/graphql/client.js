import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8080/graphql',
});

// Attach JWT token as Authorization header on every request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('traildesk_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          treks: { merge: false },
          departures: { merge: false },
          bookings: { merge: false },
          customers: { merge: false },
          invoices: { merge: false },
          payments: { merge: false },
          refunds: { merge: false },
          campaigns: { merge: false },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

/**
 * Whether the GraphQL backend is enabled.
 * Set VITE_GRAPHQL_ENABLED=true in your .env to activate API calls.
 * When false (default), hooks fall back to static data.
 */
export const isGraphQLEnabled = import.meta.env.VITE_GRAPHQL_ENABLED === 'true';
