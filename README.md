# झलको न्यूज़ (Jhalko News) – News Website

React + TypeScript + Tailwind CSS + Supabase · GitHub Pages par live (baad me Netlify par bhi chalegi)

## Panels
| Panel | URL | Kaun use karega |
|---|---|---|
| Public website | `/` | Sab log – bina login khabar padhna, search, share, video, contact |
| Staff (Reporter) | `/#/staff` | Reporter – khabar likhna, photo upload karna, review ke liye bhejna |
| Admin | `/#/admin` | Malik/Editor – approve/reject, publish, breaking/featured, categories, team, messages |

Login page: `/#/login` (footer me "Staff Login")

## News features
Breaking news ticker · Top story (featured) · Trending (7 din ke sabse zyada views) · Categories · Video news (YouTube) · Search · Tags · Related news · Views counter · Read time · WhatsApp/Facebook/X/Telegram share · Live TV button · "Khabar bhejein" contact form · Mobile responsive · Hindi fonts

## Security
- **Supabase RLS** sab tables par: public sirf *published* khabar padh sakta hai
- **Database trigger**: staff kabhi khud publish nahi kar sakta, breaking/featured nahi laga sakta, kisi aur ki khabar edit nahi kar sakta. Ye rule database me hain, isliye browser se hack karke bhi bypass nahi hote
- Role sirf admin badal sakta hai. Admin apna role khud nahi hata sakta
- Public signup band: account sirf admin banata hai
- Sirf **anon key** frontend me hai. `service_role` key kahin nahi hai
- Article text HTML ki tarah render nahi hota, isliye XSS (script injection) nahi ho sakta
- Photo upload: type/size check, canvas par dobara banai jati hai (EXIF/GPS data aur chhupa code hat jata hai), staff sirf apne folder me upload kar sakta hai
- Content-Security-Policy, login lockout (5 galat try = 5 min block), 30 min idle auto-logout
- Contact form: honeypot + validation + database me length limits

---

## Setup (step by step)

### 1. Logo
Jhalko News ka logo **`public/logo.png`** naam se save karein (square, kam se kam 300×300). Logo na ho to "झ" wala text logo dikhega.

### 2. Supabase
1. https://supabase.com par naya project banayein
2. **SQL Editor** kholein, `supabase/schema.sql` ka poora code paste karke **Run** karein
3. **Authentication → Sign In / Providers → Email**: "Allow new users to sign up" ko **OFF** karein
4. **Authentication → Users → Add user**: apna email + strong password daalein, "Auto Confirm" ✓ karein
5. SQL Editor me ye chalayein (apna email daalein). Isse aap admin ban jayenge:
   ```sql
   alter table public.profiles disable trigger guard_profiles_trg;
   update public.profiles set role = 'admin', full_name = 'Admin'
     where id = (select id from auth.users where email = 'aapka-email@example.com');
   alter table public.profiles enable trigger guard_profiles_trg;
   ```
6. **Project Settings → API** se `Project URL` aur `anon public` key copy karein

### 3. Computer par chalana
```bash
npm install
cp .env.example .env      # .env me URL aur anon key daalein
npm run dev
```

### 4. GitHub Pages par LIVE
1. GitHub par naya repo banayein (jaise `jhalko-news`), saari files push karein
2. Repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_SUPABASE_URL` = aapka project URL
   - `VITE_SUPABASE_ANON_KEY` = anon key
3. Repo → **Settings → Pages → Source: GitHub Actions**
4. `main` branch par push karte hi site live ho jayegi: `https://USERNAME.github.io/jhalko-news/`
5. Supabase → Authentication → URL Configuration → Site URL me yahi link daalein

### 5. Naya reporter (staff) jodna
Supabase → Authentication → Add user, fir Admin Panel → **Team** me uska role `staff` karein.

## Khabar likhne ka format
Khali line = naya paragraph · `## ` = sub-heading · `> ` = quote · `- ` = bullet point

## Details badalna
Phone, email, social links, Live TV link: `src/config.ts`

## Netlify par shift karna (baad me)
Build command `npm run build`, publish folder `dist`, env vars wahi do. `public/_headers` se Netlify par extra security headers apne aap lag jayenge.
