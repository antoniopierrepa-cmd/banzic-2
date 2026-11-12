import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const iso = (d) => [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
const c = vm.createContext({ iso, Date });
vm.runInContext(app.slice(app.indexOf('  function joursCheckin('), app.indexOf("  document.addEventListener('visibilitychange'", app.indexOf('  function joursCheckin('))), c);
const visible = (x, now, map=false) => c.soireeCheckinVisible(x, new Date(now).getTime(), map);
test('Check-in three days; map only today, including events without DJs', () => {
 for (let n=12;n<=15;n++) {
  const x={date:`2026-11-${n}`, heure:'21:00'};
  assert.equal(visible(x,'2026-11-12T12:00'),n<=14);
  assert.equal(visible(x,'2026-11-12T12:00',true),n===12);
 }
});
test('expiry, overnight continuation and daily rollover', () => {
 const x={date:'2026-11-12',heure:'23:00',heureFin:'04:00'};
 assert.equal(visible(x,'2026-11-13T03:59'),true);
 assert.equal(visible(x,'2026-11-13T04:00'),false);
 assert.equal(visible({date:'2026-11-12',heure:'10:00'},'2026-11-12T16:00'),false);
 assert.equal(visible({date:'2026-11-12'},'2026-11-12T23:59'),true);
 assert.equal(visible({date:'2026-11-12'},'2026-11-13T00:00'),false);
 assert.equal(visible({date:'2026-11-15'},'2026-11-13T00:00'),true);
});
test('calendar dates handle month/year boundaries and DST', () => {
 for(const [now,expected] of [ ['2026-12-31T23:59',['2026-12-31','2027-01-01','2027-01-02']], ['2026-10-24T23:59',['2026-10-24','2026-10-25','2026-10-26']] ])
 assert.deepEqual(Array.from(c.joursCheckin(new Date(now).getTime())),expected);
});
