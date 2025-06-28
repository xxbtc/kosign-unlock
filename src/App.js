import React, {useEffect} from 'react';
import {Routes, Route, useLocation} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import UnlockPage from "./pages/UnlockPage";
import { SensitiveModeProvider } from './contexts/SensitiveModeContext';

function App () {
  return (
      <SensitiveModeProvider>
        <Routes>
          <Route exact path="/" element={<UnlockPage/>}/>
          <Route exact path="/unlock" element={<UnlockPage/>}/>
        </Routes>
      </SensitiveModeProvider>
  );
}

export default App;
