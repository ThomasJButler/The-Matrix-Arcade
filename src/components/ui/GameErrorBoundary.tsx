import React from 'react';

interface Props {
  children: React.ReactNode;
  gameName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black text-green-500 font-mono p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="text-2xl font-bold text-red-500">SYSTEM ERROR</div>
            <div className="text-sm opacity-70">
              {this.props.gameName ? `${this.props.gameName} crashed` : 'Game crashed'}
            </div>
            {this.state.error && (
              <pre className="text-xs text-red-400 bg-black/50 p-3 rounded border border-red-500/30 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-green-900/50 hover:bg-green-800 border border-green-500/30 rounded transition-colors"
            >
              Restart Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
