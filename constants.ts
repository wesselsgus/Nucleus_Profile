
import { Host } from './types';

export const NUCLEUS_HOSTS: Host[] = [
  { id: 'jh-01', name: 'nucleus-jump-01', ip: '10.0.1.5', status: 'online', region: 'us-east-1' },
  { id: 'jh-02', name: 'nucleus-jump-02', ip: '10.0.1.6', status: 'online', region: 'eu-west-1' },
  { id: 'prod-web-01', name: 'web-prod-01', ip: '172.16.0.10', status: 'online', region: 'us-east-1' },
  { id: 'prod-db-01', name: 'db-prod-01', ip: '172.16.0.20', status: 'online', region: 'us-east-1' },
  { id: 'stg-api-01', name: 'api-stage-01', ip: '192.168.1.15', status: 'online', region: 'us-west-2' },
];

export const OWASP_TOOLS = [
  'ZAP Scanner',
  'Nikto',
  'Sqlmap (Automated)',
  'SSLScan',
  'Dirb'
];
