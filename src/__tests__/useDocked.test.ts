import { renderHook, act } from '@testing-library/react-hooks'
import useDocked from "../../src/useDocked";
import {Fin} from "openfin/_v2/main";
import {snapAndDock} from "openfin-layouts";

jest.mock('openfin-layouts');

interface Window {
    fin: Fin;
}

describe('useDocked', () => {
  beforeEach(() => {
    window.fin = {}; // Mock out fin object
  });

  it('default is not docked', () => {
    const { result } = renderHook(() => useDocked());
    const isDocked = result.current[0];
    expect(isDocked).toBe(false);
  });

  it('undock function causes undock of window', () => {
    const { result } = renderHook(() => useDocked());
    act(() => {
      result.current[0] = true; // Simulating dock by user
    });

    snapAndDock.undockWindow.mockImplementation(() => {
      act(() => {
        result.current[0] = false;
      });
    })

    const undock = result.current[1];
    undock();
    const isDocked = result.current[0];
    expect(isDocked).toBe(false);
  });
});
