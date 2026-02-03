import { AppProvider } from "../../store/AppProvider";
import { EditorPane } from "../EditorPane";
import styles from "./index.module.css";

/** the application root container. */
export const App: React.FC = () => (
  <AppProvider>
    <div className={styles.container}>
      <EditorPane className={styles.canvas} />
    </div>
  </AppProvider>
);
