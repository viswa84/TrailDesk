import { useQuery, useMutation } from '@apollo/client/react';
import { GET_CITIES } from '../graphql/queries';
import { CREATE_CITY, UPDATE_CITY, DELETE_CITY, REORDER_CITIES } from '../graphql/mutations';

export function useCities(filters = {}) {
    const { data, loading, error, refetch } = useQuery(GET_CITIES, {
        variables: filters,
    });

    const [createCity] = useMutation(CREATE_CITY, {
        refetchQueries: [{ query: GET_CITIES }],
    });
    const [updateCity] = useMutation(UPDATE_CITY, {
        refetchQueries: [{ query: GET_CITIES }],
    });
    const [deleteCity] = useMutation(DELETE_CITY, {
        refetchQueries: [{ query: GET_CITIES }],
    });
    // No refetchQueries: the list is reordered optimistically in the page,
    // and the server returns the persisted sortOrder for each city.
    const [reorderCities] = useMutation(REORDER_CITIES);

    return {
        data: (data?.getCities || []).map(c => ({ ...c, id: c._id })),
        loading,
        error,
        refetch,
        add: async (city) => {
            const { data } = await createCity({ variables: { input: city } });
            return data.createCity;
        },
        update: async (id, updates) => {
            await updateCity({ variables: { id, input: updates } });
        },
        remove: async (id) => {
            await deleteCity({ variables: { id } });
        },
        reorder: async (ids) => {
            await reorderCities({ variables: { ids } });
        },
    };
}
