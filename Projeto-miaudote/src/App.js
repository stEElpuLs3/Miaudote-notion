import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Termos from './pages/Termos';
import Footer from './components/Footer/Footer';
import { CssBaseline, Box, Container, Typography } from '@mui/material';
import Home from './pages/Home';
import Profile from './pages/Profile';
import NavBar from './components/NavBar/NavBar';
import RegisterPet from './pages/RegisterPet';
import SearchPets from './pages/SearchPets';
import SuccessStories from './pages/SuccessStories';
import Cadastro from './pages/Cadastro/Cadastro';
import Favoritos from './pages/Favoritos';
import LoginModal from './components/LoginModal/LoginModal';
import Mensagens from './pages/Mensagens';
import { UserClass } from './UserClass';
import './styles.css';
import './App.css';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

function App() {
  const LogOut = () => {
    UserClass.Logout();
    window.location.href = "/";
    return null;
  };

  const [isOpenModal, setOpenModal] = useState(false);

  return (
    <Router>
      <CssBaseline />
      <NavBar isOpenModal={isOpenModal} setOpenModal={setOpenModal} />
      <LoginModal open={isOpenModal} onClose={() => setOpenModal(false)} />
      <Box component="main" sx={{ p: 3, mt: 8 }}>
        <Routes>
          <Route
            path="/"
            element={<Home isOpenModal={isOpenModal} setOpenModal={setOpenModal} />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/register-pet" element={<RegisterPet />} />
          <Route path="/search-pets" element={<SearchPets />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/cadastro-usuario" element={<Cadastro />} />
          <Route path="/logout" element={<LogOut />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/mensagens" element={<Mensagens />} />
          <Route path="/termos" element={<Termos />} />
          <Route
            path="*"
            element={
              <Container>
                <Typography variant="h2">404 - Página não encontrada</Typography>
              </Container>
            }
          />
        </Routes>
        <Footer />
      </Box>
    </Router>
  );
}

export default App;