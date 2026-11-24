import React from 'react';
import OfflinePage from '../pages/OfflinePage.jsx';

export default class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <OfflinePage />;
    }
    return this.props.children;
  }
}
