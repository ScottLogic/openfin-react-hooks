import { _Window } from "openfin/_v2/api/window/window";
import { IUseChildWindowOptions } from "../../index";
import { renderHook, act } from '@testing-library/react-hooks'
import useChildWindow from "../../src/useChildWindow";

const defaultOptions: IUseChildWindowOptions = {
  name: 'name',
  windowOptions: {},
  parentDocument: {},
  cssUrl: undefined,
  jsx: undefined,
  shouldClosePreviousOnLaunch: true,
  shouldInheritCss: true,
  shoulInheritScripts: true
};


const createMockWindow = (windowName: string, closeFunction: (name: string) => () => Promise<void>) => {
  const mockWindow = <jest.Mock<typeof _Window>><unknown>{
    getWebWindow: () => ({
      document: null
    }),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    close: closeFunction(windowName),
    identity: {
      name: windowName
    }
  };
  return mockWindow;
}

const mockCloseFunction = jest.fn();

describe('useChildWindow v2', () => {
  describe('shouldClosePreviousOnLaunch', () => {
    beforeEach(() => {
      // Mocking this function rather that the inner `() => Promise.resolve()` allows tests to spy on the name of the child window that 'close' is called on
      mockCloseFunction.mockImplementation((name) => {
        return () => Promise.resolve()
      });
      // Mock out fin object:
      window.fin = {
        mockChildWindows: [], // To store the child windows created by the mock 'create' that are then referenced by the mock 'close'
        Window: {
          getCurrentSync: () => ({
            getWebWindow: () => Promise.resolve({})
          }),
          create: (createOptions) => {
            return new Promise((resolve) => {
              const mockWindow = createMockWindow(createOptions.name, mockCloseFunction);
              window.fin.mockChildWindows.push(mockWindow);
              resolve(mockWindow);
            })
          }
        },
        Application: {
          getCurrent: () => Promise.resolve({
            getChildWindows: () => window.fin.mockChildWindows
          })
        }
      };
    });
  
    it('does not close existing window when false', async () => {
      const options = { ...defaultOptions, name: 'child', shouldClosePreviousOnLaunch: false };
      const { result } = renderHook(() => useChildWindow(options));
      const mockCloseChildWindow = jest.fn();
      mockCloseFunction.mockImplementation((name) => mockCloseChildWindow);
      await act(async () => {
        await result.current.launch();
        await result.current.launch();
      });
      expect(mockCloseChildWindow).not.toHaveBeenCalled();
    });
  
    it('closes existing window when true', async () => {
      const options = { ...defaultOptions, name: 'child', shouldClosePreviousOnLaunch: true };
      const { result } = renderHook(() => useChildWindow(options));
      const mockCloseChildWindow = jest.fn();
      mockCloseFunction.mockImplementation((name) => mockCloseChildWindow);
      await act(async () => {
        await result.current.launch(options);
        await result.current.launch(options);
      });
      expect(mockCloseChildWindow).toHaveBeenCalledTimes(1);
    });
  
    it.skip('does not close windows with a different name when true', async () => {
      const mockChild0CloseFunc = jest.fn(() => Promise.resolve());
      const mockChild1CloseFunc = jest.fn(() => Promise.resolve());
      mockCloseFunction.mockImplementation((name) => {
        if (name === 'child0') {
          return mockChild0CloseFunc
        } else if (name === 'child1') {
          return mockChild1CloseFunc
        } else {
          throw "Child Window name not found"
        }
      });
      const child0Options = { ...defaultOptions, name: 'child0', shouldClosePreviousOnLaunch: true };
      const child1Options = { ...defaultOptions, name: 'child1', shouldClosePreviousOnLaunch: true };
      const childHook0 = renderHook(() => useChildWindow(child0Options)).result;
      const childHook1 = renderHook(() => useChildWindow(child1Options)).result;

      await act(async () => {
        await childHook0.current.launch(child0Options);
        await childHook1.current.launch(child1Options);
      });
      expect(mockChild0CloseFunc).not.toHaveBeenCalled();
      expect(mockChild1CloseFunc).not.toHaveBeenCalled();
    });
  });
});
