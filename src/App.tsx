import React from 'react';
import PeerConnectionBuilder from './PeerConnection/PeerConnectionBuilder';
import './App.css';

function App() {  
  return (
    <div className="App">
      <PeerConnectionBuilder hostname="localhost" port={6969} ></PeerConnectionBuilder>
    </div>
  );
}

export default App;
