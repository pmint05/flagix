# Flagix - Safe & Real-time Feature Flag Platform

Flagix là một nền tảng quản lý và phát hành tính năng (Feature Flag) an toàn, thời gian thực và hỗ trợ phân quyền người dùng (Multi-tenant RBAC). Hệ thống được xây dựng theo kiến trúc Monorepo hiệu năng cao bằng `pnpm` và `Turborepo`.

---

## 🏗️ Cấu trúc dự án (Monorepo)

- **`apps/backend`**: Dịch vụ API phát triển bằng NestJS, sử dụng Drizzle ORM kết nối PostgreSQL, phân tích thống kê sự kiện qua BullMQ + Redis, xác thực bằng Better Auth.
- **`apps/frontend`**: Bảng điều khiển quản trị (Admin Dashboard) viết bằng React 19, Vite 8, Tailwind CSS v4, HeroUI v3 và TanStack Router.
- **`apps/demo`**: Ứng dụng client mẫu mô phỏng tích hợp Feature Flag sử dụng SDK chính thức của hệ thống.
- **`packages/sdk-core`**: SDK TypeScript cốt lõi cho các client/server tích hợp cờ, hỗ trợ kết nối SSE thời gian thực.
- **`packages/sdk-react`**: Thư viện bọc React SDK cung cấp `<FlagixProvider>` và hook `useFlag` tối ưu re-render.
- **`packages/shared`**: Nơi lưu trữ các schema validate Zod và kiểu dữ liệu dùng chung.

---

## 🛠️ Hướng dẫn Khởi chạy Hệ thống

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 20+ LTS
- **pnpm**: Phiên bản 10+ hoặc 11+
- **Docker**: Khởi chạy cơ sở dữ liệu PostgreSQL & Redis

### 2. Cài đặt ban đầu
Tại thư mục gốc của dự án:
```bash
# Cài đặt toàn bộ dependencies trong monorepo
pnpm install

# Khởi động PostgreSQL & Redis trong Docker
pnpm run db:up
```

### 3. Đồng bộ Cơ sở dữ liệu & Seed data
```bash
# Đồng bộ schema với database
pnpm --filter backend db:push

# Tạo schema cho Better Auth
pnpm --filter backend auth:generate

# Tạo dữ liệu mẫu khởi đầu (Tài khoản thử nghiệm & Cờ tính năng cờ mẫu)
pnpm --filter backend db:seed
```

### 4. Khởi chạy các ứng dụng ở chế độ Phát triển (Dev)
Bạn có thể khởi chạy song song cả 3 ứng dụng bằng Turborepo:
```bash
pnpm dev
```
Hoặc chạy riêng lẻ từng ứng dụng:
```bash
# Chạy NestJS Backend (Cổng mặc định: http://localhost:9000)
pnpm dev:backend

# Chạy Admin Dashboard (Cổng mặc định: http://localhost:3000)
pnpm dev:frontend

# Chạy Demo App (Cổng mặc định: http://localhost:3001)
pnpm --filter demo dev
```

---

## 🔑 Tài khoản & Key chạy Demo

Sau khi chạy lệnh `db:seed`, dữ liệu mẫu sau đây sẽ được nạp vào hệ thống:

### Tài khoản Admin Đăng nhập Dashboard:
- **Email**: `dev@flagix.com`
- **Mật khẩu**: `password123`

### Client SDK Key cho môi trường Development (chạy demo):
- **SDK Client Key**: `sdk_client_devkey123abcdefghijklmnopqrstuv`
- **Môi trường**: `Development`

Ứng dụng demo tại `apps/demo` được cấu hình mặc định kết nối với API backend tại `http://localhost:9000` và sử dụng Key trên để tải cờ thời gian thực. Bạn có thể thay đổi trạng thái cờ `dark-mode`, `new-homepage`, hoặc `theme-color` trên dashboard để thấy ứng dụng demo cập nhật lập tức mà không cần tải lại trang.

---

## 🧪 Chạy Kiểm thử (Testing)

```bash
# Chạy toàn bộ unit test ở backend
pnpm --filter backend test

# Chạy unit test ở sdk-core
pnpm --filter @flagix/sdk-core test run

# Chạy unit test ở sdk-react
pnpm --filter @flagix/sdk-react test run
```
