
import { Host } from './types';

export const NUCLEUS_HOSTS: Host[] = [
  { id: 'nucleusJump', name: 'nucleus-jump', ip: '10.0.1.5', status: 'online', region: 'Africa' },
  { id: 'homer', name: 'nucleus-jump-homer', ip: '10.0.1.6', status: 'online', region: 'eu-west-1' },
  { id: 'prod-web-01', name: 'web-prod-01', ip: '172.16.0.10', status: 'online', region: 'us-east-1' },
];

export const OWASP_TOOLS = [
  'ZAP Scanner',
  'Nikto',
  'Sqlmap (Automated)',
  'SSLScan',
  'Dirb'
];

export const RAW_ETC_HOSTS = `
  ose-com	192.168.255.11
probe01-conco	192.168.255.14
192.168.255.15    probe01-vodacom-lesotho #Offline pending new server's to be deployed
ose-echo-jhb-tacacs	192.168.255.17
ose-01-afrihost	192.168.255.18
192.168.255.19    ose-01-datora #Turned off by IPE, Keep on the list
ose-02-econet-lesotho	192.168.255.20
ose-echo-cpt-tacacs	192.168.255.21
gpg-radius	192.168.255.22
ose-echo-jhb-needlecast	192.168.255.23
belvedere	192.168.255.24
svs-za-jhb-se-radiusapn-01	192.168.255.25
probe02-econet	192.168.255.26
192.168.255.27    Vouchas-CPT-1 #Turned off
vast-vouchas-jhb-ose-1	192.168.255.28
vast-vouchas-jhb-ose-2	192.168.255.29
ose-echo-cpt-needlecast	192.168.255.30
ose-altech-emm02	192.168.255.31
ose-cmc-auth01-ter	192.168.255.33
ose-cmc-auth02-ter	192.168.255.34
ose-cmc-auth03-cmcho	192.168.255.35
ose-01-cmc-tacacs	192.168.255.36
probe01-ekhwesi	192.168.255.38
192.168.255.39    ose01-hilton-college #offline - confirmed
probe01-hollywood	192.168.255.40
ose-01-infogro	192.168.255.41
IDMAIM01	192.168.255.42
OSE-Mango5	192.168.255.44
probe01-mitsol	192.168.255.45
ose-mix_telematics	192.168.255.46
jumo-ose-1	192.168.255.48
ose-02-paratus	192.168.255.50
ose-02-pwc	192.168.255.52
probe01-pwc	192.168.255.53
ose-01-rcs	192.168.255.54
ose-02-rcs	192.168.255.55
ose-01-red24	192.168.255.56
ose-01-redefine	192.168.255.57
192.168.255.58    ose-02-redefine #Offline asked support to log it - not marked prod?
ose-comcorp	#192.168.255.59
probe01-saicom	192.168.255.60
OSE-01-STCYPRIANS	192.168.255.66
ose-tnm	192.168.255.68
# 192.168.255.71    ose-01-vast-vouchas
ose-prosperity-africa-01	192.168.255.71
ose-prosperity-nam-01	192.168.255.71
ose-velocity-claremont	192.168.255.72
ose-velocity-parklands	192.168.255.73
ose-fnet-01	192.168.255.80
ose-netcare-milpark-01	192.168.255.89
ose-netcare-milpark-02	192.168.255.90
ose_oceana_cpt	192.168.255.91
ose-velocity-isando	#192.168.255.92
ose-outsurance-01	192.168.255.93
ose-gz_industries	192.168.255.94
ose-citylodge-1	192.168.255.96
#192.168.255.97	  ose-citylodge-2 # Not needed anymore
#192.168.255.98	  ose-citylodge-3 # Not needed anymore
ose-echo-01	192.168.255.99
ose-ekurhuleni-auth	192.168.255.100
ose-echo-02	192.168.255.101
vast-vouchas-dev	192.168.255.102
ose-02-siliconsky	192.168.255.1
ose-ionline-aws-01	192.168.255.10
ose-webberwentzel-01	192.168.255.102
t6f-ansible	192.168.255.103
t6f-leela-01	192.168.255.104
ose-cbc-01	192.168.255.105
t6f-test	192.168.255.106
srvgrafstack	192.168.255.107
ose-lancet-ghana-01	192.168.255.108
ose-st-cyprians-02	192.168.255.109
ose-siliconsky-usa-01	192.168.255.11
ose-lancet-nigeria-01	192.168.255.110
ose-lancet-zambia-01	192.168.255.111
ose-lancet-uganda-01	192.168.255.112
ose-lancet-tanzania-01	192.168.255.113
ose-lancet-rwanda-01	192.168.255.114
ose-lancet-zimbabwe-01	192.168.255.115
ose-lancet-kenya-01	192.168.255.116
ose-lancet-mozambique-01	192.168.255.117
ose-minerals-council-01	192.168.255.118
ose-ionline-aws-02	192.168.255.119
ose-econet-lesotho-01	192.168.255.120
ose-bankserv-tacacs-01	192.168.255.121
ose-shisanyama-01	192.168.255.122
ose-ballito-isp-01	192.168.255.123
ose-safetysa-boksburg	192.168.255.124
ose-safetysa-bloemfontein	192.168.255.125
ose-safetysa-centurion	192.168.255.126
ose-safetysa-east-london	192.168.255.127
ose-safetysa-kathu	192.168.255.128
ose-safetysa-midrand	192.168.255.129
ose-kazang-01	192.168.255.13
ose-safetysa-nelspruit	192.168.255.130
ose-safetysa-ct	192.168.255.131
ose-safetysa-vanderbijlpark	192.168.255.132
ose-safetysa-witbank	192.168.255.133
ose-safetysa-secunda	192.168.255.134
ose-safetysa-polokwane	192.168.255.135
ose-safetysa-rustenburg	192.168.255.136
ose-safetysa-richardsbay	192.168.255.137
ose-safetysa-pe	192.168.255.138
ose-safetysa-durban-westville	192.168.255.139
ose-vodacomlesotho-01	192.168.255.14
ose-safetysa-ac-cpt	192.168.255.140
ose-safetysa-ac-dbn	192.168.255.141
ose-safetysa-ac-pe	192.168.255.142
ose-safetysa-ac-oudts	192.168.255.143
ose-safetysa-ac-mid	192.168.255.144
ose-cch-01	192.168.255.145
ose-sodecia-01	192.168.255.146
ose-paycorp-02	192.168.255.147
ose-medis-kzn-01	192.168.255.148
ose-econet-lesotho-tacacs-01	192.168.255.149
ose-medis-02	192.168.255.15
adminbb-KVM	192.168.255.150
ose-pageautomation	192.168.255.151
ose-fibregeeks	192.168.255.152
ose-saica-02	192.168.255.153
ose-saicom-apn04	192.168.255.154
ose-saicom-apn03	192.168.255.155
ose-ignition-ct-01	192.168.255.156
saicom-radiusapn-01	192.168.255.157
ose-velocity-london-02	192.168.255.158
ose-velocity-london-ld6	192.168.255.159
ose-cmc-tacacs-01	192.168.255.160
ose-webberwentzel-02	192.168.255.161
t6f-hermes	192.168.255.162
ose-comcorp-01	192.168.255.163
ose-mvnx-01	192.168.255.164
ose-velocity-isando-01	192.168.255.165
ose-velocity-claremont-02	192.168.255.166
ose-e4mesh-01	192.168.255.167
ose-universal	192.168.255.168
ose-fem-01	192.168.255.169
ose-medikredit-01	192.168.255.170
ose-01-paycorp	192.168.255.171
ose-02-paycorp	192.168.255.172
ose-velocity-london-ld6-dc	192.168.255.173
ose-saicom	192.168.255.174
fulcrum-dev	192.168.255.175
ose-ideacandy-01	192.168.255.176
mc-jhb-1	192.168.255.177
ose-02-afrihost	192.168.255.178
ose-mix-telematics-Africa-01	192.168.255.180
ose-01-silicon-sky	192.168.255.181
ose-afrit-01	192.168.255.182
ose-lra	192.168.255.183
ose-recharger-01	192.168.255.184
ose-medis-01	192.168.255.185
ose-velocity-london-01	192.168.255.186
t6f-wazuh	192.168.255.187
ose-khanya-africa-01	192.168.255.189
prosperity-africa-01	192.168.255.195
ose-newsclip	192.168.255.2
ose-saica-03	192.168.255.245
ose-trinity-telecom	192.168.255.3
ose-metrofibre-01	192.168.255.4
ose-gic-01	192.168.255.5
ose-paratus-botswana	192.168.255.52
ose-ideacandy-02	192.168.255.6
ose-hiltoncollege-01	192.168.255.7
ose-prosperity-africa-01	192.168.255.71
ose-stpetersprep-01	192.168.255.8
365auditor	192.168.255.81
ose-agsa-01	192.168.255.9
OMI-ZA-BRE-DC7-D07-MSE-01	102.223.63.1
tacacs-globe-com	10.1.126.15
GT-BNT001-BARKO-VEREENIGING	172.31.197.26
KZN-IS001-CAPITEC-RB-PLAZA-RB-AP-E	172.31.130.27
FortiWeb	10.1.126.4
dce01.isa.irisns.com	102.68.44.4
dce02.isa.irisns.com	102.68.44.5
Cerba-Lancet-Ghana-OSE	192.168.255.108
Cerba-Lancet-mozambique-OSE	192.168.255.117
Cerba-Lancet-zambia-OSE	192.168.255.111
Cerba-Lancet-nigeria-OSE	192.168.255.110
Cerba-Lancet-uganda-OSE	192.168.255.112
Cerba-Lancet-tanzania-OSE	192.168.255.113
Cerba-Lancet-rwanda-OSE	192.168.255.114
Cerba-Lancet-zimbabwe-OSE	192.168.255.115
Cerba-Lancet-Kenya-OSE	192.168.255.116
WA-CPT-TER-FW-ACT	168.210.9.211
WC-PLTTNBRG-WTR-RS-RECT	172.28.2.54
Paycore-Primary-ICMP	41.76.231.13
Paycore-Secondary-ICMP	41.76.231.15
WC-LIQ001-CITY-OF-CAPE-TOWN-GRDNS-SHPPNG-CNTR-PTP-NEC	172.31.231.25
Three6Five-VMware	172.16.7.200
Leela	10.36.50.200
t6f-nucleus	172.255.255.42
Support-Kayako	192.168.255.253
homer.t6f.co.za	192.168.255.251
vortex	192.168.255.250
DEV-OSE	192.168.255.243
t6f-cnet-vfaz	10.1.126.12
WAN1-LIQUID-TELECOMS	41.160.61.194
WAN1-NEOTEL	41.169.24.113
UHC-TERACO-WAN1	41.169.24.117
SELFMED-WAN1	41.0.184.106
ose-cmc-auth01-ter	192.168.255.33
ose-cmc-auth02-ter	192.168.255.34
ose-cmc-auth03-cmcho	192.168.255.35
ComCorp_PROD-WAN1	196.35.71.129
ComCorp_DR-WAN1	196.26.165.244
ComCorp_Office-WAN1	197.234.150.142
AFRIT-POM-WAN1-VOX	41.193.215.126
AFRIT-POM-WAN1-INT	102.33.21.162
mc-ter-fw1-wan1	102.209.142.70
Primary_IP-TRANSIT_Echo	41.76.228.115
Secondary_IP-TRANSIT_Echo	41.76.228.117
ose-t6f-auth-02	192.168.255.242
JHB-HOSTED-WAN1-IS	196.35.70.99
WAN1-LIQUID-CT	41.169.35.162
WAN1-LIQUID-PE	41.162.6.98
WAN1-LIQUID-DBN	41.162.25.162
WAN1-LIQUID-BLM	41.162.56.210
CCH-DUNCANDOCKS-SECONDARY-LINK	197.221.122.242
CCH-DUNCANDOCKS-PRIMARY-LINK	197.221.121.126
CCH-PAARDENEILAND-PRIMARY-LINK	197.221.121.110
CCH-PAARDENEILAND-SECONDARY-LINK	197.221.121.124
CCH-EPPING-PRIMARY-LINK	197.221.122.190
CCH-IDUBE-SECONDARY-LINK	197.221.124.169
TestEric_JHB-FGT-WAN1	102.216.161.26
TestEric_JHB-SAICOM_nexthop	102.216.161.25
Newdclip-JHB-WAN1-XDSL	41.180.70.139
St.Cyprians-WAN-COOL-IDEAS	155.93.255.224
St.Cyprians-WAN-CYBERSMART	197.155.7.150
ose-01-cmc-tacacs	192.168.255.36
VT-SGP-WAN	61.13.206.154
mc-jhb-1	192.168.255.177
DEV-OSE-2	192.168.255.241
silicon_core_is_02	192.168.255.236
silicon_core_ter_02	192.168.255.235
silicon_core_ter_01	192.168.255.234
ose-echo-1	192.168.255.99
ose-echo-02	192.168.255.101
ose-echo-jhb-tacacs	192.168.255.17
ose-echo-cpt-tacacs	192.168.255.21
ose-echo-jhb-needlecast	192.168.255.23
ose-echo-cpt-needlecast	192.168.255.30
silicon-core-ter-03	192.168.255.249
OMI-ZA-ISA-DC9-H07-MSE-01	102.223.62.1
OMI-ZA-ISA-DC9-I07-MSE-02	102.223.62.2
OMI-ZA-BRE-DC7-E07-MSE-02	102.223.63.2
tacacs-old-mutual	10.1.126.15
gpg-radius	192.168.255.22

`;
