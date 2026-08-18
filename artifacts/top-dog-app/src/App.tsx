import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Home from '@/pages/home';
import NoteNew from '@/pages/note-new';
import NoteDetail from '@/pages/note-detail';
import Dilution from '@/pages/dilution';
import Chat from '@/pages/chat';
import Login from '@/pages/login';
import { Layout } from '@/components/layout';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mb-6 shadow-[4px_4px_0_0_hsl(var(--border))]">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight mb-2">404 - Area Restricted</h1>
        <p className="text-muted-foreground max-w-md font-sans mb-8 text-lg">
          The operation zone you are trying to access does not exist in the mainframe.
        </p>
        <Button onClick={() => window.location.href = '/'}>
          Return to Command Center
        </Button>
      </div>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/notes/new" component={NoteNew} />
      <Route path="/notes/:id" component={NoteDetail} />
      <Route path="/dilution" component={Dilution} />
      <Route path="/chat" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();

  if (authenticated === null) {
    // Loading auth status
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authenticated) {
    return <Login />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthGate>
            <Router />
          </AuthGate>
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
