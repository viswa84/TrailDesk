import { useQuery, useMutation } from '@apollo/client/react';
import { GET_BOARDING_POINTS } from '../graphql/queries';
import { CREATE_BOARDING_POINT, UPDATE_BOARDING_POINT, DELETE_BOARDING_POINT } from '../graphql/mutations';

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
    };
}
