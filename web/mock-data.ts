
import { EdgeEvent, Source, SystemStats, Theme, Language, PatternDef } from './types';

// Mock Sources
export const MOCK_SOURCES: Source[] = [
  { id: 'primary-node-01', type: 'edge_device', status: 'online', eventsToday: 847 },
  { id: 'backup-link-02', type: 'server', status: 'online', eventsToday: 312 },
  { id: 'field-unit-04', type: 'edge_device', status: 'offline', eventsToday: 75 },
  { id: 'workstation-main', type: 'browser', status: 'online', eventsToday: 1205 },
];

// NEW: Patterns specific to Law Office / Security Context
export const MOCK_PATTERNS: PatternDef[] = [
  {
    id: 'pt-001',
    name: 'Rapid Document Exfiltration',
    description: 'User accesses > 20 documents in < 60 seconds.',
    severity: 'critical',
    logic: 'COUNT(file_access) > 20 WINDOW(60s) GROUP_BY(user)',
    hitCount: 2,
    status: 'active'
  },
  {
    id: 'pt-002',
    name: 'After-Hours Access',
    description: 'Login activity detected between 22:00 and 05:00.',
    severity: 'medium',
    logic: 'TIME BETWEEN 22:00 AND 05:00 AND EVENT = "login_success"',
    hitCount: 0,
    status: 'active'
  },
  {
    id: 'pt-003',
    name: 'Shadow IT Detection',
    description: 'Traffic detected to unauthorized cloud storage (Dropbox, GDrive).',
    severity: 'medium',
    logic: 'DNS_QUERY IN ["dropbox.com", "drive.google.com"]',
    hitCount: 14,
    status: 'learning' // "Learning" implies AI is baselining this
  },
  {
    id: 'pt-004',
    name: 'USB Mass Storage Mount',
    description: 'Physical connection of external drive.',
    severity: 'critical',
    logic: 'EVENT = "device_mount" AND TYPE = "usb_storage"',
    hitCount: 1,
    status: 'active'
  }
];

const THEMED_EVENT_TYPES: Record<Theme, Record<string, string[]>> = {
  edge: {
    web: ['page_view', 'click', 'scroll', 'form_submit', 'vital_lcp'],
    iot: ['motion_detected', 'temp_reading', 'humidity', 'door_open'],
    ops: ['cpu_spike', 'memory_warn', 'container_start', 'health_check'],
    security: ['login_success', 'login_fail', 'api_unauth']
  },
  ranch: {
    web: ['market_dashboard', 'weather_radar', 'livestock_cam', 'inv_lookup'],
    iot: ['gate_ajar', 'water_level_low', 'pump_active', 'soil_moisture_critical', 'electric_fence_pulse'],
    ops: ['solar_battery_low', 'uplink_reconnecting', 'firmware_patch', 'local_backup'],
    security: ['perimeter_breach', 'unrecognized_vehicle', 'night_vision_trigger']
  },
  legal: {
    web: ['case_file_open', 'deposition_search', 'redaction_tool', 'billable_timer_start'],
    iot: ['evidence_locker_access', 'printer_secure_job', 'server_room_entry', 'dictation_upload'],
    ops: ['audit_log_sync', 'encryption_verify', 'retention_policy_check', 'email_archived'],
    security: ['unauthorized_usb', 'file_export_blocked', 'after_hours_access', 'failed_biometric']
  },
  corporate: {
    web: ['hr_portal_load', 'crm_dashboard_view', 'ticket_submitted', 'timesheet_save', 'wiki_search'],
    iot: ['printer_paper_low', 'coffee_machine_brew', 'hvac_zone_3_cooling', 'badging_gate_lobby'],
    ops: ['legacy_php_timeout', 'db_lock_wait', 'ad_sync_delay', 'vpn_concentrator_load', 'js_heap_limit'],
    security: ['failed_sso', 'shadow_it_dropbox', 'weak_password_policy', 'usb_policy_violation']
  }
};

// MULTI-LINGUAL DETAILS
const TRANSLATED_DETAILS: Record<Language, Record<Theme, Record<string, string[]>>> = {
  en: {
    edge: {
      web: ['/', '/about', '#signup-btn', '85% depth', 'Pricing Table'],
      iot: ['Zone 1', '72.5°F', '45%', 'Front Entrance'],
      ops: ['>90% utilization', 'Heap limit', 'worker-2', '200 OK'],
      security: ['admin@edge.local', 'suspicious_ip', 'token_expired']
    },
    ranch: {
      web: ['/crops/corn-04', 'Forecast: Hail', 'North Pasture Feed', '#order-feed'],
      iot: ['South Gate', 'Trough #4 < 10%', 'Well Pump B', 'Row 42 Sector 7'],
      ops: ['Battery @ 12%', 'Starlink Searching...', 'v2.1.0 Success', 'SD Card 90%'],
      security: ['Main Driveway', 'Plate: 4X4-TRK', 'Coyote Detected']
    },
    legal: {
      web: ['/matter/24-902', 'Smith_v_Jones.pdf', 'Highlighter Tool', 'Client: MegaCorp'],
      iot: ['Locker #042', 'Printer: 3rd Floor', 'Door: Archives', 'Meeting_Room_B'],
      ops: ['Log_Diario.enc', 'AES-256 OK', '7 Year Purge', 'Exchange Server'],
      security: ['Drive E: Mounted', 'Confidential_Memo.docx', 'User: paralegal_2', 'Fingerprint mismatch']
    },
    corporate: {
      web: ['/intranet/home', '#submit-expense', 'Q3_Report.xlsx', 'User: bob_accounting'],
      iot: ['Printer: Sales', 'Conf Room A', 'AC Unit Roof', 'Breakroom Fridge'],
      ops: ['MySQL Deadlock', 'PHP Fatal Error', 'Latency: 4500ms', 'Disk: 98% Full'],
      security: ['User: intern_1', 'Blocked: Spotify', 'Policy: 30 Day Rot', 'Badge: Visitors']
    }
  },
  es: {
    edge: {
      web: ['/', '/acerca', '#boton-registro', '85% prof.', 'Tabla Precios'],
      iot: ['Zona 1', '22.5°C', '45%', 'Entrada Principal'],
      ops: ['>90% utilización', 'Límite Heap', 'worker-2', '200 OK'],
      security: ['admin@edge.local', 'ip_sospechosa', 'token_caducado']
    },
    ranch: {
      web: ['/cultivos/maiz-04', 'Pronóstico: Granizo', 'Alimento Pasto Norte', '#pedir-grano'],
      iot: ['Portón Sur', 'Bebedero #4 < 10%', 'Bomba Pozo B', 'Fila 42 Sector 7'],
      ops: ['Batería @ 12%', 'Starlink Buscando...', 'v2.1.0 Éxito', 'SD Card 90%'],
      security: ['Camino Principal', 'Placa: 4X4-TRK', 'Coyote Detectado']
    },
    legal: {
      web: ['/caso/24-902', 'Smith_v_Jones.pdf', 'Resaltador', 'Cliente: MegaCorp'],
      iot: ['Casillero #042', 'Impresora: Piso 3', 'Puerta: Archivos', 'Sala_Juntas_B'],
      ops: ['Log_Diario.enc', 'AES-256 OK', 'Purga 7 Años', 'Servidor Exchange'],
      security: ['Disco E: Montado', 'Memo_Confidencial.docx', 'Usuario: paralegal_2', 'Huella no coincide']
    },
    corporate: {
      web: ['/intranet/inicio', '#enviar-gastos', 'Reporte_Q3.xlsx', 'Usuario: contabilidad'],
      iot: ['Impresora: Ventas', 'Sala Conf A', 'Aire Acond', 'Refri Cocina'],
      ops: ['MySQL Bloqueo', 'PHP Error Fatal', 'Latencia: 4500ms', 'Disco: 98% Lleno'],
      security: ['Usuario: pasante', 'Bloqueado: Spotify', 'Poliza: 30 Dias', 'Gafete: Visitas']
    }
  },
  pt: {
    edge: {
      web: ['/', '/sobre', '#btn-cadastro', '85% prof.', 'Tabela Preços'],
      iot: ['Zona 1', '22.5°C', '45%', 'Entrada Principal'],
      ops: ['>90% utilização', 'Limite Heap', 'worker-2', '200 OK'],
      security: ['admin@edge.local', 'ip_suspeito', 'token_expirado']
    },
    ranch: {
      web: ['/culturas/milho-04', 'Previsão: Granizo', 'Pasto Norte', '#pedido-racao'],
      iot: ['Portão Sul', 'Bebedouro #4 < 10%', 'Bomba Poço B', 'Fila 42 Setor 7'],
      ops: ['Bateria @ 12%', 'Starlink Buscando...', 'v2.1.0 Sucesso', 'SD Card 90%'],
      security: ['Entrada Principal', 'Placa: 4X4-TRK', 'Coyote Detectado']
    },
    legal: {
      web: ['/processo/24-902', 'Silva_v_Santos.pdf', 'Ferramenta Realce', 'Cliente: MegaCorp'],
      iot: ['Armário #042', 'Impressora: 3º Andar', 'Porta: Arquivos', 'Sala_Reuniao_B'],
      ops: ['Log_Diario.enc', 'AES-256 OK', 'Purga 7 Anos', 'Servidor Exchange'],
      security: ['Disco E: Montado', 'Memo_Confidencial.docx', 'Usuário: paralegal_2', 'Digital não confere']
    },
    corporate: {
      web: ['/intranet/home', '#enviar-despesa', 'Relatorio_Q3.xlsx', 'Usuario: contabilidade'],
      iot: ['Impressora: Vendas', 'Sala Conf A', 'Ar Condicionado', 'Geladeira Copa'],
      ops: ['MySQL Deadlock', 'PHP Erro Fatal', 'Latencia: 4500ms', 'Disco: 98% Cheio'],
      security: ['Usuario: estag_1', 'Bloqueado: Spotify', 'Politica: 30 Dias', 'Crachá: Visitas']
    }
  },
  de: {
    edge: {
      web: ['/', '/ueber-uns', '#anmelden', '85% Tiefe', 'Preistabelle'],
      iot: ['Zone 1', '22.5°C', '45%', 'Haupteingang'],
      ops: ['>90% Auslastung', 'Heap Limit', 'worker-2', '200 OK'],
      security: ['admin@edge.local', 'verdaechtige_ip', 'token_abgelaufen']
    },
    ranch: {
      web: ['/ernte/mais-04', 'Wetter: Hagel', 'Nordweide Futter', '#bestellung'],
      iot: ['Südtor', 'Trog #4 < 10%', 'Brunnenpumpe B', 'Reihe 42 Sektor 7'],
      ops: ['Batterie @ 12%', 'Starlink Sucht...', 'v2.1.0 Erfolg', 'SD Karte 90%'],
      security: ['Hauptzufahrt', 'Kennz.: 4X4-TRK', 'Kojote Erkannt']
    },
    legal: {
      web: ['/akte/24-902', 'Schmidt_v_Mueller.pdf', 'Marker Werkzeug', 'Mandant: MegaCorp'],
      iot: ['Schließfach #042', 'Drucker: 3. Stock', 'Tür: Archiv', 'Besprechung_B'],
      ops: ['Tagesprotokoll.enc', 'AES-256 OK', '7 Jahre Löschung', 'Exchange Server'],
      security: ['Laufwerk E: Bereit', 'Vertraulich.docx', 'Benutzer: paralegal_2', 'Fingerabdruck Fehler']
    },
    corporate: {
      web: ['/intranet/home', '#spesen', 'Q3_Bericht.xlsx', 'Benutzer: buchhaltung'],
      iot: ['Drucker: Vertrieb', 'Konferenz A', 'Klimaanlage', 'Kühlschrank'],
      ops: ['MySQL Deadlock', 'PHP Fataler Fehler', 'Latenz: 4500ms', 'Festplatte: 98%'],
      security: ['Benutzer: praktikant', 'Blockiert: Spotify', 'Richtlinie: 30 Tage', 'Ausweis: Besucher']
    }
  }
};

export const generateRandomEvent = (theme: Theme = 'edge', forceVisitor = false, lang: Language = 'en'): EdgeEvent => {
  const categories: ('web' | 'iot' | 'ops' | 'security')[] = forceVisitor 
    ? ['web'] 
    : ['web', 'iot', 'ops', 'web', 'web', 'iot', 'security']; 
  
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // Safe Access with Fallbacks
  // Get Type (Technical ID)
  const typeList = THEMED_EVENT_TYPES[theme]?.[category] || THEMED_EVENT_TYPES['edge'][category] || ['unknown_type'];
  const type = typeList[Math.floor(Math.random() * typeList.length)];
  
  // Get Detail (Localized)
  const langDetails = TRANSLATED_DETAILS[lang] || TRANSLATED_DETAILS['en'];
  const themeDetails = langDetails[theme] || langDetails['edge'] || langDetails['edge']; // Double fallback
  const detailList = themeDetails?.[category] || langDetails['edge']?.[category] || ['unknown_detail'];
  
  const detail = detailList[Math.floor(Math.random() * detailList.length)];
  
  const now = new Date();
  
  return {
    id: Math.random().toString(36).substring(2, 11),
    timestamp: now.toLocaleTimeString(lang === 'en' ? 'en-US' : 'de-DE', { hour12: false }),
    category,
    type,
    detail,
    sourceId: forceVisitor ? 'visitor_session' : MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)].id,
    isVisitor: forceVisitor
  };
};

export const INITIAL_EVENTS: EdgeEvent[] = Array.from({ length: 8 }).map(() => generateRandomEvent('edge', false, 'en'));

export const generateMockStats = (): SystemStats => ({
  eventsToday: 1234 + Math.floor(Math.random() * 100),
  activeSources: 3,
  pendingSync: 42,
  lastSync: '2s ago',
  cpuPercent: 0.3 + Math.random() * 0.2, // Low usage simulation
  ramMb: 42 + Math.random() * 2,
  dbSizeMb: 1.2,
  syncStatus: 'Connected'
});
