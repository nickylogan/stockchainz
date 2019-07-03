import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

export default class Root extends React.Component {
  render() {
    return (
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
    );
  }
}
