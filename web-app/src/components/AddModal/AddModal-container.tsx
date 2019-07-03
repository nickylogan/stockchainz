import * as React from 'react';
import { default as AddModalView } from './AddModal-view';
import { Item, RequestError } from 'utils/types';
import toaster from 'toasted-notes';

interface State {
  processing: boolean;
  name: string;
  description: string;
}

interface Props {
  shown: boolean;
  onHide: () => void;
  handleSuccess?: () => void;
  handleError?: (err: any) => void;
}

export default class AddModal extends React.Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);

    this.state = {
      processing: false,
      name: '',
      description: ''
    };

    this.handleChangeName = this.handleChangeName.bind(this);
    this.handleChangeDescription = this.handleChangeDescription.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChangeName(evt: { target: { value: string } }) {
    this.setState({
      name: evt.target.value
    });
  }

  handleChangeDescription(evt: { target: { value: string } }) {
    this.setState({
      description: evt.target.value
    });
  }

  handleSubmit() {
    const { onHide: close } = this.props;
    const { handleSuccess, handleError } = this.props;
    this.setState({ processing: true });

    Item.requestCreate(this.state.name, this.state.description)
      .then(_ => {
        toaster.notify('✔ Successfully created item', {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleSuccess) handleSuccess();
      })
      .catch(err => {
        console.log(err);
        toaster.notify('❌ Failed to create item: ' + RequestError.parseError(err), {
          position: 'bottom-right',
          duration: 3000
        });
        if (handleError) handleError(err);
      })
      .finally(() => {
        this.setState({ processing: false });
        close();
      });
  }

  render() {
    const { onHide, shown } = this.props;
    const { name, description, processing } = this.state;
    return (
      <AddModalView
        onHide={onHide}
        shown={shown}
        processing={processing}
        name={name}
        description={description}
        handleChangeName={this.handleChangeName.bind(this)}
        handleChangeDescription={this.handleChangeDescription.bind(this)}
        handleSubmit={this.handleSubmit.bind(this)}
      />
    );
  }
}
