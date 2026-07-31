import { EditorPane } from "../containers/EditorPane";
import { Footer } from "../containers/Footer";
import { Header } from "../containers/Header";
import { AppProvider } from "./AppProvider";
import styles from "./index.module.css";

/** the application root container. */
export const App: React.FC = () => (
  <AppProvider className={styles.fluidProvider}>
    <div className={styles.container}>
      <Header className={styles.header} />
      <EditorPane className={styles.canvas} />
      <Footer className={styles.footer} />
    </div>
  </AppProvider>
);
