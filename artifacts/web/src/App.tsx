import { Switch, Route } from "wouter";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/not-found";
import './index.css';

function App() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
