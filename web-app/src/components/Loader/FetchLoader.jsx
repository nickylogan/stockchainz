import React, { Component } from 'react';
import Loader from './Loader';

class FetchLoader extends Component {
    render() {
        return (
            <span><Loader /><span className="ml-2">Fetching data...</span></span>
        );
    }
}

export default FetchLoader;