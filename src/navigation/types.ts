// Parámetros del Drawer (solo las pantallas que estarán en el menú lateral)
export type DrawerParamList = {
  LotesScreen: undefined;
  TransferenciasScreen: undefined;
  AsignacionesScreen: undefined;
  SilosScreen: undefined;
};

// Parámetros del Stack principal (todas las demás pantallas + Drawer)
export type RootStackParamList = {
  Login: undefined;
  Menu: undefined;
  Produccion: { seccionSeleccionada?: string } | undefined;
  Alimento: undefined;
  Existencia: undefined;
  Envase: undefined;
  ResumenSeccion: undefined;
  SeleccionSeccion: undefined;
  MainApp: { screen?: keyof DrawerParamList; params?: any } | undefined;
};
