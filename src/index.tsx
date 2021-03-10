import { NativeModules } from 'react-native';

type BdkType = {
  multiply(a: number, b: number): Promise<number>;
};

const { Bdk } = NativeModules;

export default Bdk as BdkType;
