import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Loader.css';

class Loader extends Component {
    render() {
        return (
            <FontAwesomeIcon icon="circle-notch" className="loader" />
        );
    }
}

export default Loader;