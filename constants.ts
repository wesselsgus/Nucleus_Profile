
import { Host } from './types';

// Standardized list from the provided infrastructure registry
export const NUCLEUS_HOSTS: Host[] = [
  // Primary Infrastructure (South Africa)
  { id: 'za-11', name: 'ose-com', ip: '192.168.255.11', status: 'online', region: 'af-south-1' },
  { id: 'za-14', name: 'probe01-conco', ip: '192.168.255.14', status: 'online', region: 'af-south-1' },
  { id: 'za-15', name: 'probe01-vodacom-lesotho', ip: '192.168.255.15', status: 'offline', region: 'af-south-1' },
  { id: 'za-17', name: 'ose-echo-jhb-tacacs', ip: '192.168.255.17', status: 'online', region: 'af-south-1' },
  { id: 'za-18', name: 'ose-01-afrihost', ip: '192.168.255.18', status: 'online', region: 'af-south-1' },
  { id: 'za-19', name: 'ose-01-datora', ip: '192.168.255.19', status: 'offline', region: 'af-south-1' },
  { id: 'za-20', name: 'ose-02-econet-lesotho', ip: '192.168.255.20', status: 'online', region: 'af-south-1' },
  { id: 'za-21', name: 'ose-echo-cpt-tacacs', ip: '192.168.255.21', status: 'online', region: 'af-south-1' },
  { id: 'za-22', name: 'gpg-radius', ip: '192.168.255.22', status: 'online', region: 'af-south-1' },
  { id: 'za-23', name: 'ose-echo-jhb-needlecast', ip: '192.168.255.23', status: 'online', region: 'af-south-1' },
  { id: 'za-24', name: 'belvedere', ip: '192.168.255.24', status: 'online', region: 'af-south-1' },
  { id: 'za-25', name: 'svs-za-jhb-se-radiusapn-01', ip: '192.168.255.25', status: 'online', region: 'af-south-1' },
  { id: 'za-26', name: 'probe02-econet', ip: '192.168.255.26', status: 'online', region: 'af-south-1' },
  { id: 'za-27', name: 'Vouchas-CPT-1', ip: '192.168.255.27', status: 'offline', region: 'af-south-1' },
  { id: 'za-28', name: 'vast-vouchas-jhb-ose-1', ip: '192.168.255.28', status: 'online', region: 'af-south-1' },
  { id: 'za-29', name: 'vast-vouchas-jhb-ose-2', ip: '192.168.255.29', status: 'online', region: 'af-south-1' },
  { id: 'za-33', name: 'ose-cmc-auth01-ter', ip: '192.168.255.33', status: 'online', region: 'af-south-1' },
  { id: 'za-34', name: 'ose-cmc-auth02-ter', ip: '192.168.255.34', status: 'online', region: 'af-south-1' },
  { id: 'za-35', name: 'ose-cmc-auth03-cmcho', ip: '192.168.255.35', status: 'online', region: 'af-south-1' },
  
  // Lancet Diagnostics
  { id: 'lan-01', name: 'ose-lancet-ghana-01', ip: '192.168.255.108', status: 'online', region: 'af-south-1' },
  { id: 'lan-02', name: 'ose-lancet-nigeria-01', ip: '192.168.255.110', status: 'online', region: 'af-south-1' },
  { id: 'lan-03', name: 'ose-lancet-zambia-01', ip: '192.168.255.111', status: 'online', region: 'af-south-1' },
  { id: 'lan-04', name: 'ose-lancet-uganda-01', ip: '192.168.255.112', status: 'online', region: 'af-south-1' },
  { id: 'lan-05', name: 'ose-lancet-kenya-01', ip: '192.168.255.116', status: 'online', region: 'af-south-1' },
  
  // Safety SA
  { id: 'ssa-01', name: 'ose-safetysa-boksburg', ip: '192.168.255.124', status: 'online', region: 'af-south-1' },
  { id: 'ssa-02', name: 'ose-safetysa-centurion', ip: '192.168.255.126', status: 'online', region: 'af-south-1' },
  { id: 'ssa-03', name: 'ose-safetysa-ct', ip: '192.168.255.131', status: 'online', region: 'af-south-1' },
  
  // Velocity London
  { id: 'lon-01', name: 'ose-velocity-london-01', ip: '192.168.255.186', status: 'online', region: 'eu-west-1' },
  { id: 'lon-02', name: 'ose-velocity-london-02', ip: '192.168.255.158', status: 'online', region: 'eu-west-1' },
  { id: 'lon-03', name: 'ose-velocity-london-ld6', ip: '192.168.255.159', status: 'online', region: 'eu-west-1' },

  // Transit & Core
  { id: 'cor-01', name: 't6f-nucleus', ip: '172.255.255.42', status: 'online', region: 'us-east-1' },
  { id: 'cor-02', name: 'homer.t6f.co.za', ip: '192.168.255.251', status: 'online', region: 'us-east-1' },
  { id: 'cor-03', name: 'ose-siliconsky-usa-01', ip: '192.168.255.11', status: 'online', region: 'us-east-1' },
];

export const SERVER_TOOLS = [
  'Full Health Audit',
  'Log Analysis (AI)',
  'Rootkit Hunter',
  'Net Topology Mapper',
  'Compliance Check (PCI)',
  'Patch Availability Audit',
  'Process Integrity Scan',
  'User Permission Audit',
  'Kernel Module Check'
];

export const WEB_TOOLS = [
  'ZAP Aggressive Scanner',
  'Nikto Recon',
  'Sqlmap (Automated)',
  'Burp Suite (Passive)',
  'XSS Striker',
  'WPSec Scanner',
  'CMS Recon',
  'SSL/TLS Suite',
  'API Endpoint Discovery',
  'Header Security Check'
];
