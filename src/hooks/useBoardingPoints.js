import { useQuery, useMutation } from '@apollo/client/react';
import { GET_BOARDING_POINTS } from '../graphql/queries';
import { CREATE_BOARDING_POINT, UPDATE_BOARDING_POINT, DELETE_BOARDING_POINT, REORDER_BOARDING_POINTS } from '../graphql/mutations';

export function useBoardingPoints(cityId) {
    const { data, loading, error, refetch } = useQuery(GET_BOARDING_POINTS, {
        variables: cityId ? { cityId } : {},
        skip: !cityId,
    });

    const [createBP] = useMutation(CREATE_BOARDING_POINT, {
        refetchQueries: [{ query: GET_BOARDING_POINTS, variables: { cityId } }],
    });
    const [updateBP] = useMutation(UPDATE_BOARDING_POINT, {
        refetchQueries: [{ query: GET_BOARDING_POINTS, variables: { cityId } }],
    });
    const [deleteBP] = useMutation(DELETE_BOARDING_POINT, {
        refetchQueries: [{ query: GET_BOARDING_POINTS, variables: { cityId } }],
    });
    // No refetchQueries: the list is reordered optimistically in the page,
    // and the server returns the persisted sortOrder for each boarding point.
    const [reorderBPs] = useMutation(REORDER_BOARDING_POINTS);

    return {
        data: (data?.getBoardingPoints || []).map(bp => ({ ...bp, id: bp._id })),
        loading,
        error,
        refetch,
        add: async (input) => {
            const { data } = await createBP({ variables: { input } });
            return data.createBoardingPoint;
        },
        update: async (id, updates) => {
            await updateBP({ variables: { id, input: updates } });
        },
        remove: async (id) => {
            await deleteBP({ variables: { id } });
        },
        reorder: async (ids) => {
            await reorderBPs({ variables: { ids } });
        },
    };
}
