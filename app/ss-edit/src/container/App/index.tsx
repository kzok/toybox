import { AppProvider } from "../../store/AppProvider";
import { CanvasPane } from "../CanvasPane";
import styles from "./index.module.css";

/** the application root container. */
export const App: React.FC = () => (
  <AppProvider>
    <div className={styles.container}>
      <CanvasPane className={styles.canvas} />
    </div>
  </AppProvider>
);
