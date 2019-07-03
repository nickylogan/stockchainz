import * as React from 'react';
import Loader from 'components/Loader';

export default class FetchLoader extends React.Component {
  render() {
    return (
      <span>
        <Loader />
        <span className="ml-2">Fetching data...</span>
      </span>
    );
  }
}
