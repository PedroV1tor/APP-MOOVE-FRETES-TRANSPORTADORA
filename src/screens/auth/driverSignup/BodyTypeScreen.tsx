import React from 'react';
import { SelectListScreen } from './SelectListScreen';
import { BODY_TYPE_GROUPS } from '../../../utils/constants';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';

export function DriverBodyTypeScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  return (
    <SelectListScreen
      navigation={navigation}
      title="Selecione o tipo de carroceria"
      value={data.bodyType}
      onSelect={bodyType => update({ bodyType })}
      groups={BODY_TYPE_GROUPS}
    />
  );
}
