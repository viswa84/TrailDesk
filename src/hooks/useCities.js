import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { isGraphQLEnabled } from '../graphql/client';
import { GET_CITIES } from '../graphql/queries';
import { CREATE_CITY, UPDATE_CITY, DELETE_CITY } from '../graphql/mutations';

const staticCities = [
    { id: '1', name: 'Pune', state: 'Maharashtra', isActive: true },
    { id: '2', name: 'Mumbai', state: 'Maharashtra', isActive: true },
    { id: '3', name: 'Nashik', state: 'Maharashtra', isActive: true },
    { id: '4', name: 'Delhi', state: 'Delhi', isActive: true },
    { id: '5', name: 'Bangalore', state: 'Karnataka', isActive: true },
    { id: '6', name: 'Dehradun', state: 'Uttarakhand', isActive: true },
];

export function useCities(filters = {}) {
    const [localData, setLocalData] = useState(staticCities);

    const staticResult = {
        data: localData.filter(c => {
            if (filters.isActive !== undefined && c.isActive !== filters.isActive) return false;
            return true;
        }),
        loading: false,
        error: null,
        add: (city) => {
            const newCity = { ...city, id: String(localData.length + 1), isActive: true };
            setLocalData(prev => [...prev, newCity]);
            return newCity;
        },
        update: (id, updates) => {
            setLocalData(prev => prev.map(c => (c.id === id || c._id === id) ? { ...c, ...updates } : c));
        },
        remove: (id) => {
            setLocalData(prev => prev.filter(c => c.id !== id && c._id !== id));
        },
    };

    const gqlQuery = useQuery(GET_CITIES, {
        variables: filters,
        skip: !isGraphQLEnabled,
    });

    const [createCity] = useMutation(CREATE_CITY, {
        refetchQueries: isGraphQLEnabled ? [{ query: GET_CITIES }] : [],
    });
    const [updateCity] = useMutation(UPDATE_CITY, {
        refetchQueries: isGraphQLEnabled ? [{ query: GET_CITIES }] : [],
    });
    const [deleteCity] = useMutation(DELETE_CITY, {
        refetchQueries: isGraphQLEnabled ? [{ query: GET_CITIES }] : [],
    });

    const gqlResult = {
        data: (gqlQuery.data?.getCities || []).map(c => ({ ...c, id: c._id })),
        loading: gqlQuery.loading,
        error: gqlQuery.error,
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
    };

    return isGraphQLEnabled ? gqlResult : staticResult;
}
