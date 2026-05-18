import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:8080/graphql',
});

// Attach JWT token to every request
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('trekops_token');
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
          getTreks: { merge: false },
          getBookings: { merge: false },
          getCustomers: { merge: false },
          getDepartures: { merge: false },
          getCampaigns: { merge: false },
          getInvoices: { merge: false },
          getPayments: { merge: false },
          getRefunds: { merge: false },
          getNotifications: { merge: false },
          getCities: { merge: false },
          getParticipantsByDeparture: { merge: false },
          // Paginated chat messages — keyed by phone only; merges older pages
          // in front of newer ones when fetchMore is called with a `before` cursor.
          getMessages: {
            keyArgs: ['phone'],
            merge(existing, incoming) {
              // incoming.messages are older (we prepend them)
              const existingMsgs = existing?.messages ?? [];
              const incomingMsgs = incoming?.messages ?? [];
              return {
                ...incoming,
                messages: [...incomingMsgs, ...existingMsgs],
              };
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

export default apolloClient;
