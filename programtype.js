export { PROGRAM_TYPE_MAP, BCA_COURSE_TO_SEM, BCA_NEW_COURSE_TO_SEM, MCA_NEW_COURSE_TO_SEM };

// ─── Program type mapping ────────────────────────────────────────────────────
const PROGRAM_TYPE_MAP = {
  BCA: 1, MCA: 1, MP: 1, MPB: 1, PGDCA: 1, MBA: 1, MBF: 1,
  MCA_NEW: 1, PGDCA_NEW: 1, BCA_NEW: 1,
  BDP: 2, BA: 2, BCOM: 2, BSC: 2,
  BAG: 3, BCOMG: 3, BSCG: 3, BAVTM: 3, BAECH: 3, BAHIH: 3,
  BAPSH: 3, BAPAH: 3, BASOH: 3, BAEGH: 3, BAPCH: 3, BAEIH: 3,
  BAFSM: 3, BATS: 3, BSCANH: 3, BSCBCH: 3, BSCMCG: 3,
  MEG: 4, MHD: 4, MPS: 4, MSO: 4, MAH: 4, MPA: 4,
  MCOM: 4, MCO: 4, MEC: 4, MAPC: 4, MARD: 4, MSW: 4,
  PGDIBO: 4, PGDRD: 4, PGDT: 4, DECE: 4, CIG: 4, CFN: 4
};

// ─── BCA (Old) course mapping ────────────────────────────────────────────────
const BCA_COURSE_TO_SEM = {
  // Semester I
  FEG02: 1, ECO01: 1, BCS011: 1, BCS012: 1, BCSL013: 1,

  // Semester II
  ECO02: 2, MCS011: 2, MCS012: 2, MCS015: 2, MCS013: 2, BCSL021: 2, BCSL022: 2,

  // Semester III
  MCS021: 3, MCS023: 3, MCS014: 3, BCS031: 3, BCSL032: 3, BCSL033: 3, BCSL034: 3,

  // Semester IV
  BCS040: 4, MCS024: 4, BCS041: 4, BCS042: 4, MCSL016: 4, BCSL043: 4, BCSL044: 4, BCSL045: 4,

  // Semester V
  BCS051: 5, BCS052: 5, BCS053: 5, BCS054: 5, BCS055: 5, BCSL056: 5, BCSL057: 5, BCSL058: 5,

  // Semester VI
  BCS062: 6, MCS022: 6, BCSL063: 6, BCSL064: 6
};

// ─── BCA_NEW course mapping ──────────────────────────────────────────────────
const BCA_NEW_COURSE_TO_SEM = {
  // Semester I
  BEVAE181: 1, BEGLA136: 1, BCS111: 1, BCSL013: 1, BCS012: 1,

  // Semester II
  FEG02: 2, MCS202: 2, MCS203: 2, MCSL204: 2, MCS201: 2, MCSL205: 2,

  // Semester III
  MCS208: 3, MCSL209: 3, MCS207: 3, BCS131: 3, BCSL135: 3, BCS040: 3,

  // Semester IV
  MCS206: 4, BCSL146: 4, BCS053: 4, BCSL147: 4, BCS041: 4, BCOC131: 4,

  // Semester V
  BCS151: 5, BCS042: 5, BCSL159: 5, BCOS184: 5, MSEI023: 5, BECS184: 5,

  // Semester VI
  BCOS185: 6, MSEI027: 6, BCSP165: 6
};

// ─── MCA_NEW course mapping ──────────────────────────────────────────────────
const MCA_NEW_COURSE_TO_SEM = {
  // Semester I
  MCS211: 1, MCS212: 1, MCS213: 1, MCS214: 1, MCS215: 1, MCSL216: 1, MCSL217: 1,

  // Semester II
  MCS218: 2, MCS219: 2, MCS220: 2, MCS221: 2, MCSL222: 2, MCSL223: 2,

  // Semester III
  MCS224: 3, MCS225: 3, MCS226: 3, MCS227: 3, MCSL228: 3, MCSL229: 3,

  // Semester IV
  MCS230: 4, MCS231: 4, MCSP232: 4
};
