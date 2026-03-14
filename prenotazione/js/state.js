/* ==============================================================
   TravelRunning — Prenotazione: State & Config
   ============================================================== */
window.TR = window.TR || {};
TR.Prenota = TR.Prenota || {};

TR.Prenota.CONFIG = {
  N8N_CONFIG_URL:    TR.CONFIG.N8N_BASE_URL + '/webhook/prenota-config',
  N8N_SUBMIT_URL:    TR.CONFIG.N8N_BASE_URL + '/webhook/prenota',
  N8N_SUBMIT_MOD_URL: TR.CONFIG.N8N_BASE_URL + '/webhook/prenota-modifica',
};

TR.STATE = {
  token: null,
  modalita: 'nuova', // 'nuova' | 'modifica'
  richiesta: null,
  event: null,
  distances: [],
  volo: null,
  hotel_options: [],
  selectedHotel: null, // hotel option used for pricing (or null = use event)
  n_partecipanti: 1,
  servizi: { visita_guidata: false, cena_conviviale: false, ass_annullamento: false, ass_medica: false },
  // Modification mode
  servizi_modifica: { visita_guidata: false, cena_conviviale: false, ass_annullamento: false, ass_medica: false },
  prenotazione: null,
  existing_partecipanti: [],
  existing_pettorali: [],
  new_part_counter: 0,
  new_pett_counter: 0,
  deleted_new_parts: new Set(),
  deleted_new_petts: new Set(),
};
