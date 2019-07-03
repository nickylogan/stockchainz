import * as React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SizeProp } from '@fortawesome/fontawesome-svg-core';
import './Loader-styles.css';

interface Props {
  size?: SizeProp;
}

export default class Loader extends React.Component<Props> {
  render() {
    const { size } = this.props;
    return <FontAwesomeIcon {...this.props} size={size} icon="circle-notch" className="loader" />;
  }
}
