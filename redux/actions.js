export const UPDATE_SDK_STATUS = 'UPDATE_SDK_STATUS';
export const UPDATE_USER_DATA = 'UPDATE_USER_DATA';

export const updateSdkStatus = (sdkStatusInfo) => {
    try {
        return async dispatch => {
            dispatch({
                type: UPDATE_SDK_STATUS,
                payload: sdkStatusInfo,
            });
        };
    } catch (error) {
        // Add custom logic to handle errors
    }
};

export const updateUserData = (userData) => {
    try {
        return async dispatch => {
            dispatch({
                type: UPDATE_USER_DATA,
                payload: userData,
            });
        };
    } catch (error) {
        // Add custom logic to handle errors
    }
};