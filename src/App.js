import React, { useState, useEffect, createContext } from 'react'
import logo from './logo.svg';
import './App.css';
import request from "superagent";
import Main from "./components/Main";
import Reset from "./components/Reset";

export const UserCount = createContext();


const App = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    
  }, []);

  const getData = () => {
    request
      .get("/api/getData")
      .end((err, data) => {
        if (err) {
          console.error(err);
          return;
        }
          //setCount(data.body.data);
          return;
      });
  }

  return (
    <div className="App">
      {/*
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload. 
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      */}
      <p>Annotation</p>
      <UserCount.Provider value={[count, setCount]}>
        <Main />
      </UserCount.Provider>
    </div>
  );
}

export default App;
