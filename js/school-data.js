/* ============================================================
   SCHOOL DATA MODULE — Acaxel / Highcrest School
   ============================================================
   This module mirrors the structure of the Excel workbook:
   "Highcrest School - Full Year Register 2025_26 - Payment Schedule Updated.xlsx"

   It provides:
   • Static school metadata
   • Fee schedule templates matching the Excel column layout
   • Placeholder arrays ready for real student / payment records
   • Helper functions for totals, lookups, and rendering tables

   To load real data from the Excel file, export the sheets to JSON
   and assign them here, e.g.:
       window.schoolData.loadFeeSchedule(feeScheduleRows);
       window.schoolData.loadFullYearRegister(fullYearRegisterRows);
   ============================================================ */

(function (global) {
  'use strict';

  const _defaults = {
    schoolInfo: {
      name: 'Highcrest School',
      code: 'HCS-2526-01',
      shortName: 'Highcrest',
      motto: 'Nurturing Excellence, Building Character.',
      curriculum: 'Oxford International Curriculum',
      address: 'Adentan, Accra',
      city: 'Accra',
      country: 'Ghana',
      phone: '+233 55 6924 358',
      email: 'info@acaxel.edu.gh',
      website: 'https://acaxel.edu.gh',
      academicYear: '2025/2026',
      terms: [
        { name: 'Term 1', start: '2025-09-09', end: '2025-12-13' },
        { name: 'Term 2', start: '2026-01-13', end: '2026-04-11' },
        { name: 'Term 3', start: '2026-04-27', end: '2026-07-18' }
      ]
    },

    // Matches the "Fee Schedule 2025-26" sheet columns:
    // Class Level | Bird House | Annual Fee | Termly Fee | Staff OIC Fee | Programme | Weeks | Monthly Equiv.
    feeScheduleColumns: [
      'classLevel',
      'birdHouse',
      'annualFee',
      'termlyFee',
      'staffOicFee',
      'programme',
      'weeks',
      'monthlyEquiv'
    ],
    feeSchedule: [
      // { classLevel: 'Nursery 1', birdHouse: 'Bluebird', annualFee: 0, termlyFee: 0, staffOicFee: 0, programme: 'Foundation', weeks: 12, monthlyEquiv: 0 }
    ],

    // Matches the "Summary" sheet columns:
    // Class | Bird House | Enrolled | Annual Fee | T1 Due | T1 Paid | T1 Balance | T1 Rate% | T2 Due | T2 Discount | T2 Paid | T2 Balance | T2 Rate% | T3 Fee | T3 Discount | T3 Arrears | T3 Net Due
    fullYearRegisterColumns: [
      'class',
      'birdHouse',
      'enrolled',
      'annualFee',
      't1Due',
      't1Paid',
      't1Balance',
      't1RatePct',
      't2Due',
      't2Discount',
      't2Paid',
      't2Balance',
      't2RatePct',
      't3Fee',
      't3Discount',
      't3Arrears',
      't3NetDue'
    ],
    fullYearRegister: [
      // { class: 'JSS 1A', birdHouse: 'Eagle', enrolled: 32, annualFee: 2400, ... }
    ],

    // Optional list of students ready for import from a register
    students: (typeof highcrestStudents !== 'undefined') ? highcrestStudents : []
  };

  // In-memory store (clone of defaults)
  const _data = JSON.parse(JSON.stringify(_defaults));

  function _asNumber(value) {
    const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function _formatCurrency(amount) {
    return '₵' + Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const api = {
    // ----------------------------------------------------------------
    // Getters
    // ----------------------------------------------------------------
    getSchoolInfo: () => _data.schoolInfo,

    getFeeSchedule: () => _data.feeSchedule,

    getFullYearRegister: () => _data.fullYearRegister,

    // ----------------------------------------------------------------
    // Loaders (call these with arrays exported from the Excel sheets)
    // ----------------------------------------------------------------
    loadFeeSchedule: function (rows) {
      if (!Array.isArray(rows)) return;
      _data.feeSchedule = rows.map(row => ({
        classLevel: row.classLevel || row['Class Level'] || '',
        birdHouse: row.birdHouse || row['Bird House'] || '',
        annualFee: _asNumber(row.annualFee ?? row['Annual Fee']),
        termlyFee: _asNumber(row.termlyFee ?? row['Termly Fee']),
        staffOicFee: _asNumber(row.staffOicFee ?? row['Staff OIC Fee']),
        programme: row.programme || row['Programme'] || '',
        weeks: _asNumber(row.weeks ?? row['Weeks']),
        monthlyEquiv: _asNumber(row.monthlyEquiv ?? row['Monthly Equiv.'])
      }));
    },

    loadFullYearRegister: function (rows) {
      if (!Array.isArray(rows)) return;
      _data.fullYearRegister = rows.map(row => ({
        class: row.class || row['Class'] || '',
        birdHouse: row.birdHouse || row['Bird House'] || '',
        enrolled: _asNumber(row.enrolled ?? row['Enrolled']),
        annualFee: _asNumber(row.annualFee ?? row['Annual Fee']),
        t1Due: _asNumber(row.t1Due ?? row['T1 Due']),
        t1Paid: _asNumber(row.t1Paid ?? row['T1 Paid']),
        t1Balance: _asNumber(row.t1Balance ?? row['T1 Balance']),
        t1RatePct: _asNumber(row.t1RatePct ?? row['T1 Rate%']),
        t2Due: _asNumber(row.t2Due ?? row['T2 Due']),
        t2Discount: _asNumber(row.t2Discount ?? row['T2 Discount']),
        t2Paid: _asNumber(row.t2Paid ?? row['T2 Paid']),
        t2Balance: _asNumber(row.t2Balance ?? row['T2 Balance']),
        t2RatePct: _asNumber(row.t2RatePct ?? row['T2 Rate%']),
        t3Fee: _asNumber(row.t3Fee ?? row['T3 Fee']),
        t3Discount: _asNumber(row.t3Discount ?? row['T3 Discount']),
        t3Arrears: _asNumber(row.t3Arrears ?? row['T3 Arrears']),
        t3NetDue: _asNumber(row.t3NetDue ?? row['T3 Net Due'])
      }));
    },

    loadStudents: function (rows) {
      if (!Array.isArray(rows)) return;
      _data.students = rows.map(row => ({
        id: row.id || row.studentId || '',
        firstName: row.firstName || row['First Name'] || '',
        lastName: row.lastName || row['Last Name'] || '',
        fullName: row.fullName || row['Full Name'] || '',
        class: row.class || row['Class'] || '',
        birdHouse: row.birdHouse || row['Bird House'] || '',
        gender: row.gender || row['Gender'] || '',
        dateOfBirth: row.dateOfBirth || row['Date of Birth'] || '',
        parentName: row.parentName || row['Parent Name'] || '',
        parentPhone: row.parentPhone || row['Parent Phone'] || '',
        parentEmail: row.parentEmail || row['Parent Email'] || ''
      }));
    },

    // ----------------------------------------------------------------
    // Computed summaries
    // ----------------------------------------------------------------
    getFeeScheduleTotal: function () {
      return _data.feeSchedule.reduce((sum, row) => sum + _asNumber(row.annualFee), 0);
    },

    getFullYearSummary: function () {
      const rows = _data.fullYearRegister;
      const totalEnrolled = rows.reduce((s, r) => s + _asNumber(r.enrolled), 0);
      const totalAnnual = rows.reduce((s, r) => s + _asNumber(r.annualFee), 0);
      const totalT1Due = rows.reduce((s, r) => s + _asNumber(r.t1Due), 0);
      const totalT1Paid = rows.reduce((s, r) => s + _asNumber(r.t1Paid), 0);
      const totalT1Balance = rows.reduce((s, r) => s + _asNumber(r.t1Balance), 0);
      const totalT2Due = rows.reduce((s, r) => s + _asNumber(r.t2Due), 0);
      const totalT2Paid = rows.reduce((s, r) => s + _asNumber(r.t2Paid), 0);
      const totalT2Balance = rows.reduce((s, r) => s + _asNumber(r.t2Balance), 0);
      const totalT3NetDue = rows.reduce((s, r) => s + _asNumber(r.t3NetDue), 0);

      return {
        totalClasses: rows.length,
        totalEnrolled,
        totalAnnual,
        totalT1Due,
        totalT1Paid,
        totalT1Balance,
        totalT2Due,
        totalT2Paid,
        totalT2Balance,
        totalT3NetDue,
        collectionRateT1: totalT1Due ? ((totalT1Paid / totalT1Due) * 100).toFixed(1) : '0.0',
        collectionRateT2: totalT2Due ? ((totalT2Paid / totalT2Due) * 100).toFixed(1) : '0.0'
      };
    },

    // ----------------------------------------------------------------
    // Rendering helpers
    // ----------------------------------------------------------------
    renderFeeScheduleTable: function (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const rows = _data.feeSchedule;
      if (!rows.length) {
        container.innerHTML = '<p class="school-data-empty">No fee schedule data loaded yet. Populate the Excel file or call <code>loadFeeSchedule(rows)</code>.</p>';
        return;
      }
      const headers = ['Class Level', 'Bird House', 'Annual Fee', 'Termly Fee', 'Staff OIC', 'Programme', 'Weeks', 'Monthly'];
      const keys = ['classLevel', 'birdHouse', 'annualFee', 'termlyFee', 'staffOicFee', 'programme', 'weeks', 'monthlyEquiv'];
      let html = '<table class="school-data-table"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      html += rows.map(row => '<tr>' + keys.map((k, i) => {
        const val = row[k];
        return (i === 2 || i === 3 || i === 4 || i === 7) ? `<td>${_formatCurrency(val)}</td>` : `<td>${val || '-'}</td>`;
      }).join('') + '</tr>').join('');
      html += '</tbody></table>';
      container.innerHTML = html;
    },

    renderFullYearRegisterTable: function (containerSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const rows = _data.fullYearRegister;
      if (!rows.length) {
        container.innerHTML = '<p class="school-data-empty">No full-year register data loaded yet. Populate the Excel file or call <code>loadFullYearRegister(rows)</code>.</p>';
        return;
      }
      const headers = ['Class', 'Bird House', 'Enrolled', 'Annual Fee', 'T1 Due', 'T1 Paid', 'T1 Balance', 'T2 Due', 'T2 Paid', 'T2 Balance', 'T3 Net Due'];
      const keys = ['class', 'birdHouse', 'enrolled', 'annualFee', 't1Due', 't1Paid', 't1Balance', 't2Due', 't2Paid', 't2Balance', 't3NetDue'];
      let html = '<table class="school-data-table"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      html += rows.map(row => '<tr>' + keys.map((k, i) => {
        const val = row[k];
        return (i >= 2) ? `<td>${(i === 2) ? val : _formatCurrency(val)}</td>` : `<td>${val || '-'}</td>`;
      }).join('') + '</tr>').join('');
      html += '</tbody></table>';
      container.innerHTML = html;
    },

    // ----------------------------------------------------------------
    // Utility
    // ----------------------------------------------------------------
    reset: function () {
      _data.schoolInfo = JSON.parse(JSON.stringify(_defaults.schoolInfo));
      _data.feeSchedule = [];
      _data.fullYearRegister = [];
      _data.students = [];
    },

    exportToJson: function () {
      return JSON.stringify({
        schoolInfo: _data.schoolInfo,
        feeSchedule: _data.feeSchedule,
        fullYearRegister: _data.fullYearRegister,
        students: _data.students
      }, null, 2);
    },

    // ----------------------------------------------------------------
    // Students
    // ----------------------------------------------------------------
    getStudents: function () {
      return _data.students;
    },

    getStudentsByClass: function (className) {
      return _data.students.filter(s => s.class === className);
    },

    getStudentsByBirdHouse: function (house) {
      return _data.students.filter(s => s.birdHouse === house);
    },

    getUniqueClasses: function () {
      return [...new Set(_data.students.map(s => s.class).filter(Boolean))];
    },

    getUniqueBirdHouses: function () {
      return [...new Set(_data.students.map(s => s.birdHouse).filter(Boolean))];
    },

    renderStudentList: function (containerSelector, opts = {}) {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const students = opts.class ? this.getStudentsByClass(opts.class) : _data.students;
      const limit = opts.limit || students.length;
      const showClass = opts.showClass !== false;
      const showHouse = opts.showHouse !== false;

      if (!students.length) {
        container.innerHTML = '<p class="school-data-empty">No student records loaded.</p>';
        return;
      }

      const displayed = students.slice(0, limit);
      let html = '<ul class="school-student-list">';
      displayed.forEach(s => {
        const meta = [showClass ? s.class : null, showHouse ? s.birdHouse : null].filter(Boolean).join(' · ');
        html += `<li><span class="ss-name">${s.fullName}</span>${meta ? `<span class="ss-meta">${meta}</span>` : ''}</li>`;
      });
      html += '</ul>';
      if (students.length > limit) {
        html += `<p class="school-data-empty" style="margin-top:10px;">Showing ${limit} of ${students.length} students.</p>`;
      }
      container.innerHTML = html;
    },

    renderStudentClassFilter: function (containerSelector, onChange) {
      const container = document.querySelector(containerSelector);
      if (!container) return;
      const classes = this.getUniqueClasses();
      let html = '<select class="school-class-filter"><option value="">All classes</option>';
      classes.forEach(c => { html += `<option value="${c}">${c}</option>`; });
      html += '</select>';
      container.innerHTML = html;
      container.querySelector('select').addEventListener('change', e => {
        if (typeof onChange === 'function') onChange(e.target.value);
      });
    }
  };

  // Expose globally
  global.schoolData = api;
})(window);
