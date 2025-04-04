import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Mock the user ID for development purposes
// In a real app, this would come from authentication
localStorage.setItem('userId', '1');

createRoot(document.getElementById("root")!).render(<App />);
