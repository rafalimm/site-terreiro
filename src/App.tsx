import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';

// Pages
import { Home } from './pages/Home';
import { Sobre } from './pages/Sobre';
import { NossaCasa } from './pages/NossaCasa';
import { Agenda } from './pages/Agenda';
import { CartasBuzios } from './pages/CartasBuzios';
import { Duvidas } from './pages/Duvidas';
import { Galeria } from './pages/Galeria';
import { Noticias } from './pages/Noticias';
import { Contato } from './pages/Contato';
import { Login } from './pages/Login';
import { MinhaConta } from './pages/MinhaConta';
import { LinhasEntidades } from './pages/LinhasEntidades';
import { Privacidade } from './pages/Privacidade';
import { Termos } from './pages/Termos';
import { AdminPage } from './pages/Admin/AdminPage';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/nossa-casa" element={<NossaCasa />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/cartas-buzios" element={<CartasBuzios />} />
            <Route path="/duvidas" element={<Duvidas />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/minha-conta" element={<MinhaConta />} />
            <Route path="/linhas-entidades" element={<LinhasEntidades />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
