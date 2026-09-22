import React from 'react';
import { SelectListScreen } from './SelectListScreen';
import { TRACKER_OPTIONS } from '../../../utils/constants';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';

export function DriverTrackerScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  return (
    <SelectListScreen
      navigation={navigation}
      title="Selecione o rastreador"
      value={data.trackerType}
      onSelect={trackerType => update({ trackerType })}
      groups={[{ label: '', options: TRACKER_OPTIONS }]}
    />
  );
}
