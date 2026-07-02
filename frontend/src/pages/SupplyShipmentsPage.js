import React from 'react';
import CrudTable from '../components/CrudTable';
import { supplyShipmentsApi } from '../services/api';

const columns = [
  { key: 'shipment_id', label: 'Shipment ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'kit_count', label: 'Kits' },
  { key: 'lot', label: 'Lot' },
  { key: 'status', label: 'Status', format: v => <span className={`status-badge status-${v}`}>{v}</span> },
  { key: 'temp_excursion', label: 'Temp Excursion', format: v => v ? 'YES' : 'no' },
];

const fields = [
  { key: 'shipment_id', label: 'Shipment ID' },
  { key: 'trial', label: 'Trial' },
  { key: 'site', label: 'Site' },
  { key: 'kit_count', label: 'Kit Count', type: 'number' },
  { key: 'lot', label: 'Lot' },
  { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in_transit', 'delivered'] },
  { key: 'temp_excursion', label: 'Temp Excursion', type: 'checkbox' },
];

const empty = { shipment_id:'', trial:'', site:'', kit_count:0, lot:'', status:'pending', temp_excursion:false };

export default function SupplyShipmentsPage() {
  return (
    <CrudTable title="Supply Shipments" subtitle="Drug supply / IRT shipments to sites" columns={columns} fields={fields} emptyRow={empty} api={supplyShipmentsApi} />
  );
}
