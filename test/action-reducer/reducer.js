'use strict';

import {
  reducer,
  reducerEnhancer,
  UPDATE_UI_STATE
} from '../../src/action-reducer.js';

import { assert } from 'chai';
import { is, Map } from 'immutable';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import { defaultState } from '../../src/action-reducer.js';
import { equal, deepEqual } from 'assert';

const customReducer = (state, action) => {
  return state;
}
const enhancedReducer = reducerEnhancer(customReducer);

describe('reducerEnhancer', () => {
  let enhancedStore;

  beforeEach( () => {
    enhancedStore = createStore(combineReducers({ ui: enhancedReducer }));
  });

  it('delegates to the default reducer', () => {
    assert.isTrue(is(enhancedStore.getState().ui, defaultState));

    enhancedStore.dispatch({
      type: UPDATE_UI_STATE,
      payload: {
        key: 'a',
        name: 'foo',
        value: 'bar'
      }
    });

    assert.deepEqual(
      enhancedStore.getState().ui,
      { 'a': { 'foo': 'bar' }, __reducers: {}}
    );
  });

  it('intercepts custom actions', () => {
    assert.deepEqual(enhancedStore.getState().ui, defaultState);

    enhancedStore.dispatch({
      type: 'CUSTOM_ACTION_TYPE',
      payload: {
        foo: 'bar'
      }
    });
    assert.deepEqual(
      enhancedStore.getState().ui,
      { __reducers: {}}
    );
  });

  it('update ui state by updater', () => {
    assert.deepEqual(enhancedStore.getState().ui, defaultState);

    enhancedStore.dispatch({
      type: UPDATE_UI_STATE,
      payload: {
        key: 'foo',
        name: 'bar',
        value: 'baz'
      }
    });

    enhancedStore.dispatch({
      type: UPDATE_UI_STATE,
      payload: {
        key: 'foo',
        name: 'bar',
        value: baz => baz.toUpperCase()
      }
    });

    assert.deepEqual(
      enhancedStore.getState().ui,
      { foo: { bar: 'BAZ' }, __reducers: {}}
    );
  });
});
