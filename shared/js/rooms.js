/* ══════════════════════════════════════════════════════════
   TravelRunning — Room Types & Capacity
   ══════════════════════════════════════════════════════════ */
window.TR = window.TR || {};

/** All room type definitions */
TR.ROOM_TYPES = [
  { key: 'singole',       label: 'Singola',                                    field3: 'prezzo_singola_3nt',          field4: 'prezzo_singola_4nt',          perPerson: false },
  { key: 'doppie',        label: 'Doppia',                                     field3: 'prezzo_doppia_pp_3nt',        field4: 'prezzo_doppia_pp_4nt',        perPerson: true  },
  { key: 'matrimoniali',  label: 'Matrimoniale',                               field3: 'prezzo_matrimoniale_pp_3nt',  field4: 'prezzo_matrimoniale_pp_4nt',  perPerson: true  },
  { key: 'mat3_ragazzo',  label: 'Matrimoniale + 3\u00b0 letto (ragazzo 12-18)', field3: 'prezzo_mat3_ragazzo_3nt',   field4: 'prezzo_mat3_ragazzo_4nt',     perPerson: false },
  { key: 'mat3_bambino',  label: 'Matrimoniale + 3\u00b0 letto (bambino 2-12)',  field3: 'prezzo_mat3_bambino_3nt',   field4: 'prezzo_mat3_bambino_4nt',     perPerson: false },
  { key: 'triple',        label: 'Tripla',                                     field3: 'prezzo_tripla_3nt',           field4: 'prezzo_tripla_4nt',           perPerson: false },
  { key: 'quadruple',     label: 'Quadrupla',                                  field3: 'prezzo_quadrupla_3nt',        field4: 'prezzo_quadrupla_4nt',        perPerson: false },
];

/** Room types config — returns only types with price > 0 for the event */
TR.getRoomTypes = function(event) {
  return TR.ROOM_TYPES.filter(function(t) { return (event[t.field3] > 0) || (event[t.field4] > 0); });
};

/** Beds per room type */
TR.ROOM_CAPACITY = {
  singole:      1,
  doppie:       2,
  matrimoniali: 2,
  mat3_ragazzo: 3,
  mat3_bambino: 3,
  triple:       3,
  quadruple:    4,
};

/** Calculate total bed count from a room counts object */
TR.calcPostiFromRooms = function(rc) {
  return (rc.n_singole || 0) * 1
    + (rc.n_doppie || 0) * 2
    + (rc.n_matrimoniali || 0) * 2
    + (rc.n_mat3_ragazzo || 0) * 3
    + (rc.n_mat3_bambino || 0) * 3
    + (rc.n_triple || 0) * 3
    + (rc.n_quadruple || 0) * 4;
};

/** Compute n_partecipanti from room counts (with fallback to 1) */
TR.calcNPartecipanti = function(r) {
  return TR.calcPostiFromRooms(r) || 1;
};

/**
 * Calculate room pricing (canonical: WF-PRICING suffix pattern)
 * @param {Object} roomCounts - { n_singole, n_doppie, ... }
 * @param {Object} ev - event record with price fields
 * @param {number} notti - number of nights (3 or 4)
 * @returns {number} total room price
 */
TR.calcPrezzoCamere = function(roomCounts, ev, notti) {
  var suffix = notti === 3 ? '3nt' : notti === 4 ? '4nt' : null;
  if (!suffix) return 0;
  var cfg = [
    { f: 'n_singole',      pk: 'prezzo_singola_'         + suffix, m: 1 },
    { f: 'n_doppie',       pk: 'prezzo_doppia_pp_'       + suffix, m: 2 },
    { f: 'n_matrimoniali', pk: 'prezzo_matrimoniale_pp_' + suffix, m: 2 },
    { f: 'n_mat3_ragazzo', pk: 'prezzo_mat3_ragazzo_'    + suffix, m: 1 },
    { f: 'n_mat3_bambino', pk: 'prezzo_mat3_bambino_'    + suffix, m: 1 },
    { f: 'n_triple',       pk: 'prezzo_tripla_'          + suffix, m: 1 },
    { f: 'n_quadruple',    pk: 'prezzo_quadrupla_'       + suffix, m: 1 },
  ];
  var total = 0;
  for (var i = 0; i < cfg.length; i++) {
    var c = cfg[i];
    var n = roomCounts[c.f] || 0;
    var p = ev[c.pk] || 0;
    if (n > 0 && p > 0) total += p * c.m * n;
  }
  return Math.round(total * 100) / 100;
};
