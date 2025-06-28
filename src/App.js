import React, {useEffect} from 'react';
import {Routes, Route, useLocation} from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';
import UnlockPage from "./pages/UnlockPage";

function App () {
  return (
      <Routes>
        <Route exact path="/" element={<UnlockPage/>}/>
        <Route exact path="/unlock" element={<UnlockPage/>}/>
      </Routes>
  );
}

export default App;
