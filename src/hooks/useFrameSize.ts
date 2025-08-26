import * as React from 'react';
import { Platform, Dimensions } from 'react-native';

type Frame = {
  width: number;
  height: number;
};

// Hook compatible con web y móvil para obtener el tamaño de la ventana
export function useFrameSize(): Frame {
  const [frame, setFrame] = React.useState<Frame>(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setFrame({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  return frame;
}

// Hook para obtener dimensiones específicas
export function useFrameSizeSelector<T>(
  selector: (frame: Frame) => T
): T {
  const frame = useFrameSize();
  return selector(frame);
}

// Provider compatible con web
export function FrameSizeProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return <>{children}</>;
} 