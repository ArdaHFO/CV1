# 🚀 AI-Powered CV Builder & Career Hub

Modern, AI destekli CV oluşturma ve kariyer yönetim platformu. Next.js 14, Supabase ve OpenAI ile geliştirilmiştir.

## ✨ Özellikler

### ✅ Tamamlanan Özellikler

- **🎨 Çoklu CV Versiyon Yönetimi**: Farklı pozisyonlar için ayrı CV versiyonları oluşturun
- **🤖 AI Destekli İçerik**: OpenAI GPT-4o ile CV optimizasyonu ve niyet mektubu oluşturma
- **📝 Gelişmiş Editör**: Form tabanlı CV düzenleme arayüzü
- **🎯 Modern Şablonlar**: Profesyonel ve minimalist CV şablonları
- **👤 Kullanıcı Yönetimi**: Supabase Auth ile güvenli kimlik doğrulama
- **📊 Dashboard**: CV'lerinizi görüntüleyin, düzenleyin ve yönetin
- **💾 Otomatik Kaydetme**: Değişikliklerinizi anında kaydedin

### 🚧 Geliştirme Aşamasında

- **💼 LinkedIn İş Arama**: İş ilanlarını arayın ve CV'nizi optimize edin
- **📄 LaTeX Desteği**: Akademik CV'ler için LaTeX editörü
- **🔗 QR Kod & Dijital Paylaşım**: CV'nizi özel URL ile paylaşın
- **📥 PDF Export**: CV'nizi PDF olarak indirin

## 🛠 Teknoloji Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: OpenAI GPT-4o API
- **State Management**: Zustand
- **PDF Generation**: @react-pdf/renderer
- **Code Editor**: Monaco Editor (LaTeX için)

## 📦 Kurulum

### Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Supabase hesabı
- OpenAI API anahtarı

### Adımlar

1. **Bağımlılıkları yükleyin**
```bash
npm install
```

2. **Ortam değişkenlerini ayarlayın**

`.env.local` dosyasını düzenleyin ve gerçek değerlerinizi ekleyin:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Supabase veritabanını kurun**

`supabase/migrations/001_initial_schema.sql` dosyasındaki SQL komutlarını Supabase SQL Editor'da çalıştırın.

4. **Development server'ı başlatın**
```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## 🗂 Proje Yapısı

```
cv-builder/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Dashboard layout
│   ├── editor/[id]/              # CV Editor
│   ├── api/ai/                   # AI endpoints
│   └── page.tsx                  # Landing page
├── features/                     # Feature modules
│   └── editor/
│       ├── components/           # Editor forms
│       └── templates/            # CV templates
├── lib/                          # Shared utilities
│   ├── supabase/                 # Supabase client
│   ├── ai/                       # AI utilities
│   ├── auth/                     # Auth helpers
│   ├── database/                 # Database queries
│   └── store/                    # Zustand stores
├── types/                        # TypeScript types
└── components/ui/                # Shadcn UI components
```

## 🎯 Kullanım

### 1. Kayıt Olun
- Ana sayfadan "Kayıt Ol" butonuna tıklayın
- Bilgilerinizi girin ve hesap oluşturun

### 2. CV Oluşturun
- Dashboard'dan "Yeni CV Oluştur" butonuna tıklayın
- CV'nize bir başlık verin (örn: "Frontend Developer")

### 3. CV'nizi Düzenleyin
- Kişisel bilgilerinizi girin
- İş deneyimlerinizi ekleyin
- Eğitim bilgilerinizi girin
- Yeteneklerinizi listeleyin

### 4. AI ile İyileştirin (Yakında)
- "AI ile İyileştir" butonuna tıklayın
- İş ilanı açıklamasını yapıştırın
- AI önerilerini alın ve CV'nizi optimize edin

## 🔑 API Endpoints

### AI Endpoints

#### Optimize CV
```typescript
POST /api/ai/optimize
{
  "resumeContent": ResumeContent,
  "jobDescription": string
}
```

#### Generate Cover Letter
```typescript
POST /api/ai/cover-letter
{
  "resumeContent": ResumeContent,
  "jobListing": JobListing,
  "tone": "professional" | "friendly" | "formal"
}
```

#### Improve Section
```typescript
POST /api/ai/improve
{
  "sectionName": string,
  "content": string,
  "context": string
}
```

## 📝 Veritabanı Şeması

### Tables

- **profiles**: Kullanıcı profilleri
- **resumes**: CV başlıkları ve metadata
- **resume_versions**: CV içeriği ve versiyonları
- **job_searches**: İş arama geçmişi
- **ai_optimizations**: AI optimizasyon geçmişi

Detaylı şema için `supabase/migrations/001_initial_schema.sql` dosyasına bakın.

## 🎨 CV Şablonları

### Modern Template ✅
- Temiz ve profesyonel tasarım
- İletişim bilgileri vurgulanmış
- İş deneyimi odaklı

### Diğer Şablonlar (Gelecek)
- Akademik Template (LaTeX)
- Minimalist Template
- Designer Template

## 🚀 Deployment

### Vercel ile Deploy

```bash
vercel
```

### Environment Variables

Production'da environment variables'ları Vercel dashboard'dan ayarlayın.

## 📚 Gelecek Özellikler

- [ ] LinkedIn iş arama entegrasyonu
- [ ] LaTeX editör ve önizleme
- [ ] QR kod oluşturma
- [ ] PDF export
- [ ] Çoklu şablon seçimi
- [ ] CV analitiği
- [ ] Tema özelleştirme

## 🐛 Bilinen Sorunlar

- Preview özelliği henüz tamamlanmadı
- PDF export işlevi geliştirilme aşamasında
- LinkedIn entegrasyonu için API erişimi gerekli

---

**Not**: Bu proje aktif geliştirme aşamasındadır. Yeni özellikler düzenli olarak eklenmektedir.
