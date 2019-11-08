'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reducerEnhancer = exports.defaultState = exports.SET_DEFAULT_UI_STATE = exports.UPDATE_UI_STATE = exports.MASS_UPDATE_UI_STATE = undefined;
exports.default = reducer;
exports.updateUI = updateUI;
exports.massUpdateUI = massUpdateUI;
exports.setDefaultUI = setDefaultUI;
exports.unmountUI = unmountUI;
exports.mountUI = mountUI;

var _immutable = require('immutable');

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// For updating multiple UI variables at once.  Each variable might be part of
// a different context; this means that we need to either call updateUI on each
// key of the object to update or do transformations within one action in the
// reducer. The latter only triggers one store change event and is more
// performant.
var MASS_UPDATE_UI_STATE = exports.MASS_UPDATE_UI_STATE = '@@redux-ui/MASS_UPDATE_UI_STATE';
var UPDATE_UI_STATE = exports.UPDATE_UI_STATE = '@@redux-ui/UPDATE_UI_STATE';
var SET_DEFAULT_UI_STATE = exports.SET_DEFAULT_UI_STATE = '@@redux-ui/SET_DEFAULT_UI_STATE';

// These are private consts used in actions only given to the UI decorator.
var MOUNT_UI_STATE = '@@redux-ui/MOUNT_UI_STATE';
var UNMOUNT_UI_STATE = '@@redux-ui/UNMOUNT_UI_STATE';

var defaultState = exports.defaultState = {
  __reducers: {}
};

function reducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : defaultState;
  var action = arguments[1];

  var key = action.payload && (action.payload.key || []);

  if (!Array.isArray(key)) {
    key = [key];
  }

  var keypath = key.join('.');
  switch (action.type) {
    case UPDATE_UI_STATE:
      var _action$payload = action.payload,
          name = _action$payload.name,
          value = _action$payload.value;

      if (typeof value === 'function') {
        state = Object.assign({}, state, _defineProperty({}, keypath, Object.assign({}, state[keypath], _defineProperty({}, name, value(state[keypath][name])))));
      } else {
        state = Object.assign({}, state, _defineProperty({}, keypath, Object.assign({}, state[keypath], _defineProperty({}, name, value))));
      }
      break;

    case MASS_UPDATE_UI_STATE:
      var _action$payload2 = action.payload,
          uiVars = _action$payload2.uiVars,
          transforms = _action$payload2.transforms;

      Object.keys(transforms).forEach(function (k) {
        var path = uiVars[k];
        (0, _invariant2.default)(path, 'Couldn\'t find variable ' + k + ' within your component\'s UI state ' + ('context. Define ' + k + ' before using it in the @ui decorator'));

        var _keypath = path.join('.');
        state = Object.assign({}, state, _defineProperty({}, _keypath, Object.assign({}, state[_keypath], _defineProperty({}, k, transforms[k]))));
      });
      break;

    case SET_DEFAULT_UI_STATE:
      // Replace all UI under a key with the given values
      state = Object.assign({}, state, _defineProperty({}, keypath, Object.assign({}, state[keypath], action.payload.value)));
      break;

    case MOUNT_UI_STATE:
      var _action$payload3 = action.payload,
          defaults = _action$payload3.defaults,
          customReducer = _action$payload3.customReducer;

      state = Object.assign({}, state, _defineProperty({}, keypath, defaults));
      if (customReducer) {
        state['__reducers'] = Object.assign({}, _defineProperty({}, keypath, {
          path: key,
          func: customReducer
        }));
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

  var customReducers = state['__reducers'];
  if (Object.keys(customReducers).length > 0) {
    var keys = Object.keys(customReducers);
    keys.forEach(function (key) {
      var _customReducers$key = customReducers[key],
          path = _customReducers$key.path,
          func = _customReducers$key.func;

      var newState = func(state[path], action);
      if (newState === undefined) {
        throw new Error('Your custom UI reducer at path ' + path.join('.') + ' must return some state');
      }
      state = Object.assign({}, state, _defineProperty({}, path, newState));
    });
  }

  return state;
}

var reducerEnhancer = exports.reducerEnhancer = function reducerEnhancer(customReducer) {
  return function (state, action) {
    state = reducer(state, action);
    if (typeof customReducer === 'function') {
      state = customReducer(state, action);
    }
    return state;
  };
};

function updateUI(key, name, value) {
  return {
    type: UPDATE_UI_STATE,
    payload: {
      key: key,
      name: name,
      value: value
    }
  };
};

function massUpdateUI(uiVars, transforms) {
  return {
    type: MASS_UPDATE_UI_STATE,
    payload: {
      uiVars: uiVars,
      transforms: transforms
    }
  };
}

// Exposed to components, allowing them to reset their and all child scopes to
// the default variables set up
function setDefaultUI(key, value) {
  return {
    type: SET_DEFAULT_UI_STATE,
    payload: {
      key: key,
      value: value
    }
  };
};

/** Private, decorator only actions **/

// This is not exposed to your components; it's only used in the decorator.
function unmountUI(key) {
  return {
    type: UNMOUNT_UI_STATE,
    payload: {
      key: key
    }
  };
};

/**
 * Given the key/path, set of defaults and custom reducer for a UI component
 * during construction prepare the state of the UI reducer
 *
 */
function mountUI(key, defaults, customReducer) {
  return {
    type: MOUNT_UI_STATE,
    payload: {
      key: key,
      defaults: defaults,
      customReducer: customReducer
    }
  };
}