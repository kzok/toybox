import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { AppProvider } from "../../store/AppProvider";
import { EditorPane } from "../EditorPane";
import { Footer } from "../Footer";
import styles from "./index.module.css";

/** the application root container. */
export const App: React.FC = () => (
  <FluentProvider className={styles.fluidProvider} theme={webLightTheme}>
    <AppProvider>
      <div className={styles.container}>
        <EditorPane className={styles.canvas} />
        <Footer className={styles.footer} />
      </div>
    </AppProvider>
  </FluentProvider>
);
