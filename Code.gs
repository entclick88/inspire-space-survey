/**
 * แบบสำรวจความคิดเห็นต่อ (ร่าง) กฎการใช้ห้อง Inspire Space
 * Web App backend — บันทึกคำตอบลง Google Sheet และกันการส่งซ้ำจากเครื่องเดิม
 */

const SHEET_ID = '1pol6seeM23mKN0MU2KuO9dvO-ZagkTPm2icyqJ5DaL8';
const SHEET_NAME = 'การตอบกลับ';
const FORM_URL = 'https://entclick88.github.io/inspire-space-survey/';

const HEADERS = [
  'Timestamp',
  'Device ID',
  'Fingerprint',
  'เพศ',
  'ระดับชั้น',
  'ควรใช้เสียงระดับสนทนา (ลดเสียง+เงียบ) และไม่รบกวนผู้อื่น',
  'ควรแยกโซนใช้เสียง และโซนงดใช้เสียง',
  'ควรมีการเปิดเพลงคลอเบาๆ',
  'ควรเพิ่มจำนวน เก้าอี้ beanbag โต๊ะ',
  'ก่อนเข้าใช้พื้นที่ควรวางกระเป๋า สัมภาระ ไว้ด้านนอก (อย่างเป็นระเบียบ)',
  'ใช้หนังสือและอุปกรณ์ด้วยความระมัดระวัง และเก็บเข้าที่เมื่อใช้งานเสร็จ',
  'ควรแบ่งประเภทหนังสือ อย่างเป็นระบบ',
  'ไม่วิ่งเล่นหรือใช้พื้นที่ผิดวัตถุประสงค์',
  'รับประทานอาหารและเครื่องดื่มเฉพาะบริเวณที่กำหนด พร้อมจัดการขยะและทำความสะอาดพื้นที่หลังใช้งาน',
  'ก่อนออกจากพื้นที่ ควรจัดเก็บโต๊ะ เก้าอี้ หมอน และอุปกรณ์ให้เรียบร้อย',
  'มีชั้นวางรองเท้าบริเวณหน้าห้อง นักเรียนทุกคนต้องถอดรองเท้าและวางให้เป็นระเบียบก่อนเข้าใช้พื้นที่',
  'ก่อนออกจากพื้นที่ ควรจัดเก็บโต๊ะ เก้าอี้ หมอน และอุปกรณ์ให้เรียบร้อย (ข้อ 2)',
  'ใช้อุปกรณ์ต่าง ๆ (หมอน เก้าอี้ หนังสือ ฯลฯ) ภายในห้องอย่างสุภาพและระมัดระวัง',
  'แจ้งคุณครูเมื่อพบความเสียหายหรือความเสี่ยงที่อาจก่อให้เกิดอันตรายภายในห้อง',
  'จัดทำสรุปสถิติการใช้ห้องและการยืม–คืนหนังสือเป็นรายเดือน พร้อมมอบเกียรติบัตรเพื่อยกย่องและสร้างแรงจูงใจ',
  'งดแสดงพฤติกรรมที่ไม่เหมาะสมระหว่างบุคคลภายในห้อง Inspire Space',
  'หลีกเลี่ยงการรับประทานอาหารภายในห้อง เพื่อคงบรรยากาศที่เหมาะสมสำหรับการเรียนรู้และการใช้งานร่วมกัน',
  'รับผิดชอบต่อขยะและความสะอาดของพื้นที่ส่วนรวม ส่งผลต่อบรรยากาศ',
  'นักเรียนเห็นด้วยหรือไม่กับการจัดให้มีมุมบอร์ดเกมในห้อง Inspire Space เพื่อส่งเสริมการเรียนรู้ การคิดวิเคราะห์ และการทำกิจกรรมร่วมกัน',
  'นักเรียนมีความคิดเห็นอย่างไรเกี่ยวกับพื้นห้อง Inspire Space ในอนาคต'
];

// ลำดับ field ที่รับจากหน้า HTML (ต้องตรงกับ name ใน index.html)
const FIELD_ORDER = [
  'gender', 'grade',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12',
  'q13', 'q14', 'q15', 'q16', 'q17', 'q18', 'q19', 'q20'
];

function doGet(e) {
  // API สำหรับหน้าเว็บที่โฮสต์ภายนอก (เช่น GitHub Pages): เช็คว่าเครื่องเคยส่งแล้วหรือยัง
  if (e && e.parameter && e.parameter.action === 'check') {
    return jsonOut_(checkDevice(e.parameter.deviceId || '', e.parameter.fingerprint || ''));
  }
  // บันทึกคำตอบผ่าน GET (เลี่ยงปัญหา redirect ของ POST) — ส่ง payload เป็น JSON ใน query
  if (e && e.parameter && e.parameter.action === 'submit') {
    try {
      return jsonOut_(submitResponse(JSON.parse(e.parameter.payload)));
    } catch (err) {
      return jsonOut_({ ok: false, error: String(err) });
    }
  }
  // เปิดลิงก์ /exec ตรงๆ → พาไปหน้าแบบฟอร์มบน GitHub Pages
  return HtmlService.createHtmlOutput(
    '<meta http-equiv="refresh" content="0; url=' + FORM_URL + '">' +
    '<p style="font-family:sans-serif">กำลังพาไปที่แบบฟอร์ม... หากไม่ไปอัตโนมัติ <a href="' + FORM_URL + '">คลิกที่นี่</a></p>'
  );
}

// API สำหรับรับคำตอบจากหน้าเว็บที่โฮสต์ภายนอก (ส่ง JSON มาทาง POST)
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    return jsonOut_(submitResponse(payload));
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  } else {
    // มีการเพิ่ม/แก้ไขข้อความคำถาม → เขียนหัวคอลัมน์ใหม่ให้ตรง โดยไม่กระทบข้อมูลเดิม
    const cur = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    const same = HEADERS.every(function (h, i) { return String(cur[i]) === h; });
    if (!same) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
        .setFontWeight('bold').setBackground('#673ab7').setFontColor('#ffffff');
    }
  }
  return sheet;
}

/** ลบแถวทดสอบ (Device ID ขึ้นต้นด้วย "test-") — รันเองจากตัวแก้ไข Apps Script */
function clearTestRows() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  for (let r = lastRow; r >= 2; r--) {
    const deviceId = String(sheet.getRange(r, 2).getValue());
    if (deviceId.indexOf('test-') === 0) {
      sheet.deleteRow(r);
    }
  }
}

/** ตรวจว่าเครื่องนี้เคยส่งคำตอบแล้วหรือยัง (เช็คจาก Device ID หรือ Fingerprint) */
function isDuplicate_(sheet, deviceId, fingerprint) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const values = sheet.getRange(2, 2, lastRow - 1, 2).getValues(); // คอลัมน์ B:C
  return values.some(function (row) {
    return (deviceId && row[0] === deviceId) || (fingerprint && row[1] === fingerprint);
  });
}

/** เรียกจากหน้าเว็บตอนโหลด เพื่อเช็คว่าเครื่องนี้ส่งไปแล้วหรือยัง */
function checkDevice(deviceId, fingerprint) {
  try {
    const sheet = getSheet_();
    return { ok: true, submitted: isDuplicate_(sheet, deviceId, fingerprint) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** บันทึกคำตอบ — คืนค่า {ok:true} หรือ {ok:false, duplicate:true} ถ้าเครื่องนี้เคยส่งแล้ว */
function submitResponse(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_();

    if (isDuplicate_(sheet, payload.deviceId, payload.fingerprint)) {
      return { ok: false, duplicate: true };
    }

    const row = [new Date(), payload.deviceId || '', payload.fingerprint || ''];
    FIELD_ORDER.forEach(function (key) {
      row.push(payload.answers && payload.answers[key] ? payload.answers[key] : '');
    });
    sheet.appendRow(row);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  } finally {
    lock.releaseLock();
  }
}
