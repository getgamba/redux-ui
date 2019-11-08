'use strict';

import { Map } from 'immutable';
import invariant from 'invariant'

// For updating multiple UI variables at once.  Each variable might be part of
// a different context; this means that we need to either call updateUI on each
// key of the object to update or do transformations within one action in the
// reducer. The latter only triggers one store change event and is more
// performant.
export const MASS_UPDATE_UI_STATE = '@@redux-ui/MASS_UPDATE_UI_STATE';
export const UPDATE_UI_STATE = '@@redux-ui/UPDATE_UI_STATE';
export const SET_DEFAULT_UI_STATE = '@@redux-ui/SET_DEFAULT_UI_STATE';

// These are private consts used in actions only given to the UI decorator.
const MOUNT_UI_STATE = '@@redux-ui/MOUNT_UI_STATE';
const UNMOUNT_UI_STATE = '@@redux-ui/UNMOUNT_UI_STATE';

export const defaultState = {
  __reducers: {}
}

export default function reducer(state = defaultState, action) {
  let key = action.payload && (action.payload.key || []);

  if (!Array.isArray(key)) {
    key = [key];
  }

  let keypath = key.join('.')
  switch (action.type) {
    case UPDATE_UI_STATE:
      const { name, value } = action.payload;
      if (typeof value === 'function') {
        state = Object.assign({}, state, {
          [keypath]: Object.assign({}, state[keypath], {
            [name]: value(state[keypath][name])
          })
        });
      } else {
        state = Object.assign({}, state, {
          [keypath]: Object.assign({}, state[keypath], {
            [name]: value
          })
        });
      }
      break;

    case MASS_UPDATE_UI_STATE:
      const { uiVars, transforms } = action.payload;
      Object.keys(transforms).forEach(k => {
        const path = uiVars[k];
        invariant(
          path,
          `Couldn't find variable ${k} within your component's UI state ` +
          `context. Define ${k} before using it in the @ui decorator`
        );

        const _keypath = path.join('.')
        state = Object.assign({}, state, {
          [_keypath]: Object.assign({}, state[_keypath], {
            [k]: transforms[k]
          })
        });
      });
      break;

    case SET_DEFAULT_UI_STATE:
      // Replace all UI under a key with the given values
      state = Object.assign({}, state, {
        [keypath]: Object.assign({}, state[keypath], action.payload.value)
      });
      break;

    case MOUNT_UI_STATE:
      const { defaults, customReducer } = action.payload;
      state = Object.assign({}, state, {
        [keypath]: defaults
      })
      if (customReducer) {
        state['__reducers'] = Object.assign({}, {
          [keypath]: {
            path: key, 
            func: customReducer
          }
        })
      }
      break;

    case UNMOUNT_UI_STATE:
      // We have to use deleteIn as react unmounts root components first;
      // this means that using setIn in child contexts will fail as the root
      // context will be stored as undefined in our state
      state = Object.assign({}, state);
      delete state[keypath];
      delete state['__reducers'][keypath];
      break;
  }

  const customReducers = state['__reducers'];
  if (Object.keys(customReducers).length > 0) {
    const keys = Object.keys(customReducers);
    keys.forEach((key)=> {
      const { path, func } = customReducers[key];
      const newState = func(state[path], action);
      if (newState === undefined) {
        throw new Error(`Your custom UI reducer at path ${path.join('.')} must return some state`);
      }
      state = Object.assign({}, state, {
        [path]: newState
      })
    })
  }

  return state;
}

export const reducerEnhancer = (customReducer) => (state, action) => {
  state = reducer(state, action);
  if (typeof customReducer === 'function') {
    state = customReducer(state, action);
  }
  return state;
}

export function updateUI(key, name, value) {
  return {
    type: UPDATE_UI_STATE,
    payload: {
      key,
      name,
      value
    }
  };
};

export function massUpdateUI(uiVars, transforms) {
  return {
    type: MASS_UPDATE_UI_STATE,
    payload: {
      uiVars,
      transforms
    }
  };
}

// Exposed to components, allowing them to reset their and all child scopes to
// the default variables set up
export function setDefaultUI(key, value) {
  return {
    type: SET_DEFAULT_UI_STATE,
    payload: {
      key,
      value
    }
  };
};

/** Private, decorator only actions **/

// This is not exposed to your components; it's only used in the decorator.
export function unmountUI(key) {
  return {
    type: UNMOUNT_UI_STATE,
    payload: {
      key
    }
  };
};

/**
 * Given the key/path, set of defaults and custom reducer for a UI component
 * during construction prepare the state of the UI reducer
 *
 */
export function mountUI(key, defaults, customReducer) {
  return {
    type: MOUNT_UI_STATE,
    payload: {
      key,
      defaults,
      customReducer
    }
  }
}
