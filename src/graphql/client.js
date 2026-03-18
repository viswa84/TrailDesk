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
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

export default apolloClient;
