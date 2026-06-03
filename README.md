# 🌙 Loonars Skincare Dashboard

Sistem manajemen omnichannel untuk bisnis Loonars Skincare — kelola pesanan Tokopedia, Shopee, website, dan offline dalam satu dashboard.

---

## 🚀 Setup — Cukup 3 Langkah

### Langkah 1 — Clone & Install

```bash
git clone https://github.com/USERNAME/loonars-dashboard.git
cd loonars-dashboard
npm install
```

### Langkah 2 — Setup Environment (rename saja, tidak perlu edit)

```bash
cp .env.example .env
```

✅ Selesai. Semua nilai sudah terisi otomatis.

### Langkah 3 — Jalankan

```bash
npm run dev
```

Buka **http://localhost:5173** dan login.

---

## 🔑 Akun Login

| Email | Password | Dashboard | Role |
|-------|----------|-----------|------|
| `loonarsliving@gmail.com` | *(password di Supabase Auth)* | `/owner` | 👑 Owner |
| `lailakusumawati123@gmail.com` | *(password di Supabase Auth)* | `/admin` | 👤 Tim Admin |

> Jika lupa password, reset via Supabase Dashboard → Authentication → Users → Send reset email.

---

## 📤 Deploy ke Vercel

```bash
# Push ke GitHub dulu
git init
git add .
git commit -m "feat: Loonars Dashboard v1.0"
git branch -M main
git remote add origin https://github.com/USERNAME/loonars-dashboard.git
git push -u origin main
```

Lalu di **vercel.com**:
1. Import repo dari GitHub
2. Tambah Environment Variables dari file `.env.example` (copy-paste nilainya)
3. Deploy — dapat URL langsung!

> Setelah itu, setiap `git push` → Vercel otomatis rebuild & deploy.

---

## ⚙️ Konfigurasi Telegram Bot (Opsional)

Agar dapat notifikasi order baru, stok menipis, dll:

1. Chat **@BotFather** di Telegram → `/newbot` → copy token
2. Tambahkan bot ke grup Telegram kamu
3. Cari Chat ID grup (pakai **@userinfobot**)
4. Buka dashboard → **Pengaturan → Notifikasi Telegram**
5. Isi token & chat ID → klik **Test Notifikasi**

---

## ✨ Fitur Lengkap

### Owner Dashboard (`/owner`)
| Menu | Fitur |
|------|-------|
| Dashboard | Ringkasan omzet, profit, chart 7 hari, order pending |
| Pesanan | Semua order omnichannel, filter, update status, cetak resi |
| Produk & Stok | CRUD produk, update stok, alert stok menipis |
| Pelanggan | CRM, segmentasi, followup terjadwal, WhatsApp link |
| Laporan | Chart omzet & profit, export CSV, kirim Telegram |
| Manajemen Tim | Undang admin, aktif/nonaktif akun |
| Pengaturan | Info toko, Telegram bot, integrasi Tokopedia/Shopee |

### Admin Dashboard (`/admin`)
| Menu | Fitur |
|------|-------|
| Dashboard | Order yang perlu diproses, stok menipis |
| Pesanan | Proses order, input resi, cetak resi |
| Produk & Stok | Lihat stok, tambah/kurangi stok |
| Pelanggan | Data pelanggan, riwayat order, catatan |

---

## 🗄️ Database

**Supabase Project:** `gluoioiimapyhchdasfl` (Region: Singapore — optimal untuk Indonesia)

Tabel: `profiles`, `products`, `customers`, `orders`, `order_items`, `stock_movements`, `notifications`, `settings`, `followup_schedules`

**Fitur database otomatis:**
- ✅ Stok berkurang otomatis saat order di-mark `shipped`
- ✅ Nomor order auto-generate (TKP/SPE/WEB/OFL-YYMMDD-XXXX)
- ✅ Statistik pelanggan update otomatis saat order `done`
- ✅ Realtime update via Supabase subscriptions

---

## 🛠️ Tech Stack

React 18 · Vite 5 · Tailwind CSS 3 · Supabase · React Router 6 · Recharts · Lucide React · React Hot Toast · date-fns

---

*© 2025 Loonars Skincare — Dibuat dengan ❤️*
