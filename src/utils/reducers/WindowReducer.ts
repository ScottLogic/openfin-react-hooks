import { _Window } from "openfin/_v2/api/window/window";
import WINDOW_ACTION from "../types/enums/WindowAction";
import WINDOW_STATE from "../types/enums/WindowState";
interface IState {
  state: WINDOW_STATE;
  windowRefV1: any | null;
  windowRefV2: _Window | null;
}

interface IAction {
  error?: string;
  payload?: WINDOW_STATE | any | _Window;
  type: WINDOW_ACTION;
}

export const INITIAL_WINDOW_STATE: IState = {
  state: WINDOW_STATE.INITIAL,
  windowRefV1: null,
  windowRefV2: null,
};

function isWindowV1(payload: any): payload is any {
  return payload.getNativeWindow !== undefined;
}

function isWindowV2(payload: any): payload is _Window {
  return payload.getWebWindow !== undefined;
}

function isWindow(payload: any): payload is _Window | any {
  return isWindowV1(payload) || isWindowV2(payload);
}

export default (state: IState, action: IAction): IState => {
  switch (action.type) {
    case WINDOW_ACTION.CHANGE_STATE:
      if (action.payload && !isWindow(action.payload)) {
        if (!Object.keys(WINDOW_STATE).indexOf(String(action.payload))) {
          throw new Error(`Invalid window state: ${action.payload}.`);
        } else if (action.payload === WINDOW_STATE.ERROR) {
          throw new Error(
            `Error occured while window was state ${state.state}: ${action.error}`,
          );
        }
        return {
          ...state,
          state: action.payload,
        };
      }
      throw new Error("Cannot change state due to missing payload.");
    case WINDOW_ACTION.SET_V1_WINDOW:
      if (action.payload && isWindowV1(action.payload)) {
        return { ...state, windowRefV1: action.payload };
      }
      throw new Error(`Cannot set window: ${action.payload}`);
    case WINDOW_ACTION.SET_V2_WINDOW:
      if (action.payload && isWindowV2(action.payload)) {
        return { ...state, windowRefV2: action.payload };
      }
      throw new Error(`Cannot set window: ${action.payload}`);
    case WINDOW_ACTION.RESET:
      return INITIAL_WINDOW_STATE;
    default:
      throw new Error(`Invalid action type: ${action.type}.`);
  }
};
