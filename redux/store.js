import {createStore, combineReducers, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';
import mainReducer from './mainReducer';
const rootReducer = combineReducers({
    mainReducer
});
export const store = createStore(rootReducer, applyMiddleware(thunk));