# 🚀 Deployment Guide — Transport Management System

## Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|---------|-------------------|
| Node.js | 20.x LTS |
| pnpm | 9.x |
| PostgreSQL | Qua Supabase (cloud) |

---

## Bước 1 — Tạo Supabase Project

1. Truy cập [https://supabase.com](https://supabase.com) → **New Project**
2. Chọn region gần nhất (Singapore / Tokyo cho VN)
3. Lưu lại:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon public key** (Settings → API → Project API keys)
   - **service_role secret key** (Settings → API → Project API keys)

---

## Bước 2 — Chạy Database Migration

Trong Supabase Dashboard → **SQL Editor**, paste và chạy lần lượt các file SQL sau:

```
supabase/migrations/001_app_settings.sql
```

> Nếu bạn có thêm migration files, chạy theo thứ tự số.

---

## Bước 3 — Cấu hình Environment Variables

```bash
cp .env.example .env.local
```

Mở `.env.local` và điền các giá trị:

```env
# Supabase (lấy từ bước 1)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Thông tin app
NEXT_PUBLIC_APP_NAME=Tên Công Ty — Quản Lý Vận Tải
NEXT_PUBLIC_COMPANY_NAME=CÔNG TY TNHH VẬN TẢI CỦA BẠN
NEXT_PUBLIC_COMPANY_SHORT_NAME=Tên Ngắn

# URL production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Bước 4 — Cài Dependency & Build

```bash
pnpm install
pnpm build
```

Kiểm tra build thành công, không có lỗi TypeScript.

---

## Bước 5 — Khởi Động

### Option A: Node.js trực tiếp

```bash
pnpm start
```

Ứng dụng chạy tại `http://localhost:3000`

### Option B: Docker

```bash
docker build -t transport-mgmt .
docker run -p 3000:3000 --env-file .env.local transport-mgmt
```

### Option C: Docker Compose (khuyến nghị production)

```bash
docker compose up -d
```

---

## Bước 6 — Tạo Admin Account Đầu Tiên

1. Vào Supabase Dashboard → **Authentication → Users**
2. Tạo user với email và password
3. Trong SQL Editor, thêm profile:

```sql
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'USER_UUID_FROM_AUTH',    -- lấy từ Auth → Users
  'admin@yourcompany.com',
  'Admin',
  'admin',
  true
);
```

4. Đăng nhập vào ứng dụng → vào **/settings** để cấu hình thông tin công ty

---

## Bước 7 — Upload Logo Công Ty

**Cách 1 — File local (đơn giản):**  
Thay thế file `public/logo-company.png` bằng logo của bạn (PNG, 256×256px)

**Cách 2 — URL từ Settings page:**  
Vào `/settings` → dán URL công khai của logo vào trường "URL logo công ty"

---

## Cấu trúc thư mục quan trọng

```
.
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # Server-side API endpoints
│   ├── dashboard/          # Dashboard page
│   ├── bookings/           # Booking creation
│   ├── dispatch/           # Dispatch & Gantt
│   ├── resources/          # Vehicles & drivers
│   ├── services/           # Service packages
│   ├── accounting/         # Financial reports
│   ├── users/              # User management (admin)
│   └── settings/           # Company settings (admin)
├── components/             # React components
├── lib/                    # Utilities, types, Supabase clients
│   ├── pdf/                # PDF generation (quotation, dispatch order)
│   ├── settings/           # Company info (DB + env fallback)
│   └── types/              # TypeScript types
├── public/                 # Static assets (logo, fonts, signature)
├── supabase/migrations/    # SQL migration files
└── .env.example            # Environment variables template
```

---

## Troubleshooting

| Vấn đề | Giải pháp |
|-------|----------|
| Build lỗi TypeScript | Chạy `pnpm lint` để xem chi tiết |
| Login không được | Kiểm tra Supabase URL và anon key trong .env |
| PDF trống thông tin công ty | Vào `/settings` và điền thông tin, hoặc set NEXT_PUBLIC_COMPANY_* env vars |
| Lỗi 500 API | Kiểm tra SUPABASE_SERVICE_ROLE_KEY trong .env |
| Logo không hiện | Kiểm tra file `public/logo-company.png` tồn tại |

---

## Cập nhật phiên bản mới

```bash
git pull
pnpm install
pnpm build
pnpm start        # hoặc restart Docker container
```

---

## Hỗ trợ

Liên hệ nhà cung cấp phần mềm để được hỗ trợ kỹ thuật.
