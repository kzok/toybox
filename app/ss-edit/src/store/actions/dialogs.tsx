import { ConfirmClearDialog, ErrorNoticeDialog, SaveImageDialog } from "../../components/Dialogs";
import type { ActionCreatorParam } from "./types";

export const createDialogActions = ({ store, atoms }: ActionCreatorParam) => {
  /**
   * push a dialog onto the stack, then pop it once it resolves.
   * @param render dialog render function
   */
  const showDialog = async <T,>(
    render: (resolve: (_: T) => void) => React.ReactNode,
  ): Promise<T> => {
    const id = crypto.randomUUID();
    const result = await new Promise<T>((resolve) =>
      store.set(atoms.dialogStack, (stack) => [...stack, { id, node: render(resolve) }]),
    );
    store.set(atoms.dialogStack, (stack) => stack.filter((entry) => entry.id !== id));
    return result;
  };

  return {
    /** show dialog to confirm if it's okay to clear items */
    confirmClear: (): Promise<boolean> =>
      showDialog((resolve) => <ConfirmClearDialog resolve={resolve} />),
    /**
     * wrap an action so that a thrown value is shown in a dialog instead of being propagated.
     * @param f action to wrap
     * @returns the wrapped action, which never rejects and settles once the user closes the dialog
     */
    withErrorDialog:
      <T extends unknown[]>(f: (...params: T) => Promise<void> | void) =>
      async (...params: T): Promise<void> => {
        try {
          await f(...params);
        } catch (e) {
          console.error(e);
          await showDialog<void>((resolve) => <ErrorNoticeDialog error={e} resolve={resolve} />);
        }
      },
    /**
     * show save image dialog
     * @param save callback to save image
     */
    showSaveDialog: (save: () => Promise<void>): Promise<void> =>
      showDialog((resolve) => <SaveImageDialog save={save} close={resolve} />),
  } as const;
};
