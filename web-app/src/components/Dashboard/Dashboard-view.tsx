import * as React from 'react';
import { Container } from 'react-bootstrap';

import Header from 'components/Header';
import ItemList from 'components/ItemList';
import { Participant } from 'utils/types';
import SaleList from 'components/SaleList';

interface Props {
  user: Participant;
  handleSignout: () => void;
}

export default class Dashboard extends React.Component<Props> {
  render() {
    const { user, handleSignout } = this.props;
    return (
      <>
        <Header username={user.name} handleSignout={handleSignout} />
        <Container style={{ marginTop: 56 }} className="pt-4">
          <ItemList user={user} />
          <hr />
          <SaleList role={user.type} />
        </Container>
      </>
    );
  }
}
