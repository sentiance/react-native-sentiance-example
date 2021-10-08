import {UPDATE_SDK_STATUS, UPDATE_USER_DATA} from "./actions";

const initialState = {
    userData: {
        id: undefined,
        linkingInstallId: undefined,
        activity: {},
        context: {}
    },
    sdkStatus: {
        version: undefined,
        isThirdPartyLinked: undefined,
        data: []
    }
};

function mainReducer(state = initialState, action) {
    switch (action.type) {
        case UPDATE_SDK_STATUS:
            return {...state, sdkStatus: {...state.sdkStatus, ...action.payload}};
        case UPDATE_USER_DATA:
            return {...state, userData: {...state.userData, ...action.payload}};
        default:
            return state;
    }
}

export default mainReducer;