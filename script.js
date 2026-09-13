/* =========================================================
   KONFIGURASI
   Ganti PIN rahasia di sini. Harus 6 digit angka.
========================================================= */
const SECRET_PIN = '100708'; // <-- GANTI dengan PIN pilihanmu
const PIN_LENGTH = 6;
const CORRECT_PIN_DELAY_MS = 700; // jeda sebelum otomatis lanjut setelah PIN benar
const WRONG_PIN_SHAKE_MS = 450;   // durasi animasi shake saat PIN salah (samakan dengan CSS)

// deteksi preferensi pengguna untuk mengurangi animasi (aksesibilitas)
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

/* =========================================================
   STATE
========================================================= */
let isAnimating = false;   // true saat transisi antar-screen sedang berjalan
let isPinBusy = false;     // true saat animasi sukses/salah PIN sedang berjalan
let pinInput = [];         // digit yang sudah ditekan, misal ['1','2','3']

/* =========================================================
   AMBIL ELEMEN-ELEMEN PENTING
========================================================= */
const pinDotsEl = document.getElementById('pinDots');
const dotEls = pinDotsEl.querySelectorAll('.dot');
const pinStatusEl = document.getElementById('pinStatus');
const keypadEl = document.getElementById('keypad');

/* =========================================================
   INIT — dijalankan begitu halaman siap
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // semua tombol "next"/"back" cukup diberi atribut data-goto="id-screen-tujuan"
  document.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => goToScreen(btn.dataset.goto));
  });

  // tombol angka di keypad
  keypadEl.querySelectorAll('[data-digit]').forEach((btn) => {
    btn.addEventListener('click', () => onDigitPress(btn.dataset.digit));
  });

  // tombol CLEAR
  document.getElementById('pinClearBtn').addEventListener('click', onClearPress);
});

/* =========================================================
   NAVIGASI ANTAR-SCREEN
   Menyembunyikan screen yang aktif (animasi keluar), lalu
   menampilkan screen tujuan (animasi masuk).
========================================================= */
function goToScreen(targetId) {
  if (isAnimating) return; // cegah klik ganda saat animasi berjalan

  const current = document.querySelector('.screen.active');
  const next = document.getElementById(targetId);
  if (!next || next === current) return;

  isAnimating = true;
  setButtonsDisabled(true);

  // setiap kali screen PIN akan ditampilkan lagi, reset ke kondisi kosong
  if (targetId === 'screen-pin') {
    resetPinState();
  }

  const showNextScreen = () => {
    next.classList.add('active', 'is-entering');

    // beberapa screen punya elemen anak dengan animasi sendiri (card, paragraf).
    // animationend "menggelembung" (bubble) sampai ke `next`, jadi kita cek
    // event.target supaya hanya animasi milik screen itu sendiri yang dihitung.
    function handleEnterEnd(event) {
      if (event.target !== next) return;
      next.removeEventListener('animationend', handleEnterEnd);
      next.classList.remove('is-entering');
      isAnimating = false;
      setButtonsDisabled(false);
    }
    next.addEventListener('animationend', handleEnterEnd);
  };

  if (current) {
    current.classList.add('is-leaving');

    function handleLeaveEnd(event) {
      if (event.target !== current) return;
      current.removeEventListener('animationend', handleLeaveEnd);
      current.classList.remove('active', 'is-leaving');
      showNextScreen();
    }
    current.addEventListener('animationend', handleLeaveEnd);
  } else {
    showNextScreen();
  }
}

// menonaktifkan/mengaktifkan semua tombol di halaman sementara
function setButtonsDisabled(state) {
  document.querySelectorAll('button').forEach((btn) => {
    btn.disabled = state;
  });
}

/* =========================================================
   LOGIKA SECRET PIN
========================================================= */

// dipanggil saat salah satu tombol angka (0-9) ditekan
function onDigitPress(digit) {
  if (isPinBusy || isAnimating) return;
  if (pinInput.length >= PIN_LENGTH) return;

  // hapus pesan "coba lagi." begitu user mulai mencoba lagi
  if (pinStatusEl.textContent) {
    pinStatusEl.textContent = '';
    pinStatusEl.className = 'pin-status';
  }

  pinInput.push(digit);
  updateDots();

  if (pinInput.length === PIN_LENGTH) {
    checkPin();
  }
}

// dipanggil saat tombol CLEAR ditekan — mengosongkan semua input
function onClearPress() {
  if (isPinBusy || isAnimating) return;
  pinInput = [];
  updateDots();
  pinStatusEl.textContent = '';
  pinStatusEl.className = 'pin-status';
}

// mencocokkan input dengan SECRET_PIN
function checkPin() {
  const entered = pinInput.join('');
  if (entered === SECRET_PIN) {
    handleCorrectPin();
  } else {
    handleWrongPin();
  }
}

// PIN benar: animasi sukses, lalu otomatis pindah ke surat
function handleCorrectPin() {
  isPinBusy = true;
  pinDotsEl.classList.add('success');
  pinStatusEl.textContent = 'terbuka.';
  pinStatusEl.className = 'pin-status success';

  const delay = prefersReducedMotion ? 150 : CORRECT_PIN_DELAY_MS;
  setTimeout(() => {
    goToScreen('screen-letter');
  }, delay);
}

// PIN salah: animasi shake, lalu kosongkan input
function handleWrongPin() {
  isPinBusy = true;
  pinDotsEl.classList.add('shake');
  pinStatusEl.textContent = 'coba lagi.';
  pinStatusEl.className = 'pin-status error';

  const shakeDuration = prefersReducedMotion ? 0 : WRONG_PIN_SHAKE_MS;
  setTimeout(() => {
    pinDotsEl.classList.remove('shake');
    pinInput = [];
    updateDots();
    isPinBusy = false;
  }, shakeDuration);
}

// mengisi/mengosongkan lingkaran indikator sesuai jumlah digit
function updateDots() {
  dotEls.forEach((dot, index) => {
    dot.classList.toggle('filled', index < pinInput.length);
  });
}

// dipanggil setiap kali screen PIN akan ditampilkan (termasuk lewat tombol back)
function resetPinState() {
  pinInput = [];
  isPinBusy = false;
  pinDotsEl.classList.remove('success', 'shake');
  pinStatusEl.textContent = '';
  pinStatusEl.className = 'pin-status';
  updateDots();
}
