import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-white items-center justify-center px-6">
          <View className="items-center">
            <View className="w-20 h-20 bg-danger-50 rounded-full items-center justify-center mb-6">
              <AlertTriangle color={colors.danger[500]} size={40} strokeWidth={2} />
            </View>

            <Text className="text-2xl font-bold text-neutral-900 mb-2 text-center">
              Something went wrong
            </Text>

            <Text className="text-base text-neutral-600 text-center mb-8">
              We're sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView className="max-h-48 w-full bg-neutral-100 rounded-xl p-4 mb-6">
                <Text className="text-xs text-danger-600 font-mono">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text className="text-xs text-neutral-700 font-mono mt-2">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              className="bg-primary-600 px-6 py-3 rounded-xl flex-row items-center"
              activeOpacity={0.8}
            >
              <RefreshCw size={20} color="white" strokeWidth={2} />
              <Text className="text-white font-semibold text-base ml-2">
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
