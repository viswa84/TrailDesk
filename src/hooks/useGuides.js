import { useQuery, useMutation } from '@apollo/client/react';
import { GET_GUIDES } from '../graphql/queries';
import { CREATE_GUIDE, UPDATE_GUIDE, DELETE_GUIDE } from '../graphql/mutations';

export const useGuides = () => {
    const { data, loading, error, refetch } = useQuery(GET_GUIDES);

    const [createGuide] = useMutation(CREATE_GUIDE, {
        refetchQueries: [{ query: GET_GUIDES }],
    });

    const [updateGuide] = useMutation(UPDATE_GUIDE, {
        refetchQueries: [{ query: GET_GUIDES }],
    });

    const [deleteGuide] = useMutation(DELETE_GUIDE, {
        refetchQueries: [{ query: GET_GUIDES }],
    });

    return {
        guides: data?.getGuides || [],
        loading,
        error,
        refetch,
        addGuide: async (input) => {
            const { data } = await createGuide({ variables: { input } });
            return data.createGuide;
        },
        updateGuide: async (id, input) => {
            const { data } = await updateGuide({ variables: { id, input } });
            return data.updateGuide;
        },
        deleteGuide: async (id) => {
            await deleteGuide({ variables: { id } });
        },
    };
};
