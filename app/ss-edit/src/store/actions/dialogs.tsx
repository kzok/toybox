import { ConfirmClearDialog } from "../../components/Dialogs";
import type { ActionCreatorParam } from "./types";

/**
 * @param store
 * @param atoms
 * @returns actions for dialogs
 */
export const createDialogActions = ({ store, atoms }: ActionCreatorParam) => {
  /**
   * @param render dialog render function
   * @returns result
   */
  const showDialog = async <T,>(
    render: (resolve: (_: T) => void) => React.ReactNode,
  ): Promise<T> => {
    const result = await new Promise<T>((resolve) =>
      store.set(atoms.dialogReactNode, render(resolve)),
    );
    store.set(atoms.dialogReactNode, null);
    return result;
  };

  return {
    /** show dialog to confirm if it's okay to clear items */
    confirmClear: (): Promise<boolean> =>
      showDialog((resolve) => <ConfirmClearDialog resolve={resolve} />),
  } as const;
};
