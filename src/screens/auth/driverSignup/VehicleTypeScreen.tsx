import React from 'react';
import { SelectListScreen } from './SelectListScreen';
import { VEHICLE_TYPE_GROUPS } from '../../../utils/constants';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';

export function DriverVehicleTypeScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  return (
    <SelectListScreen
      navigation={navigation}
      title="Selecione o tipo de veículo"
      value={data.vehicleType}
      onSelect={vehicleType => update({ vehicleType })}
      groups={VEHICLE_TYPE_GROUPS}
    />
  );
}
